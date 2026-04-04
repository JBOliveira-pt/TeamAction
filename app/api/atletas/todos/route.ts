import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const userRows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!userRows[0]) return new Response("User not found", { status: 404 });
    const orgId = userRows[0].organization_id;
    if (!orgId) return new Response("Organization not found", { status: 404 });

    const rows = await sql<{
        id: string;
        nome: string;
        posicao: string | null;
        numero_camisola: number | null;
        estado: string;
        equipa_nome: string | null;
        user_id: string | null;
        image_url: string | null;
    }[]>`
        SELECT
            a.id,
            a.nome,
            a.posicao,
            a.numero_camisola,
            a.estado,
            e.nome AS equipa_nome,
            a.user_id,
            u.image_url
        FROM atletas a
        LEFT JOIN equipas e ON e.id = a.equipa_id
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.organization_id = ${orgId}
        ORDER BY a.nome ASC
    `;

    return Response.json(rows);
}
