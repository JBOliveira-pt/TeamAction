import { sql, getOrganizationId } from "./_shared";
import { auth } from "@clerk/nextjs/server";

// ---------- JOGOS ----------

export async function fetchJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
                equipa_id: string;
                equipa_nome: string;
                hora_inicio: string | null;
                hora_fim: string | null;
            }[]
        >`
            SELECT
                jogos.id,
                jogos.adversario,
                jogos.data,
                jogos.casa_fora,
                jogos.resultado_nos,
                jogos.resultado_adv,
                jogos.estado,
                jogos.equipa_id,
                jogos.hora_inicio,
                jogos.hora_fim,
                equipas.nome AS equipa_nome
            FROM jogos
            LEFT JOIN equipas ON jogos.equipa_id = equipas.id
            WHERE jogos.organization_id = ${organizationId}
            ORDER BY jogos.data DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch jogos.");
    }
}

// ---------- CALENDÁRIO ATLETA ----------

export async function fetchJogosAtleta() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        const [atleta] = await sql<{ equipa_id: string | null }[]>`
            SELECT equipa_id FROM atletas WHERE user_id = ${user.id} LIMIT 1
        `;
        if (!atleta?.equipa_id) return [];

        return sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
                equipa_id: string;
                equipa_nome: string;
            }[]
        >`
            SELECT
                jogos.id,
                jogos.adversario,
                jogos.data,
                jogos.casa_fora,
                jogos.resultado_nos,
                jogos.resultado_adv,
                jogos.estado,
                jogos.equipa_id,
                equipas.nome AS equipa_nome
            FROM jogos
            LEFT JOIN equipas ON jogos.equipa_id = equipas.id
            WHERE jogos.equipa_id = ${atleta.equipa_id}
            ORDER BY jogos.data DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchSessoesAtleta() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        const [atleta] = await sql<{ equipa_id: string | null }[]>`
            SELECT equipa_id FROM atletas WHERE user_id = ${user.id} LIMIT 1
        `;
        if (!atleta?.equipa_id) return [];

        return sql<
            {
                id: string;
                data: string;
                tipo: string;
                duracao_min: number;
                observacoes: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                sessoes.id,
                sessoes.data,
                sessoes.tipo,
                sessoes.duracao_min,
                sessoes.observacoes,
                equipas.nome AS equipa_nome
            FROM sessoes
            LEFT JOIN equipas ON equipas.id = sessoes.equipa_id
            WHERE sessoes.equipa_id = ${atleta.equipa_id}
            ORDER BY sessoes.data DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchSessoesPresidente() {
    try {
        const organizationId = await getOrganizationId();
        return await sql<
            {
                id: string;
                data: string;
                hora: string | null;
                tipo: string;
                duracao_min: number | null;
                local: string | null;
                notas: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                s.id, s.data, s.hora, s.tipo, s.duracao_min, s.local, s.notas,
                e.nome AS equipa_nome
            FROM sessoes s
            LEFT JOIN equipas e ON e.id = s.equipa_id
            WHERE s.organization_id = ${organizationId}
            ORDER BY s.data DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

// ---------- CALENDÁRIO TREINADOR ----------

export async function fetchJogosTreinador() {
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
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
                equipa_id: string;
                equipa_nome: string;
            }[]
        >`
            SELECT
                j.id, j.adversario, j.data, j.casa_fora,
                j.resultado_nos, j.resultado_adv, j.estado,
                j.equipa_id, e.nome AS equipa_nome
            FROM jogos j
            JOIN equipas e ON e.id = j.equipa_id AND e.treinador_id = ${user.id}
            ORDER BY j.data DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchSessoesTreinador() {
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
                data: string;
                hora: string | null;
                tipo: string;
                duracao_min: number | null;
                local: string | null;
                notas: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                s.id, s.data, s.hora, s.tipo, s.duracao_min, s.local, s.notas,
                e.nome AS equipa_nome
            FROM sessoes s
            LEFT JOIN equipas e ON e.id = s.equipa_id
            WHERE s.treinador_id = ${user.id}
            ORDER BY s.data DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchUltimosJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                data: string;
                adversario: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                casa_fora: string;
            }[]
        >`
            SELECT id, data, adversario, resultado_nos, resultado_adv, casa_fora
            FROM jogos
            WHERE organization_id = ${organizationId}
              AND estado = 'realizado'
            ORDER BY data DESC
            LIMIT 4
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch Ãºltimos jogos.");
    }
}

export async function fetchProximosJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                data: string;
                adversario: string;
                casa_fora: string;
                local: string | null;
            }[]
        >`
            SELECT id, data, adversario, casa_fora, local
            FROM jogos
            WHERE organization_id = ${organizationId}
              AND estado = 'agendado'
              AND data >= CURRENT_DATE
            ORDER BY data ASC
            LIMIT 3
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch prÃ³ximos jogos.");
    }
}

// ---------- CALENDÁRIO RESPONSÁVEL ----------
// Busca jogos e sessões do menor vinculado ao responsável

async function getMinorEquipaId() {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    const [user] = await sql<{ id: string; email: string }[]>`
        SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!user) return null;

    const [atleta] = await sql<{ equipa_id: string | null }[]>`
        SELECT equipa_id FROM atletas
        WHERE encarregado_educacao = ${user.email}
          AND menor_idade = true
        LIMIT 1
    `;
    return atleta?.equipa_id ?? null;
}

export async function fetchJogosResponsavel() {
    try {
        const equipaId = await getMinorEquipaId();
        if (!equipaId) return [];

        return sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
                equipa_id: string;
                equipa_nome: string;
            }[]
        >`
            SELECT
                jogos.id,
                jogos.adversario,
                jogos.data,
                jogos.casa_fora,
                jogos.resultado_nos,
                jogos.resultado_adv,
                jogos.estado,
                jogos.equipa_id,
                equipas.nome AS equipa_nome
            FROM jogos
            LEFT JOIN equipas ON jogos.equipa_id = equipas.id
            WHERE jogos.equipa_id = ${equipaId}
            ORDER BY jogos.data DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchSessoesResponsavel() {
    try {
        const equipaId = await getMinorEquipaId();
        if (!equipaId) return [];

        return sql<
            {
                id: string;
                data: string;
                tipo: string;
                duracao_min: number;
                observacoes: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                sessoes.id,
                sessoes.data,
                sessoes.tipo,
                sessoes.duracao_min,
                sessoes.observacoes,
                equipas.nome AS equipa_nome
            FROM sessoes
            LEFT JOIN equipas ON equipas.id = sessoes.equipa_id
            WHERE sessoes.equipa_id = ${equipaId}
            ORDER BY sessoes.data DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}
