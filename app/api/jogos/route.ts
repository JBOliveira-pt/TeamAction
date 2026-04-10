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
            j.hora_fim
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

        // ── Jogo espelhado + notificação para equipas pessoais de treinador ──
        const createdGame = rows[0];
        if (adversarioClubeId) {
            // Verificar se o adversário é uma org sem clube (equipa pessoal de treinador)
            const advClube = await sql`
                SELECT id FROM clubes WHERE organization_id = ${adversarioClubeId} LIMIT 1
            `;
            if (advClube.length === 0) {
                // É equipa pessoal — buscar equipa + treinador adversário e nome da equipa que criou o jogo
                const [advEquipa, minhaEquipa] = await Promise.all([
                    sql<{ id: string; treinador_id: string | null }[]>`
                        SELECT e.id, e.treinador_id FROM equipas e
                        WHERE e.organization_id = ${adversarioClubeId} LIMIT 1
                    `,
                    sql<{ nome: string }[]>`
                        SELECT nome FROM equipas WHERE id = ${equipaId} LIMIT 1
                    `,
                ]);

                if (advEquipa.length > 0) {
                    const advEquipaId = advEquipa[0].id;
                    const advTreinadorId = advEquipa[0].treinador_id;
                    const nomeMinhaEquipa =
                        minhaEquipa[0]?.nome ?? "Equipa adversária";
                    const casaForaMirror =
                        casaFora === "casa" ? "fora" : "casa";

                    // Criar jogo espelhado na organização adversária
                    const mirror = await sql<{ id: string }[]>`
                        INSERT INTO jogos (id, adversario, adversario_clube_id, data, equipa_id, casa_fora, local, hora_inicio, hora_fim, estado, visibilidade_publica, organization_id, mirror_game_id)
                        VALUES (
                            gen_random_uuid(),
                            ${nomeMinhaEquipa},
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
                            ${createdGame.id}
                        )
                        RETURNING id
                    `;

                    // Linkar o jogo original ao espelhado
                    if (mirror.length > 0) {
                        await sql`
                            UPDATE jogos SET mirror_game_id = ${mirror[0].id} WHERE id = ${createdGame.id}
                        `;

                        // Notificar o treinador adversário
                        if (advTreinadorId) {
                            const dataFormatada = new Date(
                                body.data,
                            ).toLocaleDateString("pt-PT", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            });
                            await sql`
                                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                                VALUES (
                                    gen_random_uuid(),
                                    ${adversarioClubeId},
                                    ${advTreinadorId},
                                    ${"Novo jogo agendado"},
                                    ${`${nomeMinhaEquipa} agendou um jogo contra a tua equipa para ${dataFormatada} (${casaForaMirror === "casa" ? "em casa" : "fora"}).`},
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
