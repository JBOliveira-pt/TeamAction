// Rota API treinador/criar-atleta: treinador independente cria atleta na organizacao.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";
import {
    isIdadePermitidaEscalao,
    getIdadeMaximaEscalao,
    MAX_ATLETAS_POR_EQUIPA,
} from "@/app/lib/grau-escalao-compat";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Só treinadores independentes (sem clube) podem criar atletas diretamente.
// Se o email fornecido pertence a um utilizador já vinculado a um clube,
// o atleta é criado com estado "Suspenso" e o admin é notificado.
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const treinadorUser = await sql<
        { id: string; organization_id: string; name: string }[]
    >`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const treinador = treinadorUser[0];
    if (!treinador)
        return new Response("Utilizador não encontrado.", { status: 404 });
    if (!treinador.organization_id)
        return new Response("Sem organização associada.", { status: 403 });

    // Verificar que o treinador NÃO tem clube (apenas treinadores independentes podem criar atletas)
    const clubeRows = await sql<{ id: string }[]>`
        SELECT id FROM clubes WHERE organization_id = ${treinador.organization_id} LIMIT 1
    `;
    if (clubeRows.length > 0) {
        return new Response(
            "Treinadores vinculados a um clube não podem criar atletas diretamente. Os atletas são geridos pelo Presidente do clube.",
            { status: 403 },
        );
    }

    const body = (await req.json()) as {
        nome: string;
        posicao?: string | null;
        numero_camisola?: number | null;
        equipa_id?: string | null;
        equipa_nome?: string | null;
        email?: string | null;
        mao_dominante?: string | null;
        data_nascimento?: string | null;
    };

    if (!body.nome?.trim())
        return new Response("Nome é obrigatório.", { status: 400 });
    if (!body.data_nascimento)
        return new Response("Data de nascimento é obrigatória.", {
            status: 400,
        });

    // Validar idade mínima de 5 anos
    {
        const birth = new Date(body.data_nascimento);
        const today = new Date();
        let idade = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) idade--;
        if (idade < 5) {
            return new Response(
                "O atleta deve ter pelo menos 5 anos de idade.",
                { status: 400 },
            );
        }
    }

    // Validar que a equipa pertence ao treinador
    if (body.equipa_id) {
        const equipaRows = await sql<{ id: string }[]>`
            SELECT id FROM equipas
            WHERE id = ${body.equipa_id}
              AND organization_id = ${treinador.organization_id}
              AND treinador_id = ${treinador.id}
            LIMIT 1
        `;
        if (equipaRows.length === 0) {
            return new Response(
                "Só pode adicionar atletas à sua própria equipa.",
                { status: 403 },
            );
        }

        // Validar: máximo de atletas na equipa (14)
        const [countRow] = await sql<{ total: number }[]>`
            SELECT COUNT(*)::int AS total FROM atletas WHERE equipa_id = ${body.equipa_id}
        `;
        if ((countRow?.total ?? 0) >= MAX_ATLETAS_POR_EQUIPA) {
            return new Response(
                `Esta equipa já tem o máximo de ${MAX_ATLETAS_POR_EQUIPA} atletas.`,
                { status: 409 },
            );
        }

        // Validar: idade compatível com o escalão da equipa
        if (body.data_nascimento) {
            const [equipaRow] = await sql<{ escalao: string }[]>`
                SELECT escalao FROM equipas WHERE id = ${body.equipa_id} LIMIT 1
            `;
            if (equipaRow) {
                const birth = new Date(body.data_nascimento);
                const today = new Date();
                let idade = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
                    idade--;
                if (!isIdadePermitidaEscalao(idade, equipaRow.escalao)) {
                    const limite = getIdadeMaximaEscalao(equipaRow.escalao);
                    return new Response(
                        `O atleta tem ${idade} anos mas o escalão ${equipaRow.escalao} requer idade inferior a ${limite} anos.`,
                        { status: 409 },
                    );
                }
            }
        }
    }

    let linkedUserId: string | null = null;
    let suspenso = false;
    let emailUserFound = false;
    let isMenor = false;
    let responsavelUserId: string | null = null;
    let responsavelEmail: string | null = null;

    // Se foi fornecido um email, verificar se existe na plataforma
    if (body.email?.trim()) {
        const emailNorm = body.email.trim().toLowerCase();
        const userRows = await sql<
            {
                id: string;
                organization_id: string | null;
                account_type: string | null;
                data_nascimento: string | null;
            }[]
        >`
            SELECT id, organization_id, account_type, data_nascimento FROM users WHERE LOWER(email) = ${emailNorm} LIMIT 1
        `;

        if (userRows.length > 0) {
            emailUserFound = true;
            const atletaUser = userRows[0];
            linkedUserId = atletaUser.id;

            // Verificar se é menor de idade (via atletas.menor_idade ou cálculo de idade)
            const [atletaRow] = await sql<
                {
                    menor_idade: boolean | null;
                    encarregado_educacao: string | null;
                }[]
            >`
                SELECT menor_idade, encarregado_educacao FROM atletas
                WHERE user_id = ${atletaUser.id} LIMIT 1
            `.catch(() => [{ menor_idade: null, encarregado_educacao: null }]);

            if (atletaRow?.menor_idade === true) {
                isMenor = true;
                responsavelEmail = atletaRow.encarregado_educacao ?? null;
            } else if (atletaUser.data_nascimento) {
                const birth = new Date(atletaUser.data_nascimento);
                const today = new Date();
                let idade = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
                    idade--;
                if (idade < 18) {
                    isMenor = true;
                    responsavelEmail = atletaRow?.encarregado_educacao ?? null;
                }
            }

            // Se menor, buscar user_id do responsável
            if (isMenor && responsavelEmail) {
                const [respUser] = await sql<{ id: string }[]>`
                    SELECT id FROM users
                    WHERE LOWER(email) = ${responsavelEmail.trim().toLowerCase()}
                      AND account_type = 'responsavel'
                    LIMIT 1
                `.catch(() => []);
                responsavelUserId = respUser?.id ?? null;
            }

            // Verificar se esse utilizador está vinculado a um clube diferente
            if (
                atletaUser.organization_id &&
                atletaUser.organization_id !== treinador.organization_id
            ) {
                const atletaTemClube = await sql<{ id: string }[]>`
                    SELECT c.id FROM clubes c
                    WHERE c.organization_id = ${atletaUser.organization_id}
                    LIMIT 1
                `;
                if (atletaTemClube.length > 0) {
                    suspenso = true;
                }
            }
        }
    }

    const estado = suspenso ? "Suspenso" : isMenor ? "Pendente" : "Ativo";

    // Se o atleta já existe na plataforma (user com conta), reutilizar o registo existente
    let atletaId: string;
    let atletaJaExistia = false;

    if (linkedUserId) {
        const [existente] = await sql<{ id: string }[]>`
            SELECT id FROM atletas WHERE user_id = ${linkedUserId} LIMIT 1
        `;
        if (existente) {
            atletaId = existente.id;
            atletaJaExistia = true;
            // Atualizar dados complementares se necessário
            await sql`
                UPDATE atletas SET
                    posicao = COALESCE(${body.posicao ?? null}, posicao),
                    numero_camisola = COALESCE(${body.numero_camisola ?? null}, numero_camisola),
                    mao_dominante = COALESCE(${body.mao_dominante ?? null}, mao_dominante),
                    updated_at = NOW()
                WHERE id = ${atletaId}
            `;
        } else {
            // User existe mas não tem registo atleta — criar sem equipa_id (fica pendente)
            const [novo] = await sql<{ id: string }[]>`
                INSERT INTO atletas (
                    id, nome, posicao, numero_camisola,
                    equipa_id, estado, federado, mao_dominante,
                    organization_id, user_id, data_nascimento,
                    menor_idade, encarregado_educacao,
                    created_at, updated_at
                ) VALUES (
                    gen_random_uuid(),
                    ${body.nome.trim()},
                    ${body.posicao ?? null},
                    ${body.numero_camisola ?? null},
                    ${null},
                    ${estado},
                    false,
                    ${body.mao_dominante ?? null},
                    ${treinador.organization_id},
                    ${linkedUserId},
                    ${body.data_nascimento ?? null},
                    ${isMenor || null},
                    ${responsavelEmail},
                    NOW(), NOW()
                )
                RETURNING id
            `;
            atletaId = novo.id;
        }
    } else {
        // Atleta fictício (sem conta na plataforma) — criar normalmente com equipa_id
        const [novo] = await sql<{ id: string }[]>`
            INSERT INTO atletas (
                id, nome, posicao, numero_camisola,
                equipa_id, estado, federado, mao_dominante,
                organization_id, user_id, data_nascimento,
                menor_idade, encarregado_educacao,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                ${body.nome.trim()},
                ${body.posicao ?? null},
                ${body.numero_camisola ?? null},
                ${body.equipa_id ?? null},
                ${estado},
                false,
                ${body.mao_dominante ?? null},
                ${treinador.organization_id},
                ${null},
                ${body.data_nascimento ?? null},
                ${isMenor || null},
                ${responsavelEmail},
                NOW(), NOW()
            )
            RETURNING id
        `;
        atletaId = novo.id;
    }

    // Notificação ao admin se atleta ficou suspenso por conflito
    if (suspenso) {
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${treinador.organization_id},
                'Atleta suspenso por conflito de clube',
                ${`O atleta "${body.nome.trim()}" foi criado pelo treinador "${treinador.name}" mas está vinculado a outro clube. O perfil ficou suspenso até resolução.`},
                'Aviso',
                false,
                NOW()
            )
        `.catch(() => {});
    } else if (body.email?.trim() && emailUserFound && linkedUserId) {
        // User existe na plataforma — enviar convite de vinculação à equipa
        if (body.equipa_id) {
            if (isMenor) {
                // Menor: convite vai diretamente para pendente_responsavel
                await sql`
                    INSERT INTO convites_equipa (id, organization_id, treinador_id, treinador_nome, atleta_id, equipa_id, equipa_nome, estado, created_at, updated_at)
                    VALUES (
                        gen_random_uuid(),
                        ${treinador.organization_id},
                        ${treinador.id},
                        ${treinador.name},
                        ${atletaId},
                        ${body.equipa_id},
                        ${body.equipa_nome ?? null},
                        'pendente_responsavel',
                        NOW(), NOW()
                    )
                `.catch(() => {});

                if (responsavelUserId) {
                    // Notificação ao responsável para aprovar
                    await sql`
                        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                        VALUES (
                            gen_random_uuid(),
                            ${treinador.organization_id},
                            ${responsavelUserId},
                            ${`Aprovação necessária: convite para equipa${body.equipa_nome ? ` ${body.equipa_nome}` : ""}`},
                            ${`O treinador "${treinador.name}" pretende adicionar o atleta menor "${body.nome.trim()}" à equipa. Como encarregado de educação, a sua aprovação é necessária.`},
                            'convite_equipa',
                            false,
                            NOW()
                        )
                    `.catch(() => {});
                } else {
                    // Responsável não está na plataforma — notificar o atleta para informar o responsável
                    await sql`
                        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                        VALUES (
                            gen_random_uuid(),
                            ${treinador.organization_id},
                            ${linkedUserId},
                            ${`Convite pendente para a equipa${body.equipa_nome ? ` ${body.equipa_nome}` : ""}`},
                            ${`O treinador "${treinador.name}" pretende adicioná-lo à equipa. Como é menor de idade, o seu encarregado de educação precisa aprovar o convite. Peça ao seu responsável para se registar na plataforma.`},
                            'convite_equipa',
                            false,
                            NOW()
                        )
                    `.catch(() => {});
                }
            } else {
                // Adulto: fluxo normal — convite pendente para o atleta
                await sql`
                    INSERT INTO convites_equipa (id, organization_id, treinador_id, treinador_nome, atleta_id, equipa_id, equipa_nome, estado, created_at, updated_at)
                    VALUES (
                        gen_random_uuid(),
                        ${treinador.organization_id},
                        ${treinador.id},
                        ${treinador.name},
                        ${atletaId},
                        ${body.equipa_id},
                        ${body.equipa_nome ?? null},
                        'pendente',
                        NOW(), NOW()
                    )
                `.catch(() => {});

                // Notificação direcionada ao atleta
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${treinador.organization_id},
                        ${linkedUserId},
                        ${`Convite para a equipa${body.equipa_nome ? ` ${body.equipa_nome}` : ""}`},
                        ${`O treinador "${treinador.name}" adicionou-o como atleta e enviou um convite de vinculação.`},
                        'convite_equipa',
                        false,
                        NOW()
                    )
                `.catch(() => {});
            }
        }

        // Notificação normal
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${treinador.organization_id},
                'Novo atleta adicionado',
                ${`O treinador "${treinador.name}" adicionou o atleta "${body.nome.trim()}" (vinculado a conta existente).`},
                'Info',
                false,
                NOW()
            )
        `.catch(() => {});
    } else if (body.email?.trim() && !emailUserFound) {
        // Email não pertence a ninguém na plataforma — avisar admin
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${treinador.organization_id},
                'Convite de atleta pendente',
                ${`O treinador "${treinador.name}" criou o atleta "${body.nome.trim()}" com email "${body.email.trim()}" que não existe na plataforma. Envie o convite de registo manualmente.`},
                'Alerta',
                false,
                NOW()
            )
        `.catch(() => {});
    } else {
        // Notificação normal de novo atleta
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${treinador.organization_id},
                'Novo atleta adicionado',
                ${`O treinador "${treinador.name}" adicionou o atleta "${body.nome.trim()}"${body.equipa_nome ? ` à equipa "${body.equipa_nome}"` : ""}.`},
                'Info',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    return Response.json({ id: atletaId, suspenso }, { status: 201 });
}
