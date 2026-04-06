import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export type AprovacaoPendente = {
    id: string;
    tipo: "convite_equipa" | "convite_clube" | "pedido_plano" | "alteracao_dados";
    titulo: string;
    descricao: string;
    created_at: string;
};

/**
 * Retorna todas as aprovações pendentes para o responsável autenticado.
 * Busca em: convites_equipa, atleta_relacoes_pendentes e pedidos_plano.
 */
export async function fetchAprovacoesPendentes(): Promise<AprovacaoPendente[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return [];

    // Obter email do responsável
    const [guardian] = await sql<{ id: string; email: string }[]>`
        SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!guardian) return [];

    // Encontrar o(s) menor(es) vinculado(s) a este responsável
    const minors = await sql<{ user_id: string; id: string; nome: string }[]>`
        SELECT a.user_id, a.id, a.nome FROM atletas a
        WHERE a.encarregado_educacao = ${guardian.email}
          AND a.menor_idade = true
    `;
    if (!minors.length) return [];

    const minorUserIds = minors.map((m) => m.user_id);
    const minorAtletaIds = minors.map((m) => m.id);
    const minorNomes = Object.fromEntries(
        minors.map((m) => [m.user_id, m.nome]),
    );
    const minorNomesById = Object.fromEntries(
        minors.map((m) => [m.id, m.nome]),
    );

    const results: AprovacaoPendente[] = [];

    // 1. Convites de equipa pendentes do responsável
    const convitesEquipa = await sql<
        {
            id: string;
            equipa_nome: string | null;
            treinador_nome: string;
            atleta_id: string;
            created_at: string;
        }[]
    >`
        SELECT id, equipa_nome, treinador_nome, atleta_id, created_at::text
        FROM convites_equipa
        WHERE atleta_id = ANY(${minorAtletaIds})
          AND estado = 'pendente_responsavel'
        ORDER BY created_at DESC
    `.catch(() => []);

    for (const c of convitesEquipa) {
        const nome = minorNomesById[c.atleta_id] ?? "Atleta";
        results.push({
            id: c.id,
            tipo: "convite_equipa",
            titulo: `Associação a Equipa${c.equipa_nome ? ` "${c.equipa_nome}"` : ""}`,
            descricao: `${nome} pretende juntar-se à equipa do treinador "${c.treinador_nome}".`,
            created_at: c.created_at,
        });
    }

    // 2. Convites de clube pendentes do responsável
    const convitesClubeRows = await sql<
        {
            id: string;
            alvo_nome: string;
            atleta_user_id: string;
            created_at: string;
        }[]
    >`
        SELECT id, alvo_nome, atleta_user_id, created_at::text
        FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ANY(${minorUserIds})
          AND relation_kind = 'clube'
          AND status = 'pendente_responsavel'
        ORDER BY created_at DESC
    `.catch(() => []);

    for (const c of convitesClubeRows) {
        const nome = minorNomes[c.atleta_user_id] ?? "Atleta";
        results.push({
            id: c.id,
            tipo: "convite_clube",
            titulo: `Federação ao Clube "${c.alvo_nome}"`,
            descricao: `${nome} pretende juntar-se ao clube "${c.alvo_nome}".`,
            created_at: c.created_at,
        });
    }

    // 3. Pedidos de plano pendentes do responsável
    const pedidosPlano = await sql<
        {
            id: string;
            plano_solicitado: string;
            user_id: string;
            created_at: string;
        }[]
    >`
        SELECT id, plano_solicitado, user_id, created_at::text
        FROM pedidos_plano
        WHERE user_id = ANY(${minorUserIds})
          AND status = 'pendente_responsavel'
        ORDER BY created_at DESC
    `.catch(() => []);

    const planoLabel: Record<string, string> = {
        team: "Team",
        club_pro: "Club Pro",
        legend: "Legend",
    };

    for (const p of pedidosPlano) {
        const nome = minorNomes[p.user_id] ?? "Atleta";
        results.push({
            id: p.id,
            tipo: "pedido_plano",
            titulo: `Alteração de Plano — ${planoLabel[p.plano_solicitado] ?? p.plano_solicitado}`,
            descricao: `${nome} solicitou a alteração para o plano ${planoLabel[p.plano_solicitado] ?? p.plano_solicitado}.`,
            created_at: p.created_at,
        });
    }

    // 4. Alterações de dados pendentes (dados_pendentes IS NOT NULL)
    const atletasComDadosPendentes = await sql<
        {
            user_id: string;
            nome: string;
            dados_pendentes: Record<string, unknown>;
            updated_at: string;
        }[]
    >`
        SELECT a.user_id, a.nome, a.dados_pendentes, a.updated_at::text
        FROM atletas a
        WHERE a.user_id = ANY(${minorUserIds})
          AND a.dados_pendentes IS NOT NULL
    `.catch(() => []);

    for (const a of atletasComDadosPendentes) {
        results.push({
            id: a.user_id,
            tipo: "alteracao_dados",
            titulo: "Alteração de Dados — Aprovação necessária",
            descricao: `${a.nome} pretende alterar os seus dados. É necessária a sua aprovação.`,
            created_at: a.dados_pendentes.data_pedido as string ?? a.updated_at,
        });
    }

    // Ordenar por data (mais recente primeiro)
    results.sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return results;
}
