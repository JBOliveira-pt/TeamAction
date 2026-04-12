// Rota API convites-equipa/[id]: atleta aceita ou recusa convite de equipa (com fluxo de menor).
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";
import {
    isIdadePermitidaEscalao,
    getIdadeMaximaEscalao,
    MAX_ATLETAS_POR_EQUIPA,
} from "@/app/lib/grau-escalao-compat";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Atleta aceita ou recusa um convite
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<
        { id: string; organization_id: string; name: string }[]
    >`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const { id } = await params;
    const body = (await req.json()) as { estado: "aceite" | "recusado" };

    if (!["aceite", "recusado"].includes(body.estado))
        return new Response("Estado inválido.", { status: 400 });

    // Buscar convite
    const conviteRows = await sql<
        {
            id: string;
            treinador_id: string;
            atleta_id: string;
            equipa_id: string | null;
            equipa_nome: string | null;
            treinador_nome: string;
            organization_id: string;
            estado: string;
        }[]
    >`
        SELECT id, treinador_id, atleta_id, equipa_id, equipa_nome, treinador_nome, organization_id, estado
        FROM convites_equipa
        WHERE id = ${id} AND organization_id = ${me.organization_id}
        LIMIT 1
    `;
    const convite = conviteRows[0];
    if (!convite)
        return new Response("Convite não encontrado.", { status: 404 });
    if (convite.estado !== "pendente")
        return new Response("Convite já respondido.", { status: 409 });

    // Verificar se atleta é menor
    const atletaInfo = await sql<
        {
            nome: string;
            menor_idade: boolean | null;
            encarregado_educacao: string | null;
            user_id: string | null;
        }[]
    >`
        SELECT nome, menor_idade, encarregado_educacao, user_id FROM atletas WHERE id = ${convite.atleta_id} LIMIT 1
    `.catch(() => []);
    const atletaNome = atletaInfo[0]?.nome ?? "O atleta";
    const isMinor = atletaInfo[0]?.menor_idade === true;
    const responsavelEmail = atletaInfo[0]?.encarregado_educacao;

    // Se menor está a aceitar, requer aprovação do responsável primeiro
    if (body.estado === "aceite" && isMinor) {
        await sql`
            UPDATE convites_equipa
            SET estado = 'pendente_responsavel', updated_at = NOW()
            WHERE id = ${id}
        `;

        // Notificar o responsável
        if (responsavelEmail) {
            const responsavelRows = await sql<{ id: string }[]>`
                SELECT id FROM users WHERE LOWER(email) = LOWER(${responsavelEmail}) LIMIT 1
            `.catch(() => []);
            if (responsavelRows[0]) {
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${convite.organization_id},
                        ${responsavelRows[0].id},
                        'Aprovação necessária — Convite de Equipa',
                        ${`O atleta menor "${atletaNome}" aceitou um convite para a equipa${convite.equipa_nome ? ` "${convite.equipa_nome}"` : ""} do treinador "${convite.treinador_nome}". É necessária a sua aprovação como encarregado de educação.`},
                        'aprovacao_responsavel',
                        false,
                        NOW()
                    )
                `.catch(() => {});
            }
        }

        return Response.json({ ok: true, estado: "pendente_responsavel" });
    }

    // Atualizar estado do convite
    await sql`
        UPDATE convites_equipa
        SET estado = ${body.estado}, updated_at = NOW()
        WHERE id = ${id}
    `;

    // Se aceite, atribuir atleta à equipa
    if (body.estado === "aceite" && convite.equipa_id) {
        // Validar: atleta não pode pertencer a outra equipa
        const [atletaEquipa] = await sql<
            {
                equipa_id: string | null;
                user_id: string | null;
                data_nascimento: string | null;
            }[]
        >`
            SELECT equipa_id, user_id, data_nascimento FROM atletas WHERE id = ${convite.atleta_id} LIMIT 1
        `;
        if (
            atletaEquipa?.equipa_id &&
            atletaEquipa.equipa_id !== convite.equipa_id
        ) {
            await sql`
                UPDATE convites_equipa SET estado = 'pendente', updated_at = NOW() WHERE id = ${id}
            `;
            return new Response(
                "Este atleta já pertence a outra equipa. Tem de ser removido da equipa atual primeiro.",
                { status: 409 },
            );
        }

        // Validar: máximo de atletas na equipa (14)
        const [countRow] = await sql<{ total: number }[]>`
            SELECT COUNT(*)::int AS total FROM atletas WHERE equipa_id = ${convite.equipa_id}
        `;
        if ((countRow?.total ?? 0) >= MAX_ATLETAS_POR_EQUIPA) {
            await sql`
                UPDATE convites_equipa SET estado = 'pendente', updated_at = NOW() WHERE id = ${id}
            `;
            return new Response(
                `Esta equipa já tem o máximo de ${MAX_ATLETAS_POR_EQUIPA} atletas.`,
                { status: 409 },
            );
        }

        // Validar: idade compatível com o escalão
        let idadeAtleta: number | null = null;

        if (atletaEquipa?.user_id) {
            // Atleta real — buscar data_nascimento da tabela users
            const [userRow] = await sql<{ data_nascimento: string | null }[]>`
                SELECT data_nascimento FROM users WHERE id = ${atletaEquipa.user_id} LIMIT 1
            `;
            if (userRow?.data_nascimento) {
                const birth = new Date(userRow.data_nascimento);
                const today = new Date();
                idadeAtleta = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
                    idadeAtleta--;
            }
        } else if (atletaEquipa?.data_nascimento) {
            // Atleta fake — usar data_nascimento da tabela atletas
            const birth = new Date(atletaEquipa.data_nascimento);
            const today = new Date();
            idadeAtleta = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
                idadeAtleta--;
        }

        if (idadeAtleta !== null) {
            const [equipa] = await sql<{ escalao: string }[]>`
                SELECT escalao FROM equipas WHERE id = ${convite.equipa_id} LIMIT 1
            `;
            if (
                equipa &&
                !isIdadePermitidaEscalao(idadeAtleta, equipa.escalao)
            ) {
                await sql`
                    UPDATE convites_equipa SET estado = 'pendente', updated_at = NOW() WHERE id = ${id}
                `;
                const limite = getIdadeMaximaEscalao(equipa.escalao);
                return new Response(
                    `O atleta tem ${idadeAtleta} anos mas o escalão ${equipa.escalao} requer idade inferior a ${limite} anos.`,
                    { status: 409 },
                );
            }
        }

        await sql`
            UPDATE atletas SET equipa_id = ${convite.equipa_id}
            WHERE id = ${convite.atleta_id} AND organization_id = ${me.organization_id}
        `.catch(() => {});
    }

    // Notificar o treinador
    const decisao = body.estado === "aceite" ? "aceitou" : "recusou";

    await sql`
        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
        VALUES (
            gen_random_uuid(),
            ${convite.organization_id},
            ${convite.treinador_id},
            ${`Convite ${body.estado === "aceite" ? "aceite" : "recusado"}`},
            ${`${atletaNome} ${decisao} o convite para a equipa${convite.equipa_nome ? ` "${convite.equipa_nome}"` : ""}.`},
            'convite_equipa',
            false,
            NOW()
        )
    `.catch(() => {});

    return Response.json({ ok: true, estado: body.estado });
}
