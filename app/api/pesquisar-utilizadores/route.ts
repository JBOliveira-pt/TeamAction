import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/**
 * GET /api/pesquisar-utilizadores?q=<search>&tipo=<treinador|atleta>
 *
 * Cross-organization search for users.
 * Only accessible by Presidente for inviting external treinadores/atletas
 * to their club equipa.
 *
 * Returns users NOT in the presidente's organization.
 */
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<
        { id: string; organization_id: string; account_type: string | null }[]
    >`
        SELECT id, organization_id, account_type
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    if (me.account_type !== "presidente") {
        return new Response(
            "Apenas o Presidente pode pesquisar utilizadores externos.",
            { status: 403 },
        );
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const tipo = req.nextUrl.searchParams.get("tipo")?.trim() ?? "";

    if (q.length < 2) return Response.json([]);
    if (!["treinador", "atleta"].includes(tipo)) {
        return new Response(
            "Parâmetro 'tipo' deve ser 'treinador' ou 'atleta'.",
            { status: 400 },
        );
    }

    // Search users across the platform, excluding users already in this org
    // Also exclude users that already have a pending invite from this club
    const rows = await sql<
        {
            id: string;
            name: string;
            email: string;
            image_url: string | null;
            organization_name: string | null;
        }[]
    >`
        SELECT
            u.id,
            u.name,
            u.email,
            u.image_url,
            COALESCE(c.nome, o.name) AS organization_name
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        LEFT JOIN clubes c ON c.organization_id = u.organization_id
        WHERE u.account_type = ${tipo}
          AND u.organization_id != ${me.organization_id}
          AND (u.name ILIKE ${"%" + q + "%"} OR u.email ILIKE ${"%" + q + "%"})
          AND u.id NOT IN (
              SELECT convidado_user_id
              FROM convites_clube
              WHERE clube_org_id = ${me.organization_id}
                AND estado = 'pendente'
          )
        ORDER BY u.name ASC
        LIMIT 20
    `;

    return Response.json(rows);
}
