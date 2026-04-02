import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Verifica se um email já existe na plataforma (tabela users)
// Retorna: { existe: boolean, nome?: string }
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
    if (!email) return Response.json({ existe: false });

    const rows = await sql<{ id: string; name: string }[]>`
        SELECT id, name FROM users
        WHERE LOWER(email) = ${email}
        LIMIT 1
    `;

    if (rows.length > 0) {
        return Response.json({ existe: true, nome: rows[0].name });
    }

    return Response.json({ existe: false });
}
