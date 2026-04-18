// Queries de dados do atleta: notas, registos médicos e autorizações.
import { sql, getOrganizationId } from "./_shared";
import { auth } from "@clerk/nextjs/server";

export async function fetchNotasAtleta(): Promise<
    {
        id: string;
        titulo: string;
        conteudo: string;
        created_at: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            {
                id: string;
                titulo: string;
                conteudo: string;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, conteudo, created_at
            FROM notas_atleta
            WHERE user_id = ${user.id}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchRegistosMedicos(): Promise<
    {
        id: string;
        tipo: string;
        descricao: string;
        gravidade: string;
        data_inicio: string;
        data_prevista_retorno: string | null;
        observacoes: string | null;
        estado: string;
        created_at: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string; email: string }[]>`
            SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            {
                id: string;
                tipo: string;
                descricao: string;
                gravidade: string;
                data_inicio: string;
                data_prevista_retorno: string | null;
                observacoes: string | null;
                estado: string;
                created_at: string;
            }[]
        >`
            SELECT id, tipo, descricao, gravidade, data_inicio::text, data_prevista_retorno::text, observacoes, estado, created_at::text
            FROM medico
            WHERE email = ${user.email}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchCondicaoFisica(): Promise<
    {
        id: string;
        altura: number;
        peso: number;
        data_registo: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            { id: string; altura: number; peso: number; data_registo: string }[]
        >`
            SELECT id, altura::float AS altura, peso::float AS peso, data_registo::text
            FROM condicao_fisica
            WHERE user_id = ${user.id}
              AND data_registo <= CURRENT_DATE

            UNION ALL

            SELECT
                id,
                altura_cm::float AS altura,
                peso_kg::float  AS peso,
                created_at::date::text AS data_registo
            FROM atletas
            WHERE user_id = ${user.id}
              AND altura_cm IS NOT NULL
              AND peso_kg  IS NOT NULL

            ORDER BY data_registo ASC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

// ---------- AUTORIZAÇÕES DO ATLETA (adulto) ----------

export type AutorizacaoAtleta = {
    id: string;
    tipo: "convite_equipa" | "convite_clube" | "convite_treinador";
    titulo: string;
    descricao: string;
    created_at: string;
};

export async function fetchAutorizacoesAtleta(): Promise<AutorizacaoAtleta[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return [];

    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!user) return [];

    // Obter o atleta_id (tabela atletas) do utilizador
    const [atleta] = await sql<{ id: string; nome: string }[]>`
        SELECT id, nome FROM atletas WHERE user_id = ${user.id} LIMIT 1
    `;

    const results: AutorizacaoAtleta[] = [];

    // 1. Convites de equipa pendentes (treinador → atleta)
    if (atleta) {
        const convitesEquipa = await sql<
            {
                id: string;
                equipa_nome: string | null;
                treinador_nome: string;
                created_at: string;
            }[]
        >`
            SELECT id, equipa_nome, treinador_nome, created_at::text
            FROM convites_equipa
            WHERE atleta_id = ${atleta.id}
              AND estado = 'pendente'
            ORDER BY created_at DESC
        `.catch(() => []);

        for (const c of convitesEquipa) {
            results.push({
                id: c.id,
                tipo: "convite_equipa",
                titulo: `Associação a Equipa${c.equipa_nome ? ` "${c.equipa_nome}"` : ""}`,
                descricao: `O treinador "${c.treinador_nome}" pretende adicionar-te à equipa.`,
                created_at: c.created_at,
            });
        }
    }

    // 2. Convites de clube pendentes (presidente → atleta)
    const convitesClubeRows = await sql<
        {
            id: string;
            alvo_nome: string;
            created_at: string;
        }[]
    >`
        SELECT id, alvo_nome, created_at::text
        FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${user.id}
          AND relation_kind = 'clube'
          AND status = 'pendente'
        ORDER BY created_at DESC
    `.catch(() => []);

    for (const c of convitesClubeRows) {
        results.push({
            id: c.id,
            tipo: "convite_clube",
            titulo: `Federação ao Clube "${c.alvo_nome}"`,
            descricao: `O clube "${c.alvo_nome}" convidou-te para te juntares.`,
            created_at: c.created_at,
        });
    }

    // 3. Convites de treinador pendentes (atleta indicou treinador no registo)
    const convitesTreinadorRows = await sql<
        {
            id: string;
            alvo_nome: string;
            created_at: string;
        }[]
    >`
        SELECT id, alvo_nome, created_at::text
        FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${user.id}
          AND relation_kind = 'treinador'
          AND status = 'pendente'
        ORDER BY created_at DESC
    `.catch(() => []);

    for (const c of convitesTreinadorRows) {
        results.push({
            id: c.id,
            tipo: "convite_treinador",
            titulo: `Vinculação ao Treinador "${c.alvo_nome}"`,
            descricao: `Pedido de vinculação ao treinador "${c.alvo_nome}" pendente de aprovação.`,
            created_at: c.created_at,
        });
    }

    results.sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return results;
}

export async function fetchAtletaFederado(): Promise<boolean> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return false;

    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!user) return false;

    const rows = await sql<{ federado: boolean }[]>`
        SELECT EXISTS(
            SELECT 1
            FROM atletas a
            INNER JOIN users pres
                ON pres.organization_id = a.organization_id
               AND pres.account_type = 'presidente'
            WHERE a.user_id = ${user.id}
        ) AS federado
    `;
    return rows[0]?.federado === true;
}

export async function fetchMensalidadesAtleta(): Promise<
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
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        const [atleta] = await sql<{ id: string }[]>`
            SELECT id FROM atletas WHERE user_id = ${user.id} LIMIT 1
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
