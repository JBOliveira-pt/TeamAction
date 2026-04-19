import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = String(body.email || "")
            .trim()
            .toLowerCase();
        const ownEmail = String(body.ownEmail || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return NextResponse.json({ valid: true });
        }

        // 1. Cannot use own email
        if (ownEmail && email === ownEmail) {
            return NextResponse.json({
                valid: false,
                reason: "own_email",
            });
        }

        // 2. Check if the email belongs to any registered user
        const userRows = await sql<{ id: string }[]>`
            SELECT id FROM users
            WHERE LOWER(email) = LOWER(${email})
            LIMIT 1
        `;

        // No user found — minor may register later, allow
        if (userRows.length === 0) {
            return NextResponse.json({ valid: true });
        }

        const userId = userRows[0].id;

        // 3. Check if user is an athlete
        const athleteRows = await sql<
            { user_id: string; menor_idade: boolean | null }[]
        >`
            SELECT a.user_id, a.menor_idade
            FROM atletas a
            WHERE a.user_id = ${userId}
            LIMIT 1
        `;

        // User exists but is NOT an athlete
        if (athleteRows.length === 0) {
            return NextResponse.json({
                valid: false,
                reason: "not_athlete",
            });
        }

        const athlete = athleteRows[0];

        // 4. Athlete exists but is NOT a minor
        if (!athlete.menor_idade) {
            return NextResponse.json({
                valid: false,
                reason: "not_minor",
            });
        }

        // 5. Minor athlete — check if already has an accepted guardian binding
        const existingBinding = await sql<{ id: string }[]>`
            SELECT id FROM atleta_relacoes_pendentes
            WHERE atleta_user_id = ${athlete.user_id}
              AND relation_kind = 'responsavel'
              AND status = 'aceite'
            LIMIT 1
        `;

        if (existingBinding.length > 0) {
            return NextResponse.json({
                valid: false,
                reason: "already_bound",
            });
        }

        // 6. Also check the encarregado_educacao field directly.
        // If the athlete already stored a guardian email but the relation is
        // still pending for the responsible signing up now, allow it.
        const guardianField = await sql<
            { encarregado_educacao: string | null }[]
        >`
            SELECT encarregado_educacao FROM atletas
            WHERE user_id = ${athlete.user_id}
            LIMIT 1
        `;

        const guardianEmail = guardianField[0]?.encarregado_educacao
            ?.trim()
            .toLowerCase();

        if (guardianEmail) {
            if (guardianEmail === ownEmail) {
                const pendingRelation = await sql<{ id: string }[]>`
                    SELECT id FROM atleta_relacoes_pendentes
                    WHERE atleta_user_id = ${athlete.user_id}
                      AND relation_kind = 'responsavel'
                      AND status = 'pendente'
                      AND LOWER(alvo_email) = LOWER(${ownEmail})
                    LIMIT 1
                `;

                if (pendingRelation.length === 0) {
                    return NextResponse.json({
                        valid: false,
                        reason: "already_bound",
                    });
                }
            } else {
                return NextResponse.json({
                    valid: false,
                    reason: "already_bound",
                });
            }
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error("[VALIDAR_MENOR] Error validating minor email:", error);
        // On error, allow — server-side will catch later
        return NextResponse.json({ valid: true });
    }
}
