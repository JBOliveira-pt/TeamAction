import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";
import { RecibosTableRow, Recibo } from "./definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const ITEMS_PER_PAGE = 6;

async function requireOrganizationId(): Promise<string> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
    `;

    const orgId = user[0]?.organization_id;
    if (!orgId) {
        throw new Error("No organization found for user");
    }

    return orgId;
}

export type ReciboFilters = {
    query?: string;
    atletaId?: string;
    status?: "pendente_envio" | "enviado_atleta";
};

export async function fetchFilteredRecibos(
    filters: ReciboFilters,
    currentPage: number,
): Promise<RecibosTableRow[]> {
    const organizationId = await requireOrganizationId();
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const conditions = [sql`recibos.organization_id = ${organizationId}`];

    if (filters.query) {
        const term = `%${filters.query}%`;
        conditions.push(
            sql`(COALESCE(atletas.nome, '') ILIKE ${term}
                OR recibos.recibo_number::text ILIKE ${term}
                OR recibos.amount::text ILIKE ${term})`,
        );
    }

    if (filters.atletaId) {
        conditions.push(sql`recibos.atleta_id = ${filters.atletaId}`);
    }

    if (filters.status) {
        conditions.push(sql`recibos.status = ${filters.status}`);
    }

    let whereClause = sql`WHERE ${conditions[0]}`;
    for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
    }

    const data = await sql<RecibosTableRow[]>`
        SELECT
            recibos.id,
            recibos.recibo_number,
            recibos.atleta_id,
            recibos.mensalidade_id,
            recibos.amount,
            mensalidades.mes AS mensalidade_mes,
            mensalidades.ano AS mensalidade_ano,
            mensalidades.data_pagamento AS data_pagamento,
            recibos.status,
            recibos.pdf_url,
            recibos.created_by AS recibo_created_by,
            COALESCE(atletas.nome, 'Atleta removido') AS atleta_nome
        FROM recibos
        JOIN mensalidades ON recibos.mensalidade_id = mensalidades.id
        LEFT JOIN atletas ON recibos.atleta_id = atletas.id
        ${whereClause}
        ORDER BY recibos.created_at DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return data;
}

export async function fetchRecibosPages(filters: ReciboFilters) {
    const organizationId = await requireOrganizationId();

    const conditions = [sql`recibos.organization_id = ${organizationId}`];

    if (filters.query) {
        const term = `%${filters.query}%`;
        conditions.push(
            sql`(COALESCE(atletas.nome, '') ILIKE ${term}
                OR recibos.recibo_number::text ILIKE ${term}
                OR recibos.amount::text ILIKE ${term})`,
        );
    }

    if (filters.atletaId) {
        conditions.push(sql`recibos.atleta_id = ${filters.atletaId}`);
    }

    if (filters.status) {
        conditions.push(sql`recibos.status = ${filters.status}`);
    }

    let whereClause = sql`WHERE ${conditions[0]}`;
    for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
    }

    const data = await sql`
        SELECT COUNT(*)
        FROM recibos
        JOIN mensalidades ON recibos.mensalidade_id = mensalidades.id
        LEFT JOIN atletas ON recibos.atleta_id = atletas.id
        ${whereClause}
    `;

    return Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
}

export async function fetchReciboById(reciboId: string): Promise<Recibo> {
    const organizationId = await requireOrganizationId();
    const data = await sql<Recibo[]>`
        SELECT *
        FROM recibos
        WHERE id = ${reciboId} AND organization_id = ${organizationId}
    `;

    if (!data[0]) {
        throw new Error("Recibo nao encontrado");
    }

    return data[0];
}

export async function fetchReciboDetail(reciboId: string) {
    const organizationId = await requireOrganizationId();

    const data = await sql<
        {
            recibo_id: string;
            recibo_number: number;
            status: "pendente_envio" | "enviado_atleta";
            received_date: string;
            amount: number;
            pdf_url: string | null;
            recibo_created_by: string | null;
            mensalidade_id: string;
            mensalidade_mes: number;
            mensalidade_ano: number;
            data_pagamento: string | null;
            atleta_id: string;
            atleta_nome: string;
            sent_at: string | null;
            sent_by_user_name: string | null;
            issuer_iban: string;
        }[]
    >`
        SELECT
            recibos.id AS recibo_id,
            recibos.recibo_number,
            recibos.status,
            recibos.received_date,
            recibos.amount,
            recibos.pdf_url,
            recibos.sent_at,
            recibos.issuer_iban,
            recibos.created_by AS recibo_created_by,
            mensalidades.id AS mensalidade_id,
            mensalidades.mes AS mensalidade_mes,
            mensalidades.ano AS mensalidade_ano,
            mensalidades.data_pagamento,
            atletas.id AS atleta_id,
            COALESCE(atletas.nome, 'Atleta removido') AS atleta_nome,
            sent_by_user.name AS sent_by_user_name
        FROM recibos
        JOIN mensalidades ON recibos.mensalidade_id = mensalidades.id
        LEFT JOIN atletas ON recibos.atleta_id = atletas.id
        LEFT JOIN users AS sent_by_user ON recibos.sent_by_user = sent_by_user.id
        WHERE recibos.id = ${reciboId} AND recibos.organization_id = ${organizationId}
    `;

    if (!data[0]) {
        throw new Error("Recibo nao encontrado");
    }

    return data[0];
}

export async function fetchReciboAtletas() {
    const organizationId = await requireOrganizationId();
    const data = await sql<{ id: string; nome: string }[]>`
        SELECT DISTINCT atletas.id, atletas.nome
        FROM atletas
        WHERE atletas.organization_id = ${organizationId}
        ORDER BY atletas.nome ASC
    `;

    return data;
}
