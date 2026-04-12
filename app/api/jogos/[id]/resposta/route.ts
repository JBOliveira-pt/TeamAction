// Rota API jogos/[id]/resposta: adversário responde a jogo agendado (concordar, discordar, propor).
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(clerkUserId: string) {
    const rows = await sql<
        {
            id: string;
            organization_id: string;
            account_type: string | null;
            name: string;
        }[]
    >`
        SELECT id, organization_id, account_type, name FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
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
        resposta: "aceite" | "recusado" | "nova_proposta";
        proposta_data?: string | null;
        proposta_hora?: string | null;
    };

    const respostasValidas = ["aceite", "recusado", "nova_proposta"];
    if (!respostasValidas.includes(body.resposta))
        return new Response("Resposta inválida.", { status: 400 });

    if (body.resposta === "nova_proposta" && !body.proposta_data)
        return new Response(
            "Proposta de data é obrigatória ao sugerir nova data.",
            { status: 400 },
        );

    // Buscar o jogo — deve pertencer à organização do utilizador e ser um jogo espelhado (mirror)
    const jogoRows = await sql<
        {
            id: string;
            mirror_game_id: string | null;
            organization_id: string;
            estado: string;
            adversario: string;
            equipa_id: string | null;
        }[]
    >`
        SELECT id, mirror_game_id, organization_id, estado, adversario, equipa_id
        FROM jogos
        WHERE id = ${id} AND organization_id = ${user.organization_id}
        LIMIT 1
    `;
    const jogo = jogoRows[0];
    if (!jogo) return new Response("Jogo não encontrado.", { status: 404 });
    if (!jogo.mirror_game_id)
        return new Response(
            "Só pode responder a jogos agendados pelo adversário.",
            { status: 403 },
        );
    if (jogo.estado !== "agendado")
        return new Response("Só pode responder a jogos com estado agendado.", {
            status: 409,
        });

    // Atualizar resposta no jogo do adversário (espelhado = quem criou o jogo)
    if (body.resposta === "nova_proposta") {
        await sql`
            UPDATE jogos
            SET resposta_adversario = 'nova_proposta',
                proposta_data = ${body.proposta_data!}::date,
                proposta_hora = ${body.proposta_hora ?? null}
            WHERE id = ${id}
        `;
        // Espelhar a proposta no jogo original
        await sql`
            UPDATE jogos
            SET resposta_adversario = 'nova_proposta',
                proposta_data = ${body.proposta_data!}::date,
                proposta_hora = ${body.proposta_hora ?? null}
            WHERE id = ${jogo.mirror_game_id}
        `;
    } else {
        await sql`
            UPDATE jogos SET resposta_adversario = ${body.resposta} WHERE id = ${id}
        `;
        await sql`
            UPDATE jogos SET resposta_adversario = ${body.resposta} WHERE id = ${jogo.mirror_game_id}
        `;
    }

    // Notificar quem criou o jogo (buscar equipa + treinador/presidente do jogo original)
    const originalRows = await sql<
        { organization_id: string; equipa_id: string | null }[]
    >`
        SELECT organization_id, equipa_id FROM jogos WHERE id = ${jogo.mirror_game_id} LIMIT 1
    `;
    if (originalRows.length > 0) {
        const originalOrg = originalRows[0].organization_id;
        const originalEquipaId = originalRows[0].equipa_id;

        // Buscar nome da equipa que está a responder e nome do clube
        const [minhaEquipa, meuClube] = await Promise.all([
            jogo.equipa_id
                ? sql<
                      { nome: string }[]
                  >`SELECT nome FROM equipas WHERE id = ${jogo.equipa_id} LIMIT 1`
                : Promise.resolve([]),
            sql<
                { nome: string }[]
            >`SELECT nome FROM clubes WHERE organization_id = ${user.organization_id} LIMIT 1`,
        ]);
        const nomeEquipa = minhaEquipa[0]?.nome ?? "A equipa adversária";
        const nomeClube = meuClube[0]?.nome ?? null;
        const nomeComClube = nomeClube
            ? `${nomeEquipa} (${nomeClube})`
            : nomeEquipa;

        let titulo = "";
        let descricao = "";
        if (body.resposta === "aceite") {
            titulo = "Jogo confirmado pelo adversário";
            descricao = `${nomeComClube} concordou com a data e horário do jogo agendado.`;
        } else if (body.resposta === "recusado") {
            titulo = "Jogo recusado pelo adversário";
            descricao = `${nomeComClube} discordou da data/horário do jogo agendado.`;
        } else {
            const propostaData = new Date(
                body.proposta_data!,
            ).toLocaleDateString("pt-PT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
            const propostaHora = body.proposta_hora
                ? ` às ${body.proposta_hora}`
                : "";
            titulo = "Nova proposta de data para jogo";
            descricao = `${nomeComClube} propôs uma nova data: ${propostaData}${propostaHora}.`;
        }

        // Notificar treinador da equipa original
        if (originalEquipaId) {
            const treinadorRows = await sql<{ treinador_id: string | null }[]>`
                SELECT treinador_id FROM equipas WHERE id = ${originalEquipaId} LIMIT 1
            `;
            if (treinadorRows[0]?.treinador_id) {
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (gen_random_uuid(), ${originalOrg}, ${treinadorRows[0].treinador_id}, ${titulo}, ${descricao}, 'jogo', false, NOW())
                `;
            }
        }

        // Notificar presidente da org original (se clube)
        const presRows = await sql<{ id: string }[]>`
            SELECT u.id FROM users u WHERE u.organization_id = ${originalOrg} AND u.account_type = 'presidente' LIMIT 1
        `;
        if (presRows.length > 0) {
            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (gen_random_uuid(), ${originalOrg}, ${presRows[0].id}, ${titulo}, ${descricao}, 'jogo', false, NOW())
            `;
        }
    }

    return Response.json({ ok: true, resposta: body.resposta });
}
