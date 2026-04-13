// Rota API jogos: listar e criar jogos da organizacao.
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

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const rows = await sql<
        {
            id: string;
            adversario: string;
            data: string;
            casa_fora: string;
            local: string | null;
            estado: string;
            resultado_nos: number | null;
            resultado_adv: number | null;
            equipa_id: string | null;
            equipa_nome: string | null;
            adversario_fake: boolean;
            hora_inicio: string | null;
            hora_fim: string | null;
            mirror_game_id: string | null;
            resposta_adversario: string | null;
            proposta_data: string | null;
            proposta_hora: string | null;
        }[]
    >`
        SELECT
            j.id,
            j.adversario,
            j.data::text,
            j.casa_fora,
            j.local,
            j.estado,
            j.resultado_nos,
            j.resultado_adv,
            j.equipa_id,
            e.nome AS equipa_nome,
            (j.adversario_clube_id IS NULL) AS adversario_fake,
            j.hora_inicio,
            j.hora_fim,
            j.mirror_game_id,
            j.resposta_adversario,
            j.proposta_data::text,
            j.proposta_hora
        FROM jogos j
        LEFT JOIN equipas e ON e.id = j.equipa_id
        WHERE j.organization_id = ${user.organization_id}
        ORDER BY j.data DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });
    if (!user.organization_id)
        return new Response("Utilizador sem organização", { status: 400 });

    const body = (await req.json()) as {
        adversario?: string;
        data?: string;
        casa_fora?: string;
        local?: string;
        equipa_id?: string;
        hora_inicio?: string;
        hora_fim?: string;
        adversario_org_id?: string | null;
        visibilidade_publica?: boolean;
    };

    if (!body.adversario?.trim() || body.adversario.trim().length < 2)
        return new Response(
            "Nome do adversário deve ter pelo menos 2 caracteres.",
            { status: 400 },
        );
    if (body.adversario.trim().length > 100)
        return new Response(
            "Nome do adversário não pode ter mais de 100 caracteres.",
            { status: 400 },
        );
    if (!body.data) return new Response("Data é obrigatória.", { status: 400 });

    const dataJogo = new Date(body.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataJogo < hoje)
        return new Response(
            "Não é possível agendar um jogo em data já passada.",
            { status: 400 },
        );

    if (!body.equipa_id)
        return new Response("Equipa é obrigatória.", { status: 400 });

    if (user.account_type === "treinador") {
        const equipa = await sql`
            SELECT id FROM equipas WHERE id = ${body.equipa_id} AND treinador_id = ${user.id}
        `;
        if (equipa.length === 0)
            return new Response("Só pode criar jogos para a sua equipa.", {
                status: 403,
            });
    }

    const casaFora = body.casa_fora === "fora" ? "fora" : "casa";
    const local = body.local?.trim() || null;
    const equipaId = body.equipa_id;
    const horaInicio = body.hora_inicio || null;
    const horaFim = body.hora_fim || null;
    const adversarioClubeId = body.adversario_org_id ?? null;
    const visibilidadePublica = body.visibilidade_publica === true;

    // Validar escalão: adversário da plataforma deve ter mesmo escalão
    if (adversarioClubeId) {
        const [minhaEquipa] = await sql<{ escalao: string }[]>`
            SELECT escalao FROM equipas WHERE id = ${equipaId} LIMIT 1
        `;
        if (minhaEquipa) {
            const advComMesmoEscalao = await sql`
                SELECT id FROM equipas
                WHERE organization_id = ${adversarioClubeId}
                  AND escalao = ${minhaEquipa.escalao}
                LIMIT 1
            `;
            if (advComMesmoEscalao.length === 0) {
                return new Response(
                    `O adversário não tem equipa no escalão "${minhaEquipa.escalao}".`,
                    { status: 400 },
                );
            }
        }
    }

    try {
        const rows = await sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                local: string | null;
                estado: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                equipa_id: string | null;
                adversario_fake: boolean;
            }[]
        >`
            INSERT INTO jogos (id, adversario, adversario_clube_id, data, equipa_id, casa_fora, local, hora_inicio, hora_fim, estado, visibilidade_publica, organization_id)
            VALUES (
                gen_random_uuid(),
                ${body.adversario.trim()},
                ${adversarioClubeId},
                ${body.data},
                ${equipaId},
                ${casaFora},
                ${local},
                ${horaInicio},
                ${horaFim},
                'agendado',
                ${visibilidadePublica},
                ${user.organization_id}
            )
            RETURNING id, adversario, data::text, equipa_id, casa_fora, local, estado, resultado_nos, resultado_adv,
                      (adversario_clube_id IS NULL) AS adversario_fake
        `;

        // ── Jogo espelhado + notificação para adversários na plataforma ──
        const createdGame = rows[0];
        if (adversarioClubeId) {
            // Buscar info do adversário: equipa, treinador, clube (se houver)
            const [advEquipas, minhaEquipa, advClubeRows, meuClubeRows] =
                await Promise.all([
                    sql<
                        { id: string; treinador_id: string | null }[]
                    >`SELECT id, treinador_id FROM equipas WHERE organization_id = ${adversarioClubeId} LIMIT 1`,
                    sql<
                        { nome: string }[]
                    >`SELECT nome FROM equipas WHERE id = ${equipaId} LIMIT 1`,
                    sql<
                        { nome: string }[]
                    >`SELECT nome FROM clubes WHERE organization_id = ${adversarioClubeId} LIMIT 1`,
                    sql<
                        { nome: string }[]
                    >`SELECT nome FROM clubes WHERE organization_id = ${user.organization_id} LIMIT 1`,
                ]);

            if (advEquipas.length > 0) {
                const advEquipaId = advEquipas[0].id;
                const advTreinadorId = advEquipas[0].treinador_id;
                const nomeMinhaEquipa =
                    minhaEquipa[0]?.nome ?? "Equipa adversária";
                const nomeMeuClube = meuClubeRows[0]?.nome ?? null;
                const casaForaMirror = casaFora === "casa" ? "fora" : "casa";

                // Criar jogo espelhado na organização adversária
                const mirror = await sql<{ id: string }[]>`
                    INSERT INTO jogos (id, adversario, adversario_clube_id, data, equipa_id, casa_fora, local, hora_inicio, hora_fim, estado, visibilidade_publica, organization_id, mirror_game_id, resposta_adversario)
                    VALUES (
                        gen_random_uuid(),
                        ${nomeMeuClube ? `${nomeMinhaEquipa} (${nomeMeuClube})` : nomeMinhaEquipa},
                        ${user.organization_id},
                        ${body.data},
                        ${advEquipaId},
                        ${casaForaMirror},
                        ${local},
                        ${horaInicio},
                        ${horaFim},
                        'agendado',
                        false,
                        ${adversarioClubeId},
                        ${createdGame.id},
                        'pendente'
                    )
                    RETURNING id
                `;

                // Linkar o jogo original ao espelhado + marcar resposta pendente no original
                if (mirror.length > 0) {
                    await sql`
                        UPDATE jogos SET mirror_game_id = ${mirror[0].id}, resposta_adversario = 'pendente' WHERE id = ${createdGame.id}
                    `;

                    // Notificar: treinador adversário + presidente adversário (se clube)
                    const dataFormatada = new Date(
                        body.data,
                    ).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    });
                    const nomeComClube = nomeMeuClube
                        ? `${nomeMinhaEquipa} (${nomeMeuClube})`
                        : nomeMinhaEquipa;
                    const descricao = `${nomeComClube} agendou um jogo contra a tua equipa para ${dataFormatada} (${casaForaMirror === "casa" ? "em casa" : "fora"}). Consulta os teus jogos para concordar, discordar ou propor outra data.`;

                    // Notificar treinador
                    if (advTreinadorId) {
                        await sql`
                            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                            VALUES (
                                gen_random_uuid(),
                                ${adversarioClubeId},
                                ${advTreinadorId},
                                ${"Novo jogo agendado — resposta necessária"},
                                ${descricao},
                                'jogo',
                                false,
                                NOW()
                            )
                        `;
                    }

                    // Se adversário é clube, notificar também o presidente
                    if (advClubeRows.length > 0) {
                        const presRows = await sql<{ id: string }[]>`
                            SELECT u.id FROM users u
                            WHERE u.organization_id = ${adversarioClubeId}
                              AND u.account_type = 'presidente'
                            LIMIT 1
                        `;
                        if (
                            presRows.length > 0 &&
                            presRows[0].id !== advTreinadorId
                        ) {
                            await sql`
                                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                                VALUES (
                                    gen_random_uuid(),
                                    ${adversarioClubeId},
                                    ${presRows[0].id},
                                    ${"Novo jogo agendado — resposta necessária"},
                                    ${descricao},
                                    'jogo',
                                    false,
                                    NOW()
                                )
                            `;
                        }
                    }
                }
            }
        }

        return Response.json(createdGame, { status: 201 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[POST /api/jogos]", msg);
        return new Response(msg, { status: 500 });
    }
}
