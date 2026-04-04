import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// GET — lista convites de clube pendentes para o atleta autenticado
export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const userRows = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = userRows[0];
    if (!me) return new Response("User not found", { status: 404 });

    const rows = await sql<{
        id: string;
        alvo_nome: string;
        alvo_clube_id: string;
        status: string;
        created_at: string;
    }[]>`
        SELECT id, alvo_nome, alvo_clube_id::text, status, created_at::text
        FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${me.id}
          AND relation_kind = 'clube'
          AND status = 'pendente'
        ORDER BY created_at DESC
    `;

    return Response.json(rows);
}
