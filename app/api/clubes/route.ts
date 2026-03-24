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

    const rows = await sql<{ id: string; name: string; cidade: string | null; desporto: string | null }[]>`
        SELECT id, name, cidade, desporto
        FROM organizations
        WHERE id != ${orgId}
          AND name ILIKE ${"%" + q + "%"}
        ORDER BY name ASC
        LIMIT 10
    `;

    return Response.json(rows);
}
