import { auth } from "@clerk/nextjs/server";
import { sql } from "./_shared";

/**
 * Helper: retorna o user_id e email do menor vinculado ao responsável autenticado.
 */
async function getMinorInfo(): Promise<{
    guardianEmail: string;
    minorUserId: string;
    minorEmail: string;
} | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    const [guardian] = await sql<{ email: string }[]>`
        SELECT email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!guardian) return null;

    const [minor] = await sql<{ user_id: string; email: string }[]>`
        SELECT a.user_id, u.email
        FROM atletas a
        INNER JOIN users u ON u.id = a.user_id
        WHERE a.encarregado_educacao = ${guardian.email}
          AND a.menor_idade = true
        LIMIT 1
    `;
    if (!minor) return null;

    return {
        guardianEmail: guardian.email,
        minorUserId: minor.user_id,
        minorEmail: minor.email,
    };
}

export type AprovacaoPendente = {
    id: string;
    tipo:
        | "convite_equipa"
        | "convite_clube"
        | "pedido_plano"
        | "alteracao_dados";
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
            created_at:
                (a.dados_pendentes.data_pedido as string) ?? a.updated_at,
        });
    }

    // Ordenar por data (mais recente primeiro)
    results.sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return results;
}

export type DadosEducando = {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    telefone: string | null;
    morada: string | null;
    cidade: string | null;
    codigoPostal: string | null;
    pais: string | null;
    nif: string | null;
    dataNascimento: string | null;
    planoAtual: string;
    pedidoPlanoPendente: boolean;
};

/**
 * Retorna os dados cadastrais do menor vinculado ao responsável,
 * para a página de gestão de dados do educando.
 */
export async function fetchDadosEducando(): Promise<DadosEducando | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    const [guardian] = await sql<{ email: string }[]>`
        SELECT email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!guardian) return null;

    const [minor] = await sql<
        {
            id: string;
            name: string;
            email: string;
            telefone: string | null;
            morada: string | null;
            cidade: string | null;
            codigo_postal: string | null;
            pais: string | null;
            nif: string | null;
            data_nascimento: string | null;
        }[]
    >`
        SELECT u.id, u.name, u.email, u.telefone, u.morada, u.cidade,
               u.codigo_postal, u.pais, u.nif, u.data_nascimento::text
        FROM users u
        INNER JOIN atletas a ON a.user_id = u.id
        WHERE a.menor_idade = true
          AND a.encarregado_educacao = ${guardian.email}
        LIMIT 1
    `;
    if (!minor) return null;

    // Plano actual
    const [org] = await sql<{ plano: string | null }[]>`
        SELECT o.plano
        FROM organizations o
        INNER JOIN users u ON u.organization_id = o.id
        WHERE u.id = ${minor.id}
        LIMIT 1
    `.catch(() => []);

    // Pedido pendente?
    const pendente = await sql<{ id: string }[]>`
        SELECT id FROM pedidos_plano
        WHERE user_id = ${minor.id} AND status IN ('pendente', 'pendente_responsavel')
        LIMIT 1
    `.catch(() => []);

    const nameParts = (minor.name ?? "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
        userId: minor.id,
        firstName,
        lastName,
        email: minor.email,
        telefone: minor.telefone,
        morada: minor.morada,
        cidade: minor.cidade,
        codigoPostal: minor.codigo_postal,
        pais: minor.pais,
        nif: minor.nif,
        dataNascimento: minor.data_nascimento,
        planoAtual: org?.plano ?? "rookie",
        pedidoPlanoPendente: pendente.length > 0,
    };
}

// ---------- CONDIÇÃO FÍSICA DO MENOR ----------

export async function fetchCondicaoFisicaResponsavel(): Promise<
    { id: string; altura: number; peso: number; data_registo: string }[]
> {
    try {
        const info = await getMinorInfo();
        if (!info) return [];

        return await sql<
            { id: string; altura: number; peso: number; data_registo: string }[]
        >`
            SELECT id, altura::float AS altura, peso::float AS peso, data_registo::text
            FROM condicao_fisica
            WHERE user_id = ${info.minorUserId}
            ORDER BY data_registo ASC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

// ---------- REGISTOS MÉDICOS DO MENOR ----------

export async function fetchRegistosMedicosResponsavel(): Promise<
    {
        id: string;
        tipo: string;
        descricao: string;
        data_inicio: string;
        data_prevista_retorno: string | null;
        observacoes: string | null;
        estado: string;
        created_at: string;
    }[]
> {
    try {
        const info = await getMinorInfo();
        if (!info) return [];

        return await sql<
            {
                id: string;
                tipo: string;
                descricao: string;
                data_inicio: string;
                data_prevista_retorno: string | null;
                observacoes: string | null;
                estado: string;
                created_at: string;
            }[]
        >`
            SELECT id, tipo, descricao, data_inicio::text, data_prevista_retorno::text,
                   observacoes, estado, created_at::text
            FROM medico
            WHERE email = ${info.minorEmail}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

// ---------- MENSALIDADES DO MENOR ----------

export async function fetchMensalidadesResponsavel(): Promise<
    {
        id: string;
        mes: number;
        ano: number;
        valor: number;
        estado: string;
        data_pagamento: string | null;
    }[]
> {
    try {
        const info = await getMinorInfo();
        if (!info) return [];

        const [atleta] = await sql<{ id: string }[]>`
            SELECT id FROM atletas WHERE user_id = ${info.minorUserId} LIMIT 1
        `;
        if (!atleta) return [];

        return await sql<
            {
                id: string;
                mes: number;
                ano: number;
                valor: number;
                estado: string;
                data_pagamento: string | null;
            }[]
        >`
            SELECT id, mes, ano, valor::float AS valor, estado,
                   data_pagamento::text
            FROM mensalidades
            WHERE atleta_id = ${atleta.id}
            ORDER BY ano DESC, mes DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

// ---------- COMUNICADOS DO CLUBE ----------

export async function fetchComunicadosResponsavel(): Promise<
    {
        id: string;
        titulo: string;
        conteudo: string;
        destinatarios: string | null;
        created_at: string;
    }[]
> {
    try {
        const info = await getMinorInfo();
        if (!info) return [];

        // O menor pertence a uma organização; buscar comunicados dessa org
        const [org] = await sql<{ organization_id: string | null }[]>`
            SELECT organization_id FROM users WHERE id = ${info.minorUserId} LIMIT 1
        `;
        if (!org?.organization_id) return [];

        return await sql<
            {
                id: string;
                titulo: string;
                conteudo: string;
                destinatarios: string | null;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, conteudo, destinatarios, created_at::text
            FROM comunicados
            WHERE organization_id = ${org.organization_id}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}
