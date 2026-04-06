import { auth } from "@clerk/nextjs/server";
import { deleteImageFromR2, uploadImageToR2 } from "../r2-storage";
import postgres, { type JSONValue } from "postgres";

export const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
});

/**
 * Regista uma aÃ§Ã£o de usuÃ¡rio em user_action_logs.
 * Nunca lanÃ§a excepÃ§Ã£o â€“ falhas de logging nÃ£o devem bloquear a aÃ§Ã£o principal.
 */
export async function logAction(
    clerkUserId: string | null | undefined,
    interactionType: string,
    path: string,
    metadata?: Record<string, unknown>,
): Promise<void> {
    if (!clerkUserId) return;
    try {
        const rows = await sql<{ id: string; name: string; email: string }[]>`
            SELECT id, name, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!rows.length) return;
        const { id: dbUserId, name, email } = rows[0];
        const serializedMetadata: JSONValue = metadata
            ? JSON.parse(JSON.stringify(metadata))
            : null;
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (${dbUserId}, ${name}, ${email}, ${interactionType}, ${path}, ${sql.json(serializedMetadata)})
        `;
    } catch (err) {
        console.error("[logAction] Failed to log action:", err);
    }
}

// Helper function to check elevated permissions
export async function checkAdminPermission() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized: No session");
    }

    throw new Error("Unauthorized: Elevated access required");
}

// Maximum photo size: 5MB
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export async function persistPhotoToR2(
    file: File | null,
    entityType: "customer" | "user",
    entityId: string,
): Promise<string | null> {
    if (!file || file.size === 0) {
        return null;
    }

    if (file.size > MAX_PHOTO_SIZE) {
        throw new Error(
            `Photo size exceeds ${MAX_PHOTO_SIZE / 1024 / 1024}MB limit`,
        );
    }

    const tableName = entityType === "customer" ? "customers" : "users";

    let previousImageUrl: string | null = null;
    try {
        const previous = await sql<{ image_url: string | null }[]>`
            SELECT image_url FROM ${sql(tableName)} WHERE id = ${entityId}
        `;
        previousImageUrl = previous[0]?.image_url ?? null;
    } catch (error) {
        console.error("Failed to fetch previous image URL:", error);
    }

    // Upload to R2
    const imageUrl = await uploadImageToR2(file, entityType, entityId);

    // Update database with R2 URL
    await sql`
    UPDATE ${sql(tableName)}
    SET image_url = ${imageUrl}
    WHERE id = ${entityId}
  `;

    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    if (
        previousImageUrl &&
        r2PublicUrl &&
        previousImageUrl.startsWith(r2PublicUrl)
    ) {
        try {
            await deleteImageFromR2(previousImageUrl);
        } catch (error) {
            console.error("Failed to delete previous image:", error);
        }
    }

    return imageUrl;
}

export async function saveUserPhoto(
    file: File | null,
    userId: string,
): Promise<string | null> {
    return persistPhotoToR2(file, "user", userId);
}

/**
 * Bloqueia mutações de atletas menores de idade enquanto a validação
 * do responsável estiver pendente.
 */
export async function getAthleteMinorPendingBlockError(
    clerkUserId: string,
): Promise<string | null> {
    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;

    if (!user) {
        return "Utilizador não encontrado.";
    }

    const [atleta] = await sql<{ menor_idade: boolean | null }[]>`
        SELECT menor_idade
        FROM atletas
        WHERE user_id = ${user.id}
        LIMIT 1
    `;

    if (atleta?.menor_idade !== true) {
        return null;
    }

    const pendente = await sql<{ id: string }[]>`
        SELECT id
        FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${user.id}
          AND relation_kind = 'responsavel'
          AND status IN ('pendente', 'pendente_responsavel')
        LIMIT 1
    `;

    if (pendente.length > 0) {
        return "Conta de atleta menor pendente de validação do responsável.";
    }

    return null;
}
