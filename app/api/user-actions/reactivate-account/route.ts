// Rota API: reativar conta soft-deleted.
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import postgres from "postgres";

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
            deleted_at: string | null;
            account_type: string | null;
        }[]
    >`
        SELECT id, deleted_at, account_type
        FROM users
        WHERE clerk_user_id = ${clerkUserId}
        LIMIT 1
    `;

    if (!user || !user.deleted_at) {
        return NextResponse.json(
            { error: "Nenhuma conta para reativar" },
            { status: 404 },
        );
    }

    // Limpar soft-delete
    await sql`
        UPDATE users
        SET deleted_at = NULL, deletion_reason = NULL, updated_at = NOW()
        WHERE id = ${user.id}
    `;

    // Registar log
    try {
        await sql`
            INSERT INTO user_action_logs (
                user_id, user_name, user_email,
                interaction_type, path, metadata
            )
            SELECT
                ${user.id}, u.name, u.email,
                'account_reactivate', '/signup',
                '{"action":"reactivate"}'::jsonb
            FROM users u WHERE u.id = ${user.id}
        `;
    } catch {
        // Non-critical
    }

    return NextResponse.json({
        ok: true,
        accountType: user.account_type,
    });
}
