// Rota API equipas: lista equipas de um clube por clube_id.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const clube_id = req.nextUrl.searchParams.get("clube_id")?.trim();
    if (!clube_id) return Response.json([]);

    const escalao = req.nextUrl.searchParams.get("escalao")?.trim();

    const rows = escalao
        ? await sql<{ id: string; nome: string; escalao: string }[]>`
            SELECT id, nome, escalao FROM equipas
            WHERE organization_id = ${clube_id} AND escalao = ${escalao}
            ORDER BY nome ASC
        `
        : await sql<{ id: string; nome: string; escalao: string }[]>`
            SELECT id, nome, escalao FROM equipas
            WHERE organization_id = ${clube_id}
            ORDER BY nome ASC
        `;

    return Response.json(rows);
}
