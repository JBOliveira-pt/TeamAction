import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";
import { ReceiptsTableRow, Receipt } from "./definitions";

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

export type ReceiptFilters = {
    query?: string;
    customerId?: string;
    status?: "pending_send" | "sent_to_customer";
    dateFrom?: string;
    dateTo?: string;
};

export async function fetchFilteredReceipts(
    filters: ReceiptFilters,
    currentPage: number,
): Promise<ReceiptsTableRow[]> {
    const organizationId = await requireOrganizationId();
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const conditions = [sql`receipts.organization_id = ${organizationId}`];

    if (filters.query) {
        const term = `%${filters.query}%`;
        conditions.push(
            sql`(COALESCE(customers.name, '') ILIKE ${term}
                OR COALESCE(customers.email, '') ILIKE ${term}
                OR receipts.receipt_number::text ILIKE ${term}
                OR receipts.amount::text ILIKE ${term}
                OR invoices.id::text ILIKE ${term}
                OR invoices.payment_date::text ILIKE ${term})`,
        );
    }

    if (filters.customerId) {
        conditions.push(sql`receipts.customer_id = ${filters.customerId}`);
    }

    if (filters.status) {
        conditions.push(sql`receipts.status = ${filters.status}`);
    }

    if (filters.dateFrom) {
        conditions.push(sql`DATE(invoices.date) = ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
        conditions.push(sql`DATE(invoices.payment_date) = ${filters.dateTo}`);
    }

    let whereClause = sql``;
    if (conditions.length > 0) {
        whereClause = sql`WHERE ${conditions[0]}`;
        for (let i = 1; i < conditions.length; i++) {
            whereClause = sql`${whereClause} AND ${conditions[i]}`;
        }
    }

    const data = await sql<ReceiptsTableRow[]>`
        SELECT
            receipts.id,
            receipts.receipt_number,
            receipts.customer_id,
            receipts.invoice_id,
            receipts.amount,
            receipts.received_date,
            invoices.date AS invoice_date,
            invoices.payment_date AS payment_date,
            receipts.status,
            receipts.pdf_url,
            receipts.created_by AS receipt_created_by,
            COALESCE(customers.name, 'Cliente removido') AS customer_name,
            COALESCE(customers.email, '') AS customer_email
        FROM receipts
        JOIN invoices ON receipts.invoice_id = invoices.id
        LEFT JOIN customers ON receipts.customer_id = customers.id
        ${whereClause}
        ORDER BY invoices.payment_date DESC NULLS LAST, invoices.date DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return data;
}

export async function fetchReceiptsPages(filters: ReceiptFilters) {
    const organizationId = await requireOrganizationId();

    const conditions = [sql`receipts.organization_id = ${organizationId}`];

    if (filters.query) {
        const term = `%${filters.query}%`;
        conditions.push(
            sql`(COALESCE(customers.name, '') ILIKE ${term}
                OR COALESCE(customers.email, '') ILIKE ${term}
                OR receipts.receipt_number::text ILIKE ${term}
                OR receipts.amount::text ILIKE ${term}
                OR invoices.id::text ILIKE ${term}
                OR invoices.payment_date::text ILIKE ${term})`,
        );
    }

    if (filters.customerId) {
        conditions.push(sql`receipts.customer_id = ${filters.customerId}`);
    }

    if (filters.status) {
        conditions.push(sql`receipts.status = ${filters.status}`);
    }

    if (filters.dateFrom) {
        conditions.push(sql`DATE(invoices.date) = ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
        conditions.push(sql`DATE(invoices.payment_date) = ${filters.dateTo}`);
    }

    let whereClause = sql``;
    if (conditions.length > 0) {
        whereClause = sql`WHERE ${conditions[0]}`;
        for (let i = 1; i < conditions.length; i++) {
            whereClause = sql`${whereClause} AND ${conditions[i]}`;
        }
    }

    const data = await sql`
        SELECT COUNT(*)
        FROM receipts
        JOIN invoices ON receipts.invoice_id = invoices.id
        LEFT JOIN customers ON receipts.customer_id = customers.id
        ${whereClause}
    `;

    return Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
}

export async function fetchReceiptById(receiptId: string): Promise<Receipt> {
    const organizationId = await requireOrganizationId();
    const data = await sql<Receipt[]>`
        SELECT *
        FROM receipts
        WHERE id = ${receiptId} AND organization_id = ${organizationId}
    `;

    if (!data[0]) {
        throw new Error("Receipt not found");
    }

    return data[0];
}

export async function fetchReceiptDetail(receiptId: string) {
    const organizationId = await requireOrganizationId();
    const data = await sql<
        {
            receipt_id: string;
            receipt_number: number;
            status: "pending_send" | "sent_to_customer";
            received_date: string;
            amount: number;
            activity_code: string | null;
            tax_regime: string;
            irs_withholding: string;
            pdf_url: string | null;
            invoice_id: string;
            invoice_date: string;
            invoice_payment_date: string | null;
            invoice_created_by: string | null;
            receipt_created_by: string | null;
            customer_id: string;
            customer_name: string;
            customer_nif: string | null;
            customer_address: string | null;
            sent_at: string | null;
            sent_by_user_name: string | null;
        }[]
    >`
        SELECT
            receipts.id AS receipt_id,
            receipts.receipt_number,
            receipts.status,
            receipts.received_date,
            receipts.amount,
            receipts.activity_code,
            receipts.tax_regime,
            receipts.irs_withholding,
            receipts.pdf_url,
            receipts.sent_at,
            receipts.created_by AS receipt_created_by,
            invoices.id AS invoice_id,
            invoices.date AS invoice_date,
            invoices.payment_date AS invoice_payment_date,
            invoices.created_by AS invoice_created_by,
            customers.id AS customer_id,
            customers.name AS customer_name,
            customers.nif AS customer_nif,
            customers.endereco_fiscal AS customer_address,
            sent_by_user.name AS sent_by_user_name
        FROM receipts
        JOIN invoices ON receipts.invoice_id = invoices.id
        JOIN customers ON receipts.customer_id = customers.id
        LEFT JOIN users AS sent_by_user ON receipts.sent_by_user = sent_by_user.id
        WHERE receipts.id = ${receiptId} AND receipts.organization_id = ${organizationId}
    `;

    if (!data[0]) {
        throw new Error("Receipt not found");
    }

    return data[0];
}

export async function fetchReceiptCustomers() {
    const organizationId = await requireOrganizationId();
    const data = await sql<{ id: string; name: string }[]>`
        SELECT id, name
        FROM customers
        WHERE organization_id = ${organizationId}
        ORDER BY name ASC
    `;

    return data;
}

export async function fetchReceiptInvoiceDates() {
    const organizationId = await requireOrganizationId();
    const data = await sql<{ date: string }[]>`
        SELECT DISTINCT invoices.date
        FROM receipts
        JOIN invoices ON receipts.invoice_id = invoices.id
        WHERE receipts.organization_id = ${organizationId}
        ORDER BY invoices.date DESC
    `;

    return data.map((row) => row.date);
}

export async function fetchReceiptPaymentDates() {
    const organizationId = await requireOrganizationId();
    const data = await sql<{ payment_date: string }[]>`
        SELECT DISTINCT invoices.payment_date
        FROM receipts
        JOIN invoices ON receipts.invoice_id = invoices.id
        WHERE receipts.organization_id = ${organizationId} AND invoices.payment_date IS NOT NULL
        ORDER BY invoices.payment_date DESC
    `;

    return data.map((row) => row.payment_date);
}

export async function fetchReceiptAmountRange(): Promise<{
    minAmount: number;
    maxAmount: number;
}> {
    const organizationId = await requireOrganizationId();
    const data = await sql<
        { min_amount: number | null; max_amount: number | null }[]
    >`
        SELECT
            MIN(receipts.amount) AS min_amount,
            MAX(receipts.amount) AS max_amount
        FROM receipts
        WHERE receipts.organization_id = ${organizationId}
    `;

    const minAmount = data[0]?.min_amount ? Math.floor(data[0].min_amount) : 0;
    const maxAmount = data[0]?.max_amount
        ? Math.ceil(data[0].max_amount)
        : 1000;

    return {
        minAmount,
        maxAmount,
    };
}
