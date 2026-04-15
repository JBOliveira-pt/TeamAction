// Rota API atletas: listar, criar, atualizar e remover atletas.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

// GET /api/atletas?equipa_id=xxx
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const equipaId = req.nextUrl.searchParams.get("equipa_id");
    if (!equipaId) return new Response("Missing equipa_id", { status: 400 });

    const rows = await sql<
        {
            id: string;
            nome: string;
            posicao: string | null;
            numero_camisola: number | null;
            estado: string;
        }[]
    >`
        SELECT id, nome, posicao, numero_camisola, estado
        FROM atletas
        WHERE equipa_id = ${equipaId} AND organization_id = ${user.organization_id}
        ORDER BY nome ASC
    `;

    return Response.json(rows);
}
