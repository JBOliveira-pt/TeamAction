import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = String(body.email || "")
            .trim()
            .toLowerCase();
        const athleteEmail = String(body.athleteEmail || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return NextResponse.json({ valid: true });
        }

        // 1. Cannot use own email
        if (athleteEmail && email === athleteEmail) {
            return NextResponse.json({
                valid: false,
                reason: "own_email",
            });
        }

        // 2. Check if the email belongs to any registered user
        const userRows = await sql<
            { id: string; account_type: string | null }[]
        >`
            SELECT id, account_type FROM users
            WHERE LOWER(email) = LOWER(${email})
            LIMIT 1
        `;

        // No user found — responsável may register later, allow
        if (userRows.length === 0) {
            return NextResponse.json({ valid: true });
        }

        const user = userRows[0];

        // 3. User exists but is NOT a responsável
        if (user.account_type !== "responsavel") {
            return NextResponse.json({
                valid: false,
                reason: "not_responsible",
            });
        }

        // 4. Responsável existe na tabela users — permitir vinculação.
        // A segurança real está no passo de confirmação: o responsável
        // aceita ou recusa o pedido via /api/vinculacoes-responsavel.
        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error(
            "[VALIDAR_RESPONSAVEL] Error validating responsible email:",
            error,
        );
        return NextResponse.json({ valid: true });
    }
}
