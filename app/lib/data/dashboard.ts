// Queries do dashboard: mensalidades, resumo, staff e estatísticas.
import { sql, getOrganizationId, requireAccountType } from "./_shared";

export async function fetchMensalidades() {
    try {
        const { organizationId } = await requireAccountType("presidente");

        const data = await sql<
            {
                id: string;
                mes: number;
                ano: number;
                valor: number | null;
                estado: string;
                data_pagamento: string | null;
                atleta_id: string;
                atleta_nome: string;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                mensalidades.id,
                mensalidades.mes,
                mensalidades.ano,
                mensalidades.valor,
                mensalidades.estado,
                mensalidades.data_pagamento,
                atletas.id AS atleta_id,
                atletas.nome AS atleta_nome,
                equipas.nome AS equipa_nome
            FROM mensalidades
            JOIN atletas ON mensalidades.atleta_id = atletas.id
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            WHERE mensalidades.organization_id = ${organizationId}
            ORDER BY mensalidades.ano DESC, mensalidades.mes DESC, atletas.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch mensalidades.");
    }
}

// ---------- DASHBOARD (resumo) ----------

export async function fetchPresidenteDashboard() {
    try {
        const { organizationId, dbUserId } =
            await requireAccountType("presidente");

        const [equipas, atletas, jogos, mensalidades, epoca, presidente] =
            await Promise.all([
                sql`SELECT COUNT(*) FROM equipas WHERE organization_id = ${organizationId}`,
                sql`SELECT COUNT(*) FROM atletas WHERE organization_id = ${organizationId}`,
                sql`SELECT COUNT(*) FROM jogos WHERE organization_id = ${organizationId} AND estado = 'agendado'`,
                sql`SELECT COUNT(*) FROM mensalidades WHERE organization_id = ${organizationId} AND estado = 'em_atraso'`,
                sql<{ nome: string }[]>`
                    SELECT nome FROM epocas
                    WHERE organization_id = ${organizationId} AND ativa = true
                    LIMIT 1
                `,
                sql<{ name: string | null }[]>`
                    SELECT name FROM users
                    WHERE id = ${dbUserId}
                    LIMIT 1
                `,
            ]);

        return {
            totalEquipas: Number(equipas[0].count),
            totalAtletas: Number(atletas[0].count),
            jogosAgendados: Number(jogos[0].count),
            mensalidadesEmAtraso: Number(mensalidades[0].count),
            epocaNome: epoca[0]?.nome ?? null,
            presidenteNome: presidente[0]?.name?.trim() || null,
            organizationId, // ← CAMPO ADICIONADO
        };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch presidente dashboard.");
    }
}

// ---------- STAFF ----------

export async function fetchStaff() {
    const organizationId = await getOrganizationId();
    const result = await sql<
        {
            id: string;
            nome: string;
            funcao: string;
            equipa_id: string | null;
            equipa_nome: string | null;
            equipa_escalao: string | null;
            user_id: string | null;
            user_email: string | null;
            image_url: string | null;
            estado: string;
            created_at: string;
            grau_id: number | null;
            grau_nome: string | null;
        }[]
    >`
    SELECT
      s.id, s.nome, s.funcao,
      s.equipa_id, e.nome AS equipa_nome, e.escalao AS equipa_escalao,
      s.user_id, u.email AS user_email, u.image_url,
      s.estado,
      s.created_at,
      COALESCE(
        s.grau_tecnico_id,
        (SELECT gt.id FROM user_cursos uc
         JOIN cursos c ON c.id = uc.curso_id
         JOIN graus_tecnicos gt ON gt.id = c.level_id
         WHERE uc.user_id = s.user_id
         ORDER BY gt.id DESC LIMIT 1)
      ) AS grau_id,
      (SELECT gt2.name FROM graus_tecnicos gt2
       WHERE gt2.id = COALESCE(
         s.grau_tecnico_id,
         (SELECT gt3.id FROM user_cursos uc2
          JOIN cursos c2 ON c2.id = uc2.curso_id
          JOIN graus_tecnicos gt3 ON gt3.id = c2.level_id
          WHERE uc2.user_id = s.user_id
          ORDER BY gt3.id DESC LIMIT 1)
       )) AS grau_nome
    FROM staff s
    LEFT JOIN equipas e ON s.equipa_id = e.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.organization_id = ${organizationId}
    ORDER BY s.created_at DESC
  `;
    return result;
}

// ---------- ESTATÃSTICAS ----------

export async function fetchEstatisticasPorEquipa() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                equipa_id: string;
                equipa: string;
                jogos: number;
                vitorias: number;
                empates: number;
                derrotas: number;
                golos_marcados: number;
                golos_sofridos: number;
            }[]
        >`
            SELECT
                equipas.id AS equipa_id,
                equipas.nome AS equipa,
                COUNT(jogos.id) AS jogos,
                COUNT(CASE WHEN jogos.resultado_nos > jogos.resultado_adv THEN 1 END) AS vitorias,
                COUNT(CASE WHEN jogos.resultado_nos = jogos.resultado_adv THEN 1 END) AS empates,
                COUNT(CASE WHEN jogos.resultado_nos < jogos.resultado_adv THEN 1 END) AS derrotas,
                COALESCE(SUM(jogos.resultado_nos), 0) AS golos_marcados,
                COALESCE(SUM(jogos.resultado_adv), 0) AS golos_sofridos
            FROM equipas
            LEFT JOIN jogos ON jogos.equipa_id = equipas.id
                AND jogos.estado = 'realizado'
                AND jogos.resultado_nos IS NOT NULL
            WHERE equipas.organization_id = ${organizationId}
            GROUP BY equipas.id, equipas.nome
            ORDER BY vitorias DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch estatisticas por equipa.");
    }
}

export async function fetchTopAtletas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                atleta_id: string;
                nome: string;
                equipa_nome: string | null;
                golos: number;
                assistencias: number;
                total_treinos: number;
                presencas: number;
            }[]
        >`
            SELECT
                atletas.id AS atleta_id,
                atletas.nome,
                equipas.nome AS equipa_nome,
                COUNT(DISTINCT CASE WHEN eventos_jogo.tipo = 'Golo Feito' THEN eventos_jogo.id END) AS golos,
                COUNT(DISTINCT CASE WHEN eventos_jogo.tipo = 'Assistência' THEN eventos_jogo.id END) AS assistencias,
                COUNT(DISTINCT assiduidade.sessao_id) AS total_treinos,
                COUNT(DISTINCT CASE WHEN assiduidade.presente THEN assiduidade.sessao_id END) AS presencas
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN eventos_jogo ON eventos_jogo.atleta_id = atletas.id
            LEFT JOIN assiduidade ON assiduidade.atleta_id = atletas.id
            WHERE atletas.organization_id = ${organizationId}
            GROUP BY atletas.id, atletas.nome, equipas.nome
            ORDER BY golos DESC
            LIMIT 5
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch top atletas.");
    }
}
