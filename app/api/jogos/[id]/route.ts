import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(clerkUserId: string) {
    const rows = await sql<
        { id: string; organization_id: string; account_type: string | null }[]
    >`
        SELECT id, organization_id, account_type FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const { id } = await params;
    const body = (await req.json()) as {
        resultado_nos?: number | null;
        resultado_adv?: number | null;
        estado?: string;
        adversario?: string;
        data?: string;
        casa_fora?: string;
        local?: string | null;
        hora_inicio?: string | null;
        hora_fim?: string | null;
    };

    const estadosValidos = ["agendado", "realizado", "cancelado"];
    const estado =
        body.estado && estadosValidos.includes(body.estado)
            ? body.estado
            : undefined;

    // Validate resultado if provided
    if (body.resultado_nos !== undefined && body.resultado_nos !== null) {
        if (!Number.isInteger(body.resultado_nos) || body.resultado_nos < 0)
            return new Response("Resultado inválido.", { status: 400 });
    }
    if (body.resultado_adv !== undefined && body.resultado_adv !== null) {
        if (!Number.isInteger(body.resultado_adv) || body.resultado_adv < 0)
            return new Response("Resultado inválido.", { status: 400 });
    }

    // Treinador só pode editar jogos da sua equipa
    if (user.account_type === "treinador") {
        const own = await sql`
            SELECT j.id FROM jogos j
            JOIN equipas e ON e.id = j.equipa_id AND e.treinador_id = ${user.id}
            WHERE j.id = ${id} AND j.organization_id = ${user.organization_id}
        `;
        if (own.length === 0)
            return new Response("Só pode editar jogos da sua equipa.", {
                status: 403,
            });
    }

    // Buscar dados antigos se vamos alterar data/hora (para notificação)
    let oldGame: {
        data: string;
        hora_inicio: string | null;
        adversario: string;
        adversario_clube_id: string | null;
        equipa_id: string | null;
    } | null = null;
    const isDateOrTimeChange =
        body.data !== undefined || body.hora_inicio !== undefined;
    if (isDateOrTimeChange) {
        const old = await sql<
            {
                data: string;
                hora_inicio: string | null;
                adversario: string;
                adversario_clube_id: string | null;
                equipa_id: string | null;
            }[]
        >`
            SELECT data::text, hora_inicio, adversario, adversario_clube_id, equipa_id
            FROM jogos WHERE id = ${id} AND organization_id = ${user.organization_id}
        `;
        oldGame = old[0] ?? null;
    }

    const rows = await sql<{ id: string }[]>`
        UPDATE jogos
        SET
            resultado_nos = COALESCE(${body.resultado_nos ?? null}, resultado_nos),
            resultado_adv = COALESCE(${body.resultado_adv ?? null}, resultado_adv),
            estado        = COALESCE(${estado ?? null}, estado),
            adversario    = COALESCE(${body.adversario?.trim() ?? null}, adversario),
            data          = COALESCE(${body.data ?? null}::date, data),
            casa_fora     = COALESCE(${body.casa_fora ?? null}, casa_fora),
            local         = COALESCE(${body.local ?? null}, local),
            hora_inicio   = COALESCE(${body.hora_inicio ?? null}, hora_inicio),
            hora_fim      = COALESCE(${body.hora_fim ?? null}, hora_fim)
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (rows.length === 0) return new Response("Not found", { status: 404 });

    // ── Sincronizar jogo espelhado ──
    const mirror = await sql<{ mirror_game_id: string | null }[]>`
        SELECT mirror_game_id FROM jogos WHERE id = ${id} AND mirror_game_id IS NOT NULL
    `;
    if (mirror.length > 0 && mirror[0].mirror_game_id) {
        const mirrorId = mirror[0].mirror_game_id;
        // No espelhado: resultado_nos↔resultado_adv ficam invertidos
        await sql`
            UPDATE jogos
            SET
                resultado_nos = COALESCE(${body.resultado_adv ?? null}, resultado_nos),
                resultado_adv = COALESCE(${body.resultado_nos ?? null}, resultado_adv),
                estado        = COALESCE(${estado ?? null}, estado),
                data          = COALESCE(${body.data ?? null}::date, data),
                local         = COALESCE(${body.local ?? null}, local),
                hora_inicio   = COALESCE(${body.hora_inicio ?? null}, hora_inicio),
                hora_fim      = COALESCE(${body.hora_fim ?? null}, hora_fim),
                updated_at    = NOW()
            WHERE id = ${mirrorId}
        `;

        // ── Notificar treinador adversário se data/hora mudou ──
        if (isDateOrTimeChange && oldGame?.adversario_clube_id) {
            const mirrorGame = await sql<
                { organization_id: string; equipa_id: string | null }[]
            >`
                SELECT organization_id, equipa_id FROM jogos WHERE id = ${mirrorId}
            `;
            if (mirrorGame.length > 0 && mirrorGame[0].equipa_id) {
                const advTreinador = await sql<
                    { treinador_id: string | null }[]
                >`
                    SELECT treinador_id FROM equipas WHERE id = ${mirrorGame[0].equipa_id} LIMIT 1
                `;
                if (advTreinador.length > 0 && advTreinador[0].treinador_id) {
                    const novaData = body.data ?? oldGame.data;
                    const novaHora = body.hora_inicio ?? oldGame.hora_inicio;
                    const dataFormatada = new Date(novaData).toLocaleDateString(
                        "pt-PT",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        },
                    );
                    const nomeEquipa = oldGame.equipa_id
                        ? ((
                              await sql<
                                  { nome: string }[]
                              >`SELECT nome FROM equipas WHERE id = ${oldGame.equipa_id} LIMIT 1`
                          )[0]?.nome ?? oldGame.adversario)
                        : oldGame.adversario;
                    const horaTexto = novaHora ? ` às ${novaHora}` : "";
                    await sql`
                        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                        VALUES (
                            gen_random_uuid(),
                            ${mirrorGame[0].organization_id},
                            ${advTreinador[0].treinador_id},
                            ${"Data do jogo alterada"},
                            ${`O jogo contra ${nomeEquipa} foi remarcado para ${dataFormatada}${horaTexto}.`},
                            'jogo',
                            false,
                            NOW()
                        )
                    `;
                }
            }
        }
    }

    return Response.json({ id: rows[0].id });
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const { id } = await params;

    // Treinador só pode apagar jogos da sua equipa
    if (user.account_type === "treinador") {
        const own = await sql`
            SELECT j.id FROM jogos j
            JOIN equipas e ON e.id = j.equipa_id AND e.treinador_id = ${user.id}
            WHERE j.id = ${id} AND j.organization_id = ${user.organization_id}
        `;
        if (own.length === 0)
            return new Response("Só pode apagar jogos da sua equipa.", {
                status: 403,
            });
    }

    // ── Cancelar jogo espelhado antes de apagar ──
    const mirrorRow = await sql<
        { mirror_game_id: string | null; adversario: string; data: string }[]
    >`
        SELECT mirror_game_id, adversario, data::text FROM jogos WHERE id = ${id}
    `;
    if (mirrorRow.length > 0 && mirrorRow[0].mirror_game_id) {
        const mirrorId = mirrorRow[0].mirror_game_id;
        // Buscar dados do espelhado para notificação
        const mirrorGame = await sql<
            { organization_id: string; equipa_id: string | null }[]
        >`
            SELECT organization_id, equipa_id FROM jogos WHERE id = ${mirrorId}
        `;
        await sql`
            UPDATE jogos SET estado = 'cancelado', updated_at = NOW() WHERE id = ${mirrorId}
        `;
        // Notificar o treinador adversário
        if (mirrorGame.length > 0 && mirrorGame[0].equipa_id) {
            const advTreinador = await sql<{ treinador_id: string | null }[]>`
                SELECT treinador_id FROM equipas WHERE id = ${mirrorGame[0].equipa_id} LIMIT 1
            `;
            if (advTreinador.length > 0 && advTreinador[0].treinador_id) {
                const dataFormatada = new Date(
                    mirrorRow[0].data,
                ).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${mirrorGame[0].organization_id},
                        ${advTreinador[0].treinador_id},
                        ${"Jogo cancelado"},
                        ${`O jogo contra ${mirrorRow[0].adversario} de ${dataFormatada} foi cancelado pelo adversário.`},
                        'jogo',
                        false,
                        NOW()
                    )
                `;
            }
        }
    }

    const deleted = await sql`
        DELETE FROM jogos
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
