// Actions de relatórios: geração de CSV de atletas e mensalidades.
"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";

export async function gerarRelatorioAtletas() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organização.");
    }
    if (!organizationId) throw new Error("Organização não encontrada.");

    const atletas = await sql<
        {
            nome: string;
            posicao: string | null;
            numero_camisola: number | null;
            equipa_nome: string | null;
            estado: string;
            federado: boolean;
            numero_federado: string | null;
            mensalidade_estado: string | null;
        }[]
    >`
        SELECT
            atletas.nome,
            atletas.posicao,
            atletas.numero_camisola,
            equipas.nome AS equipa_nome,
            atletas.estado,
            atletas.federado,
            atletas.numero_federado,
            mensalidades.estado AS mensalidade_estado
        FROM atletas
        LEFT JOIN equipas ON atletas.equipa_id = equipas.id
        LEFT JOIN mensalidades ON mensalidades.atleta_id = atletas.id
            AND mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
            AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
        WHERE atletas.organization_id = ${organizationId}
        ORDER BY atletas.nome ASC
    `;

    // Gerar CSV
    const headers = [
        "Nome",
        "Posição",
        "Nº",
        "Equipa",
        "Estado",
        "Federado",
        "Nº Federado",
        "Mensalidade",
    ];
    const rows = atletas.map((a) => [
        a.nome,
        a.posicao ?? "Não tem",
        a.numero_camisola != null ? `#${a.numero_camisola}` : "Não tem",
        a.equipa_nome ?? "Não tem",
        a.estado,
        a.federado ? "Sim" : "Não",
        a.numero_federado ?? "Não tem",
        a.mensalidade_estado ?? "Não tem",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}

export async function gerarRelatorioMensalidades() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organização.");
    }
    if (!organizationId) throw new Error("Organização não encontrada.");

    const mensalidades = await sql<
        {
            atleta_nome: string;
            equipa_nome: string | null;
            mes: number;
            ano: number;
            valor: number | null;
            estado: string;
            data_pago: string | null;
        }[]
    >`
    SELECT
        atletas.nome AS atleta_nome,
        equipas.nome AS equipa_nome,
        mensalidades.mes,
        mensalidades.ano,
        mensalidades.valor,
        mensalidades.estado,
        mensalidades.data_pagamento AS data_pago
    FROM mensalidades
    INNER JOIN atletas ON mensalidades.atleta_id = atletas.id
    LEFT JOIN equipas ON atletas.equipa_id = equipas.id
    WHERE mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
      AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
      AND mensalidades.organization_id = ${organizationId}
    ORDER BY mensalidades.estado DESC, atletas.nome ASC
`;

    const mesesNomes: Record<number, string> = {
        1: "Jan",
        2: "Fev",
        3: "Mar",
        4: "Abr",
        5: "Mai",
        6: "Jun",
        7: "Jul",
        8: "Ago",
        9: "Set",
        10: "Out",
        11: "Nov",
        12: "Dez",
    };

    const headers = [
        "Atleta",
        "Equipa",
        "Mês",
        "Ano",
        "Valor",
        "Estado",
        "Data Pagamento",
    ];
    const rows = mensalidades.map((m) => [
        m.atleta_nome,
        m.equipa_nome ?? "Não tem",
        mesesNomes[m.mes] ?? m.mes,
        m.ano,
        m.valor != null ? `â‚¬${Number(m.valor).toFixed(2)}` : "Não tem",
        m.estado,
        m.data_pago ? new Date(m.data_pago).toLocaleDateString("pt-PT") : "Não tem",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}

export async function gerarRelatorioAssiduidade() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organização.");
    }
    if (!organizationId) throw new Error("Organização não encontrada.");

    const assiduidade = await sql<
        {
            atleta_nome: string;
            equipa_nome: string | null;
            total_treinos: number;
            presencas: number;
        }[]
    >`
        SELECT
            atletas.nome AS atleta_nome,
            equipas.nome AS equipa_nome,
            COUNT(assiduidade.id) AS total_treinos,
            COUNT(CASE WHEN assiduidade.presente THEN 1 END) AS presencas
        FROM atletas
        LEFT JOIN equipas ON atletas.equipa_id = equipas.id
        LEFT JOIN assiduidade ON assiduidade.atleta_id = atletas.id
        WHERE atletas.organization_id = ${organizationId}
        GROUP BY atletas.id, atletas.nome, equipas.nome
        ORDER BY atletas.nome ASC
    `;

    const headers = [
        "Atleta",
        "Equipa",
        "Total Treinos",
        "Presenças",
        "Taxa Assiduidade",
    ];
    const rows = assiduidade.map((a) => {
        const total = Number(a.total_treinos);
        const presencas = Number(a.presencas);
        const taxa = total > 0 ? Math.round((presencas / total) * 100) : 0;
        return [
            a.atleta_nome,
            a.equipa_nome ?? "Não tem",
            total,
            presencas,
            `${taxa}%`,
        ];
    });

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}

export async function gerarRelatorioStaff() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organização.");
    }
    if (!organizationId) throw new Error("Organização não encontrada.");

    const staff = await sql<
        {
            nome: string;
            funcao: string;
            equipa_nome: string | null;
            email: string | null;
            telefone: string | null;
        }[]
    >`
        SELECT
            staff.nome,
            staff.funcao,
            equipas.nome AS equipa_nome,
            users.email,
            users.telefone
        FROM staff
        LEFT JOIN equipas ON staff.equipa_id = equipas.id
        LEFT JOIN users ON staff.user_id = users.id
        WHERE staff.organization_id = ${organizationId}
        ORDER BY staff.funcao, staff.nome ASC
    `;

    const headers = ["Nome", "Função", "Equipa", "Email", "Telefone"];
    const rows = staff.map((s) => [
        s.nome,
        s.funcao,
        s.equipa_nome ?? "Não tem",
        s.email ?? "Não tem",
        s.telefone ?? "Não tem",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}
