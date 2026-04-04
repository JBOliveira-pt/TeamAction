import { sql, getOrganizationId } from "./_shared";
import { auth } from "@clerk/nextjs/server";

// ---------- ATLETAS ----------

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
                equipas.nome AS equipa_nome,
                users.email AS user_email,
                users.telefone AS user_telefone,
                users.data_nascimento AS user_data_nascimento
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
                encarregado: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.mao_dominante,
                equipas.nome AS equipa_nome,
                treinador.name AS treinador_nome,
                u."Encarregado_Edu" AS encarregado
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN users treinador ON treinador.id = equipas.treinador_id
            LEFT JOIN users u ON u.id = atletas.user_id
            WHERE atletas.user_id = ${user.id}
            LIMIT 1
        `;

        if (!atleta)
            return {
                nome: user.name,
                posicao: null,
                numero_camisola: null,
                estado: null,
                mao_dominante: null,
                equipa_nome: null,
                treinador_nome: null,
                encarregado: null,
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
                menor_idade: boolean | null;
                encarregado_edu: string | null;
                status: boolean | null;
            }[]
        >`
            SELECT
                id, name, email, telefone, data_nascimento,
                morada, cidade, codigo_postal, pais,
                "Menor_idade" AS menor_idade,
                "Encarregado_Edu" AS encarregado_edu,
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
            }[]
        >`
            SELECT atletas.mao_dominante, equipas.nome AS equipa_nome
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            WHERE atletas.user_id = ${user.id}
            LIMIT 1
        `;

        let guardian: { name: string; email: string } | null = null;
        if (user.menor_idade && user.encarregado_edu) {
            const [g] = await sql<{ name: string; email: string }[]>`
                SELECT name, email FROM users
                WHERE email = ${user.encarregado_edu}
                LIMIT 1
            `;
            guardian = g ?? null;
        }

        return { user, atleta: atleta ?? null, guardian };
    } catch (error) {
        console.error("Database Error:", error);
        return null;
    }
}

export async function fetchAtletaDoResponsavel() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return null;

        // Get the guardian's own user record (need their email to find the minor)
        const [guardian] = await sql<
            { id: string; name: string; email: string }[]
        >`
            SELECT id, name, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!guardian) return null;

        // Find the minor whose Encarregado_Edu matches the guardian's email
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
                id, name, email, telefone, data_nascimento, morada, cidade, codigo_postal, pais,
                CASE
                    WHEN status::text = 'true'  THEN true
                    WHEN status::text = 'false' THEN false
                    ELSE NULL
                END AS status
            FROM users
            WHERE "Encarregado_Edu" = ${guardian.email}
            AND "Menor_idade" = true
            LIMIT 1
        `;
        if (!minorUser) return null;

        // Get the athlete profile for the minor
        const [atleta] = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                mao_dominante: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.mao_dominante,
                equipas.nome AS equipa_nome
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
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
