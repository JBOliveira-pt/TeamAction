// Rota API: iniciar conta nova (apagar dados da conta soft-deleted e recomeçar).
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { cascadeDeleteUser } from "@/app/lib/admin-actions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST() {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar user vinculado a este clerk_user_id que esteja soft-deleted
    const [user] = await sql<
        {
            id: string;
            email: string;
            deleted_at: string | null;
            organization_id: string | null;
        }[]
    >`
        SELECT id, email, deleted_at, organization_id
        FROM users
        WHERE clerk_user_id = ${clerkUserId}
        LIMIT 1
    `;

    if (!user || !user.deleted_at) {
        return NextResponse.json(
            { error: "Nenhuma conta para reiniciar" },
            { status: 404 },
        );
    }

    // Cascade delete dos dados antigos, mas preservar o user row
    // (cascadeDeleteUser apaga o user row no passo 9 — precisamos impedir isso)
    // Usamos a cascade para limpar filhos, mas re-criamos o user depois.
    const oldUserId = user.id;
    const oldEmail = user.email;

    await sql.begin(async (tx: any) => {
        // Executar cascade completo (apaga tudo incluindo row do user e org)
        await cascadeDeleteUser(tx, oldUserId, oldEmail);

        // Re-criar org + user com os mesmos dados base
        const orgName = `Fresh Organization`;
        const slug = `fresh-org-${Date.now()}`;

        const [org] = await tx`
            INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
            VALUES (${orgName}, ${slug}, ${clerkUserId}, NOW(), NOW())
            RETURNING id
        `;

        await tx`
            INSERT INTO users (
                id, name, email, password, clerk_user_id,
                organization_id, created_at, updated_at
            )
            VALUES (
                gen_random_uuid(),
                ${oldEmail},
                ${oldEmail},
                'clerk-managed-fresh',
                ${clerkUserId},
                ${org.id},
                NOW(), NOW()
            )
        `;
    });

    // Registar log
    try {
        const [newUser] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (newUser) {
            await sql`
                INSERT INTO user_action_logs (
                    user_id, user_name, user_email,
                    interaction_type, path, metadata
                )
                VALUES (
                    ${newUser.id}, ${oldEmail}, ${oldEmail},
                    'account_fresh_start', '/signup',
                    '{"action":"fresh_start"}'::jsonb
                )
            `;
        }
    } catch {
        // Non-critical
    }

    return NextResponse.json({ ok: true });
}
