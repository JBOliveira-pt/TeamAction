// Rota API vinculacoes-responsavel: listar e criar pedidos de vinculacao de responsavel.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// GET — lista pedidos pendentes de vinculação de responsável para o atleta menor
export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const userRows = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = userRows[0];
    if (!me) return new Response("User not found", { status: 404 });

    const rows = await sql<
        {
            id: string;
            alvo_email: string;
            alvo_nome: string | null;
            status: string;
            created_at: string;
        }[]
    >`
        SELECT
            arp.id,
            arp.alvo_email,
            u.name AS alvo_nome,
            arp.status,
            arp.created_at::text
        FROM atleta_relacoes_pendentes arp
        LEFT JOIN users u ON u.id = arp.alvo_responsavel_user_id
        WHERE arp.atleta_user_id = ${me.id}
          AND arp.relation_kind = 'responsavel'
          AND arp.status = 'pendente'
          AND arp.alvo_responsavel_user_id IS NOT NULL
        ORDER BY arp.created_at DESC
    `;

    return Response.json(rows);
}
