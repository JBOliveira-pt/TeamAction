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

        // 4. User is a responsável — check if they pre-registered with this athlete's email
        if (athleteEmail) {
            // Check atleta_relacoes_pendentes for a record where this responsável
            // indicated the athlete's email (responsável-initiated flow)
            const preRegistered = await sql<{ id: string }[]>`
                SELECT arp.id
                FROM atleta_relacoes_pendentes arp
                LEFT JOIN users u_atleta ON u_atleta.id = arp.atleta_user_id
                WHERE arp.alvo_responsavel_user_id = ${user.id}
                  AND arp.relation_kind = 'responsavel'
                  AND (
                      LOWER(u_atleta.email) = LOWER(${athleteEmail})
                      OR LOWER(arp.alvo_atleta_email) = LOWER(${athleteEmail})
                  )
                LIMIT 1
            `;

            if (preRegistered.length > 0) {
                return NextResponse.json({ valid: true });
            }

            return NextResponse.json({
                valid: false,
                reason: "not_preregistered",
            });
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error(
            "[VALIDAR_RESPONSAVEL] Error validating responsible email:",
            error,
        );
        return NextResponse.json({ valid: true });
    }
}
