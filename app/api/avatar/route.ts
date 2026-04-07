import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { uploadImageToR2, deleteImageFromR2 } from "@/app/lib/r2-storage";
import { sql } from "@/app/lib/actions/_shared";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        return NextResponse.json(
            { error: "Não autenticado." },
            { status: 401 },
        );
    }

    // Check if the responsável is uploading on behalf of a minor
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("targetUserId");

    try {
        const formData = await request.formData();
        const file = formData.get("avatar") as File | null;

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "Nenhum ficheiro enviado." },
                { status: 400 },
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Formato não suportado. Use JPEG, PNG, WebP ou GIF." },
                { status: 400 },
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "Ficheiro demasiado grande. Máximo 5 MB." },
                { status: 400 },
            );
        }

        // ── Responsável uploading avatar for the minor ──
        if (targetUserId) {
            // Verify caller is a responsável
            const [caller] = await sql<
                { id: string; email: string; account_type: string }[]
            >`
                SELECT id, email, account_type FROM users
                WHERE clerk_user_id = ${clerkUserId} LIMIT 1
            `;
            if (!caller || caller.account_type !== "responsavel") {
                return NextResponse.json(
                    { error: "Sem permissão." },
                    { status: 403 },
                );
            }

            // Verify the target is a minor linked to this responsável
            const [minor] = await sql<
                { user_id: string; encarregado_educacao: string | null }[]
            >`
                SELECT user_id, encarregado_educacao FROM atletas
                WHERE user_id = ${targetUserId}
                  AND menor_idade = true
                  AND LOWER(encarregado_educacao) = LOWER(${caller.email})
                LIMIT 1
            `;
            if (!minor) {
                return NextResponse.json(
                    { error: "Atleta menor não encontrado ou não vinculado." },
                    { status: 403 },
                );
            }

            // Get current image to delete old one
            const [targetUser] = await sql<
                { id: string; image_url: string | null }[]
            >`
                SELECT id, image_url FROM users WHERE id = ${targetUserId} LIMIT 1
            `;
            if (!targetUser) {
                return NextResponse.json(
                    { error: "Utilizador não encontrado." },
                    { status: 404 },
                );
            }

            if (
                targetUser.image_url &&
                !targetUser.image_url.includes("img.clerk.com")
            ) {
                try {
                    await deleteImageFromR2(targetUser.image_url);
                } catch {
                    // Ignore deletion errors
                }
            }

            const imageUrl = await uploadImageToR2(file, "user", targetUser.id);
            await sql`
                UPDATE users SET image_url = ${imageUrl}, updated_at = NOW()
                WHERE id = ${targetUserId}
            `;

            return NextResponse.json({ imageUrl });
        }

        // ── Normal self-upload flow ──

        // Fetch current user to get existing image_url
        const [user] = await sql<{ id: string; image_url: string | null }[]>`
            SELECT id, image_url FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) {
            return NextResponse.json(
                { error: "Utilizador não encontrado." },
                { status: 404 },
            );
        }

        // Verificar se é atleta menor de idade
        const [atletaRow] = await sql<
            {
                menor_idade: boolean | null;
                encarregado_educacao: string | null;
            }[]
        >`
            SELECT menor_idade, encarregado_educacao FROM atletas WHERE user_id = ${user.id} LIMIT 1
        `.catch(() => [{ menor_idade: null, encarregado_educacao: null }]);

        if (atletaRow?.menor_idade === true) {
            if (!atletaRow.encarregado_educacao) {
                return NextResponse.json(
                    {
                        error: "Não é possível alterar o avatar sem um responsável associado.",
                    },
                    { status: 403 },
                );
            }

            // Upload para R2 mas guardar URL em dados_pendentes (NÃO alterar image_url)
            const imageUrl = await uploadImageToR2(file, "user", user.id);

            // Merge com dados pendentes existentes
            const [current] = await sql<
                { dados_pendentes: Record<string, unknown> | null }[]
            >`
                SELECT dados_pendentes FROM atletas WHERE user_id = ${user.id} LIMIT 1
            `.catch(() => [{ dados_pendentes: null }]);

            const merged = {
                ...(current?.dados_pendentes ?? {}),
                users: {
                    ...(((current?.dados_pendentes as Record<string, unknown>)
                        ?.users as Record<string, unknown>) ?? {}),
                    image_url: imageUrl,
                },
                data_pedido: new Date().toISOString(),
            };

            await sql`
                UPDATE atletas
                SET dados_pendentes = ${JSON.stringify(merged)}::jsonb,
                    updated_at = NOW()
                WHERE user_id = ${user.id}
            `;

            // Notificar responsável
            const respRows = await sql<{ id: string }[]>`
                SELECT id FROM users WHERE LOWER(email) = LOWER(${atletaRow.encarregado_educacao}) LIMIT 1
            `.catch(() => []);
            if (respRows[0]) {
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        (SELECT COALESCE(organization_id, '00000000-0000-0000-0000-000000000000') FROM users WHERE id = ${user.id} LIMIT 1),
                        ${respRows[0].id},
                        'Aprovação necessária — Avatar alterado',
                        'O atleta menor pretende alterar a sua foto de perfil. É necessária a sua aprovação.',
                        'aprovacao_responsavel',
                        false,
                        NOW()
                    )
                `.catch(() => {});
            }

            return NextResponse.json({
                imageUrl: user.image_url,
                pendente: true,
            });
        }

        // Adulto — salvar directamente

        // Delete old R2 image if it's not a Clerk URL
        if (user.image_url && !user.image_url.includes("img.clerk.com")) {
            try {
                await deleteImageFromR2(user.image_url);
            } catch {
                // Ignore deletion errors for old images
            }
        }

        // Upload new avatar to R2
        const imageUrl = await uploadImageToR2(file, "user", user.id);

        // Update DB
        await sql`
            UPDATE users SET image_url = ${imageUrl}, updated_at = NOW()
            WHERE clerk_user_id = ${clerkUserId}
        `;

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json(
            { error: "Erro ao fazer upload da imagem." },
            { status: 500 },
        );
    }
}
