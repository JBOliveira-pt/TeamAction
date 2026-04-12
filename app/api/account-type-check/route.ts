// Rota API account-type-check: verifica o account_type de um utilizador na BD pelo uid do Clerk.
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Rota interna leve usada pelo middleware para verificar account_type na BD
// quando os session claims do Clerk ainda não foram atualizados.
// Retorna apenas o tipo de conta, sem dados sensíveis.
export async function GET(req: NextRequest) {
    const uid = req.nextUrl.searchParams.get("uid");
    if (!uid || typeof uid !== "string" || uid.length > 200) {
        return Response.json({ accountType: null });
    }

    try {
        const rows = await sql<{ account_type: string | null }[]>`
            SELECT account_type FROM users WHERE clerk_user_id = ${uid} LIMIT 1
        `;
        return Response.json({ accountType: rows[0]?.account_type ?? null });
    } catch {
        return Response.json({ accountType: null });
    }
}
