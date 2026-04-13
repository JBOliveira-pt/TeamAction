// Rota API: soft-delete da conta pelo próprio utilizador.
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const CONFIRM_TEXT = "ELIMINAR MINHA CONTA";

export async function POST(request: Request) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { confirmation?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
    }

    if (body.confirmation !== CONFIRM_TEXT) {
        return NextResponse.json(
            { error: "Confirmação incorreta" },
            { status: 400 },
        );
    }

    // Buscar user na BD
    const [user] = await sql<
        { id: string; email: string; deleted_at: string | null }[]
    >`
        SELECT id, email, deleted_at
        FROM users
        WHERE clerk_user_id = ${clerkUserId}
        LIMIT 1
    `;

    if (!user) {
        return NextResponse.json(
            { error: "Utilizador não encontrado" },
            { status: 404 },
        );
    }

    if (user.deleted_at) {
        return NextResponse.json(
            { error: "Conta já foi eliminada" },
            { status: 409 },
        );
    }

    // 1. Marcar soft-delete na BD
    await sql`
        UPDATE users
        SET deleted_at = NOW(), deletion_reason = 'self_delete', updated_at = NOW()
        WHERE id = ${user.id}
    `;

    // 2. Registar log
    try {
        await sql`
            INSERT INTO user_action_logs (
                user_id, user_name, user_email,
                interaction_type, path, metadata
            )
            SELECT
                ${user.id}, u.name, u.email,
                'account_self_delete', '/dashboard/definicoes',
                '{"reason":"self_delete"}'::jsonb
            FROM users u WHERE u.id = ${user.id}
        `;
    } catch {
        // Log failure is non-critical
    }

    // 3. Eliminar user no Clerk (despoleta webhook user.deleted,
    //    mas o webhook verá deleted_at e NÃO fará cascade)
    try {
        const client = await clerkClient();
        await client.users.deleteUser(clerkUserId);
    } catch (err: any) {
        // Se falhar no Clerk, reverter a BD
        await sql`
            UPDATE users
            SET deleted_at = NULL, deletion_reason = NULL, updated_at = NOW()
            WHERE id = ${user.id}
        `;
        console.error("[DELETE-ACCOUNT] Falha ao eliminar no Clerk:", err);
        return NextResponse.json(
            { error: "Erro ao eliminar conta. Tente novamente." },
            { status: 500 },
        );
    }

    return NextResponse.json({ ok: true });
}
