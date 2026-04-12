// Rota API clubes: pesquisa clubes por nome para vinculacao de equipa.
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

    const rows = await sql<
        {
            id: string;
            name: string;
            cidade: string | null;
            desporto: string | null;
        }[]
    >`
        SELECT
            c.organization_id AS id,
            c.nome AS name,
            c.cidade,
            c.modalidade AS desporto
        FROM clubes c
        WHERE c.organization_id != ${orgId}
          AND c.nome ILIKE ${"%" + q + "%"}
        ORDER BY c.nome ASC
        LIMIT 10
    `;

    return Response.json(rows);
}
