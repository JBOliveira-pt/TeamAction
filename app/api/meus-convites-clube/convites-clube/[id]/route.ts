import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// PUT — atleta aceita ou recusa convite de clube
// Req 4: se o atleta já estiver vinculado a um treinador independente, fica suspenso
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const userRows = await sql<
        { id: string; organization_id: string | null; email: string }[]
    >`
        SELECT id, organization_id, email FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = userRows[0];
    if (!me) return new Response("Utilizador não encontrado.", { status: 404 });

    const { id } = await params;
    const body = (await req.json()) as { estado: "aceite" | "recusado" };

    if (!["aceite", "recusado"].includes(body.estado))
        return new Response("Estado inválido.", { status: 400 });

    // Buscar o convite de clube
    const conviteRows = await sql<
        {
            id: string;
            atleta_user_id: string;
            alvo_clube_id: string;
            alvo_equipa_id: string | null;
            alvo_nome: string;
            status: string;
        }[]
    >`
        SELECT id, atleta_user_id, alvo_clube_id::text, alvo_equipa_id::text, alvo_nome, status
        FROM atleta_relacoes_pendentes
        WHERE id = ${id}
          AND atleta_user_id = ${me.id}
          AND relation_kind = 'clube'
        LIMIT 1
    `;
    const convite = conviteRows[0];
    if (!convite)
        return new Response("Convite não encontrado.", { status: 404 });
    if (convite.status !== "pendente")
        return new Response("Convite já respondido.", { status: 409 });

    if (body.estado === "recusado") {
        await sql`
            UPDATE atleta_relacoes_pendentes
            SET status = 'recusado', updated_at = NOW()
            WHERE id = ${id}
        `;

        // N3: Atleta recusa federação → desvincular do treinador (equipa_id = NULL)
        await sql`
            UPDATE atletas SET equipa_id = NULL, updated_at = NOW()
            WHERE user_id = ${me.id}
        `.catch(() => {});

        return Response.json({ ok: true, estado: "recusado" });
    }

    // Verificar se atleta é menor de idade — exige aprovação do responsável
    const atletaMinorRows = await sql<
        { menor_idade: boolean | null; encarregado_educacao: string | null }[]
    >`
        SELECT menor_idade, encarregado_educacao FROM atletas WHERE user_id = ${me.id} LIMIT 1
    `.catch(() => []);
    const isMinor = atletaMinorRows[0]?.menor_idade === true;
    const responsavelEmail = atletaMinorRows[0]?.encarregado_educacao;

    if (isMinor) {
        await sql`
            UPDATE atleta_relacoes_pendentes
            SET status = 'pendente_responsavel', updated_at = NOW()
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
                        ${convite.alvo_clube_id},
                        ${responsavelRows[0].id},
                        'Aprovação necessária — Convite de Clube',
                        ${`O atleta menor "${me.email}" pretende juntar-se ao clube "${convite.alvo_nome}". É necessária a sua aprovação como encarregado de educação.`},
                        'aprovacao_responsavel',
                        false,
                        NOW()
                    )
                `.catch(() => {});
            }
        }

        return Response.json({ ok: true, estado: "pendente_responsavel" });
    }

    // Aceite — verificar conflito: atleta já vinculado a treinador independente
    let suspenso = false;

    if (me.organization_id) {
        // Verifica se a org atual do atleta tem atletas geridos por treinador mas sem clube
        const clubeAtual = await sql<{ id: string }[]>`
            SELECT c.id FROM clubes c
            WHERE c.organization_id = ${me.organization_id}
            LIMIT 1
        `;
        const estaEmOrgSemClube = clubeAtual.length === 0;

        // Verifica se há pelo menos um treinador na org atual
        const treinadorNaOrg = await sql<{ id: string }[]>`
            SELECT u.id FROM users u
            WHERE u.organization_id = ${me.organization_id}
              AND u.id != ${me.id}
            LIMIT 1
        `;
        if (estaEmOrgSemClube && treinadorNaOrg.length > 0) {
            suspenso = true;
        }
    }

    // Atualizar convite para aceite
    await sql`
        UPDATE atleta_relacoes_pendentes
        SET status = 'aceite', updated_at = NOW()
        WHERE id = ${id}
    `;

    // Mover atleta para a organização do clube
    await sql`
        UPDATE users
        SET organization_id = ${convite.alvo_clube_id}, updated_at = NOW()
        WHERE id = ${me.id}
    `.catch(() => {});

    // Atualizar o registo do atleta (se existir)
    const estadoAtleta = suspenso ? "Suspenso" : "Ativo";
    await sql`
        UPDATE atletas
        SET organization_id = ${convite.alvo_clube_id},
            estado = ${estadoAtleta},
            equipa_id = ${convite.alvo_equipa_id ?? null},
            updated_at = NOW()
        WHERE user_id = ${me.id}
    `.catch(() => {});

    if (suspenso) {
        // Notificar o admin do clube sobre o conflito
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${convite.alvo_clube_id},
                'Atleta suspenso — conflito de vinculação',
                ${`O atleta "${me.email}" aceitou o convite do clube "${convite.alvo_nome}" mas já estava vinculado a um treinador independente. O perfil ficou suspenso até o administrador resolver a situação.`},
                'Aviso',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    return Response.json({ ok: true, estado: "aceite", suspenso });
}
