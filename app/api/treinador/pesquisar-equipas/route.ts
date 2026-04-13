// Rota API treinador/pesquisar-equipas: pesquisa equipas independentes por nome para vinculacao.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return new Response("User not found", { status: 404 });

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return Response.json([]);

    const escalao = req.nextUrl.searchParams.get("escalao")?.trim();

    // Pesquisa treinadores pelo nome — mesmo que ainda não tenham equipas criadas.
    // Exclui organizações que já têm clube associado.
    const rows = escalao
        ? await sql<
              {
                  organization_id: string;
                  treinador_nome: string;
                  nome: string;
              }[]
          >`
            SELECT DISTINCT ON (u.organization_id)
                u.organization_id,
                u.name AS treinador_nome,
                COALESCE(e.nome, u.name) AS nome
            FROM users u
            LEFT JOIN equipas e ON e.organization_id = u.organization_id
            WHERE u.account_type = 'treinador'
              AND u.organization_id IS NOT NULL
              AND u.organization_id != ${orgId}
              AND u.organization_id NOT IN (
                  SELECT organization_id FROM clubes WHERE organization_id IS NOT NULL
              )
              AND (u.name ILIKE ${"%" + q + "%"} OR e.nome ILIKE ${"%" + q + "%"})
              AND e.escalao = ${escalao}
            ORDER BY u.organization_id, u.name ASC
            LIMIT 10
        `
        : await sql<
              {
                  organization_id: string;
                  treinador_nome: string;
                  nome: string;
              }[]
          >`
            SELECT DISTINCT ON (u.organization_id)
                u.organization_id,
                u.name AS treinador_nome,
                COALESCE(e.nome, u.name) AS nome
            FROM users u
            LEFT JOIN equipas e ON e.organization_id = u.organization_id
            WHERE u.account_type = 'treinador'
              AND u.organization_id IS NOT NULL
              AND u.organization_id != ${orgId}
              AND u.organization_id NOT IN (
                  SELECT organization_id FROM clubes WHERE organization_id IS NOT NULL
              )
              AND (u.name ILIKE ${"%" + q + "%"} OR e.nome ILIKE ${"%" + q + "%"})
            ORDER BY u.organization_id, u.name ASC
            LIMIT 10
        `;

    return Response.json(rows);
}
