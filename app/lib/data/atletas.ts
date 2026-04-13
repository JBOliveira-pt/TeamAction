// Queries de atletas: listar, detalhar, relações e vinculações.
import { sql, getOrganizationId } from "./_shared";
import { auth } from "@clerk/nextjs/server";

export async function fetchAtletas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                equipa_nome: string | null;
                equipa_id: string | null;
                mensalidade_estado: string | null;
                federado: boolean;
                numero_federado: string | null;
                mao_dominante: string | null;
                user_id: string | null;
                data_nascimento: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.federado,
                atletas.numero_federado,
                atletas.mao_dominante,
                atletas.user_id,
                atletas.data_nascimento,
                equipas.nome AS equipa_nome,
                equipas.id   AS equipa_id,
                mensalidades.estado AS mensalidade_estado
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN mensalidades ON mensalidades.atleta_id = atletas.id
                AND mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
                AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
            WHERE atletas.organization_id = ${organizationId}
            ORDER BY atletas.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch atletas.");
    }
}

export async function fetchAtletaById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const atleta = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                federado: boolean;
                numero_federado: string | null;
                mao_dominante: string | null;
                equipa_id: string | null;
                equipa_nome: string | null;
                user_id: string | null;
                user_email: string | null;
                user_telefone: string | null;
                user_data_nascimento: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.federado,
                atletas.numero_federado,
                atletas.mao_dominante,
                atletas.equipa_id,
                atletas.user_id,
                equipas.nome AS equipa_nome,
                users.email AS user_email,
                users.telefone AS user_telefone,
                COALESCE(users.data_nascimento, atletas.data_nascimento) AS user_data_nascimento
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN users ON atletas.user_id = users.id
            WHERE atletas.id = ${id} AND atletas.organization_id = ${organizationId}
        `;

        const mensalidades = await sql<
            {
                id: string;
                mes: number;
                ano: number;
                valor: number | null;
                estado: string;
                data_pagamento: string | null;
            }[]
        >`
            SELECT id, mes, ano, valor, estado, data_pagamento
            FROM mensalidades
            WHERE atleta_id = ${id}
            ORDER BY ano DESC, mes DESC
            LIMIT 12
        `;

        const estatisticas = await sql<
            {
                total_jogos: number;
                total_golos: number;
                total_assistencias: number;
                total_exclusoes: number;
                total_cartoes_amarelos: number;
                total_cartoes_vermelhos: number;
                total_minutos: number;
            }[]
        >`
            SELECT
                COUNT(estatisticas_jogo.id) AS total_jogos,
                COALESCE(SUM(golos), 0) AS total_golos,
                COALESCE(SUM(assistencias), 0) AS total_assistencias,
                COALESCE(SUM(exclusoes), 0) AS total_exclusoes,
                COUNT(CASE WHEN cartao_amarelo THEN 1 END) AS total_cartoes_amarelos,
                COUNT(CASE WHEN cartao_vermelho THEN 1 END) AS total_cartoes_vermelhos,
                COALESCE(SUM(minutos_jogados), 0) AS total_minutos
            FROM estatisticas_jogo
            WHERE atleta_id = ${id}
        `;

        const assiduidade = await sql<
            {
                total_treinos: number;
                presencas: number;
            }[]
        >`
            SELECT
                COUNT(assiduidade.id) AS total_treinos,
                COUNT(CASE WHEN presente THEN 1 END) AS presencas
            FROM assiduidade
            WHERE atleta_id = ${id}
        `;

        return {
            atleta: atleta[0],
            mensalidades,
            estatisticas: estatisticas[0],
            assiduidade: assiduidade[0],
        };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch atleta.");
    }
}

export async function fetchAtletaAtual() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return null;

        const [user] = await sql<{ id: string; name: string }[]>`
            SELECT id, name FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return null;

        const [atleta] = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                mao_dominante: string | null;
                equipa_nome: string | null;
                treinador_nome: string | null;
                treinador_email: string | null;
                encarregado: string | null;
                clube_nome: string | null;
                responsavel_associado: boolean;
                responsavel_nome: string | null;
                responsavel_email: string | null;
                menor_idade: boolean;
                peso_kg: number | null;
                altura_cm: number | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.mao_dominante,
                COALESCE(atletas.menor_idade, false) AS menor_idade,
                atletas.peso_kg,
                atletas.altura_cm,
                equipas.nome AS equipa_nome,
                treinador.name AS treinador_nome,
                treinador.email AS treinador_email,
                atletas.encarregado_educacao AS encarregado,
                CASE
                    WHEN pres.id IS NOT NULL THEN o.name
                    ELSE NULL
                END AS clube_nome,
                CASE WHEN resp.id IS NOT NULL THEN true ELSE false END AS responsavel_associado,
                resp.name AS responsavel_nome,
                resp.email AS responsavel_email
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN users treinador ON treinador.id = equipas.treinador_id
            LEFT JOIN users u ON u.id = atletas.user_id
            LEFT JOIN organizations o ON o.id = atletas.organization_id
            LEFT JOIN users pres ON pres.organization_id = atletas.organization_id AND pres.account_type = 'presidente'
            LEFT JOIN users resp ON resp.email = atletas.encarregado_educacao AND resp.account_type = 'responsavel'
            WHERE atletas.user_id = ${user.id}
            LIMIT 1
        `;

        // Buscar relações pendentes do atleta (clube e responsável)
        const pendentes = await sql<
            {
                relation_kind: string;
                alvo_nome: string | null;
                status: string;
            }[]
        >`
            SELECT relation_kind, alvo_nome, status
            FROM atleta_relacoes_pendentes
            WHERE atleta_user_id = ${user.id}
              AND status IN ('pendente', 'pendente_responsavel')
            ORDER BY created_at DESC
        `.catch(() => []);

        const clubePendente = pendentes.find(
            (p) => p.relation_kind === "clube",
        );
        const responsavelPendente = pendentes.find(
            (p) => p.relation_kind === "responsavel",
        );

        if (!atleta)
            return {
                nome: user.name,
                posicao: null,
                numero_camisola: null,
                estado: null,
                mao_dominante: null,
                equipa_nome: null,
                treinador_nome: null,
                treinador_email: null,
                encarregado: null,
                clube_nome: null,
                clube_pendente: clubePendente?.alvo_nome ?? null,
                responsavel_associado: false,
                responsavel_nome: null,
                responsavel_email: null,
                menor_idade: false,
                responsavel_pendente: !!responsavelPendente,
                peso_kg: null,
                altura_cm: null,
                estatisticas: null,
                assiduidade: null,
            };

        const [estatisticas] = await sql<
            {
                total_jogos: number;
                total_golos: number;
                total_assistencias: number;
                total_minutos: number;
            }[]
        >`
            SELECT
                COUNT(estatisticas_jogo.id) AS total_jogos,
                COALESCE(SUM(golos), 0) AS total_golos,
                COALESCE(SUM(assistencias), 0) AS total_assistencias,
                COALESCE(SUM(minutos_jogados), 0) AS total_minutos
            FROM estatisticas_jogo
            WHERE atleta_id = ${atleta.id}
        `;

        const [assiduidade] = await sql<
            {
                total_treinos: number;
                presencas: number;
            }[]
        >`
            SELECT
                COUNT(assiduidade.id) AS total_treinos,
                COUNT(CASE WHEN presente THEN 1 END) AS presencas
            FROM assiduidade
            WHERE atleta_id = ${atleta.id}
        `;

        return {
            ...atleta,
            clube_pendente: clubePendente?.alvo_nome ?? null,
            responsavel_pendente: !!responsavelPendente,
            estatisticas: estatisticas ?? null,
            assiduidade: assiduidade ?? null,
        };
    } catch (error) {
        console.error("Database Error:", error);
        return null;
    }
}

export async function fetchPerfilAtletaGeral() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return null;

        const [user] = await sql<
            {
                id: string;
                name: string;
                email: string;
                telefone: string | null;
                data_nascimento: string | null;
                morada: string | null;
                cidade: string | null;
                codigo_postal: string | null;
                pais: string | null;
                status: boolean | null;
            }[]
        >`
            SELECT
                id, name, email, telefone, data_nascimento,
                morada, cidade, codigo_postal, pais,
                CASE
                    WHEN status::text = 'true'  THEN true
                    WHEN status::text = 'false' THEN false
                    ELSE NULL
                END AS status
            FROM users
            WHERE clerk_user_id = ${clerkUserId}
            LIMIT 1
        `;
        if (!user) return null;

        const [atleta] = await sql<
            {
                mao_dominante: string | null;
                equipa_nome: string | null;
                federado: boolean | null;
                numero_federado: string | null;
                treinador_nome: string | null;
                menor_idade: boolean | null;
                encarregado_educacao: string | null;
                peso_kg: number | null;
                altura_cm: number | null;
            }[]
        >`
            SELECT atletas.mao_dominante, equipas.nome AS equipa_nome,
                   atletas.federado, atletas.numero_federado,
                   treinador.name AS treinador_nome,
                   atletas.menor_idade, atletas.encarregado_educacao,
                   atletas.peso_kg, atletas.altura_cm
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN users treinador ON treinador.id = equipas.treinador_id
            WHERE atletas.user_id = ${user.id}
            LIMIT 1
        `;

        const peso_kg = atleta?.peso_kg ?? null;
        const altura_cm = atleta?.altura_cm ?? null;

        let guardian: {
            name: string;
            email: string;
            image_url: string | null;
        } | null = null;
        let responsavelAceite = false;
        if (atleta?.menor_idade && atleta?.encarregado_educacao) {
            const [g] = await sql<
                { name: string; email: string; image_url: string | null }[]
            >`
                SELECT name, email, image_url FROM users
                WHERE email = ${atleta.encarregado_educacao}
                LIMIT 1
            `;
            guardian = g ?? null;

            // Verificar se a vinculação foi aceite
            const [rel] = await sql<{ status: string }[]>`
                SELECT status FROM atleta_relacoes_pendentes
                WHERE atleta_user_id = ${user.id}
                  AND relation_kind = 'responsavel'
                  AND status = 'aceite'
                LIMIT 1
            `.catch(() => []);
            responsavelAceite = !!rel;
        }

        return {
            user: {
                ...user,
                peso_kg,
                altura_cm,
                menor_idade: atleta?.menor_idade ?? null,
                encarregado_educacao: atleta?.encarregado_educacao ?? null,
            },
            atleta: atleta ?? null,
            guardian,
            responsavelAceite,
        };
    } catch (error) {
        console.error("Database Error:", error);
        return null;
    }
}

export async function fetchAtletaDoResponsavel() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return null;

        // Obter registo do responsável (precisa do email para encontrar o menor)
        const [guardian] = await sql<
            { id: string; name: string; email: string }[]
        >`
            SELECT id, name, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!guardian) return null;

        // Encontrar o menor cujo encarregado_educacao (atletas) corresponde ao email do responsável
        const [minorUser] = await sql<
            {
                id: string;
                name: string;
                email: string;
                telefone: string | null;
                data_nascimento: string | null;
                morada: string | null;
                cidade: string | null;
                codigo_postal: string | null;
                pais: string | null;
                status: boolean | null;
            }[]
        >`
            SELECT
                u.id, u.name, u.email, u.telefone, u.data_nascimento,
                u.morada, u.cidade, u.codigo_postal, u.pais,
                CASE
                    WHEN u.status::text = 'true'  THEN true
                    WHEN u.status::text = 'false' THEN false
                    ELSE NULL
                END AS status
            FROM users u
            INNER JOIN atletas a ON a.user_id = u.id
            WHERE a.encarregado_educacao = ${guardian.email}
            AND a.menor_idade = true
            LIMIT 1
        `;
        if (!minorUser) return null;

        // Obter perfil de atleta do menor
        const [atleta] = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                mao_dominante: string | null;
                altura_cm: number | null;
                peso_kg: number | null;
                equipa_nome: string | null;
                treinador_nome: string | null;
                treinador_email: string | null;
                clube_nome: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.mao_dominante,
                atletas.altura_cm::float AS altura_cm,
                atletas.peso_kg::float AS peso_kg,
                equipas.nome AS equipa_nome,
                treinador.name AS treinador_nome,
                treinador.email AS treinador_email,
                CASE
                    WHEN pres.id IS NOT NULL THEN o.name
                    ELSE NULL
                END AS clube_nome
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN users treinador ON treinador.id = equipas.treinador_id
            LEFT JOIN organizations o ON o.id = atletas.organization_id
            LEFT JOIN users pres ON pres.organization_id = atletas.organization_id AND pres.account_type = 'presidente'
            WHERE atletas.user_id = ${minorUser.id}
            LIMIT 1
        `;

        let estatisticas = null;
        let assiduidade = null;

        if (atleta) {
            const [stats] = await sql<
                {
                    total_jogos: number;
                    total_golos: number;
                    total_assistencias: number;
                    total_minutos: number;
                }[]
            >`
                SELECT
                    COUNT(estatisticas_jogo.id) AS total_jogos,
                    COALESCE(SUM(golos), 0) AS total_golos,
                    COALESCE(SUM(assistencias), 0) AS total_assistencias,
                    COALESCE(SUM(minutos_jogados), 0) AS total_minutos
                FROM estatisticas_jogo
                WHERE atleta_id = ${atleta.id}
            `;
            estatisticas = stats ?? null;

            const [assid] = await sql<
                {
                    total_treinos: number;
                    presencas: number;
                }[]
            >`
                SELECT
                    COUNT(assiduidade.id) AS total_treinos,
                    COUNT(CASE WHEN presente THEN 1 END) AS presencas
                FROM assiduidade
                WHERE atleta_id = ${atleta.id}
            `;
            assiduidade = assid ?? null;
        }

        return {
            guardian,
            minorUser,
            atleta: atleta ?? null,
            estatisticas,
            assiduidade,
        };
    } catch (error) {
        console.error("Database Error:", error);
        return null;
    }
}

export async function fetchConvitesPendentes() {
    try {
        const organizationId = await getOrganizationId();
        return await sql<
            {
                id: string;
                atleta_user_id: string;
                user_name: string;
                user_email: string;
                user_image: string | null;
                status: string;
                created_at: string;
            }[]
        >`
            SELECT
                arp.id,
                arp.atleta_user_id,
                u.name  AS user_name,
                u.email AS user_email,
                u.image_url AS user_image,
                arp.status,
                arp.created_at::text
            FROM atleta_relacoes_pendentes arp
            JOIN users u ON u.id = arp.atleta_user_id
            WHERE arp.alvo_clube_id = ${organizationId}
            AND arp.relation_kind = 'clube'
            ORDER BY arp.created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}
