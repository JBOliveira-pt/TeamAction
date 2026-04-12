// Rota API atletas/pesquisar: pesquisa atletas por nome dentro da organizacao.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ id: string; organization_id: string; name: string }[]>`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return Response.json([]);

    const rows = await sql<{
        id: string;
        nome: string;
        posicao: string | null;
        numero_camisola: number | null;
        estado: string;
        equipa_id: string | null;
        equipa_nome: string | null;
        user_id: string | null;
    }[]>`
        SELECT
            a.id,
            a.nome,
            a.posicao,
            a.numero_camisola,
            a.estado,
            a.equipa_id,
            e.nome AS equipa_nome,
            a.user_id
        FROM atletas a
        LEFT JOIN equipas e ON e.id = a.equipa_id
        WHERE a.organization_id = ${me.organization_id}
          AND a.nome ILIKE ${"%" + q + "%"}
        ORDER BY a.nome ASC
        LIMIT 20
    `;

    return Response.json(rows);
}
