import postgres, { type Sql } from "postgres";
import {
    Customer,
    CustomerField,
    CustomersTableType,
    FormattedCustomersTable,
    InvoiceForm,
    InvoicesTable,
    LatestInvoiceRaw,
    Revenue,
    User,
} from "./definitions";
import { formatCurrency, formatCurrencyPTBR, formatDateToLocal } from "./utils";
import { auth, clerkClient } from "@clerk/nextjs/server";

const isDev = process.env.NODE_ENV !== "production";
type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

function normalizeAccountType(value: unknown): AccountType | null {
    if (typeof value !== "string") return null;

    const normalized = value.toLowerCase();
    if (
        normalized === "presidente" ||
        normalized === "treinador" ||
        normalized === "atleta" ||
        normalized === "responsavel"
    ) {
        return normalized;
    }

    return null;
}

export async function fetchUsers() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<User[]>`
            SELECT 
                id,
                name,
                email,
                image_url,
                role
            FROM users
            WHERE organization_id = ${organizationId}
            ORDER BY name ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch users.");
    }
}

export async function fetchFilteredUsers(query: string) {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<User[]>`
            SELECT 
                id,
                name,
                email,
                image_url,
                role
            FROM users
            WHERE
                organization_id = ${organizationId}
                AND (
                    name ILIKE ${`%${query}%`} OR
                    email ILIKE ${`%${query}%`} OR
                    role ILIKE ${`%${query}%`}
                )
            ORDER BY name ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch users.");
    }
}

// Helper para pegar organization_id da sessão
export async function getOrganizationId(): Promise<string> {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not authenticated");
    }

    // Fetch organization_id from database using clerk_user_id.
    // If not found (e.g. user recreated in Clerk), fallback by email and repair clerk_user_id.
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        const foundByClerkId = user.length > 0;
        let orgId = user[0]?.organization_id;

        if (!orgId) {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(userId);
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            const fullName =
                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
                email ||
                `user_${userId}`;
            const accountType = normalizeAccountType(
                clerkUser.unsafeMetadata?.accountType ??
                    clerkUser.publicMetadata?.accountType,
            );
            const role = accountType === "presidente" ? "admin" : "user";

            if (email) {
                const fallbackUser = await sql<
                    { id: string; organization_id: string }[]
                >`SELECT id, organization_id FROM users WHERE email = ${email} LIMIT 1`;

                if (fallbackUser[0]?.organization_id) {
                    await sql`
                        UPDATE users
                        SET clerk_user_id = ${userId}
                        WHERE id = ${fallbackUser[0].id}
                    `;

                    orgId = fallbackUser[0].organization_id;
                    if (isDev) {
                        console.log(
                            `[AUTH] Re-linked user by email (${email}) to clerk_user_id ${userId}`,
                        );
                    }
                }

                if (!orgId) {
                    const created = await sql.begin(async (tx) => {
                        const txSql = tx as unknown as Sql;

                        const existingByClerkId = await txSql<
                            { id: string; organization_id: string }[]
                        >`
                            SELECT id, organization_id
                            FROM users
                            WHERE clerk_user_id = ${userId}
                            LIMIT 1
                        `;

                        if (existingByClerkId[0]?.organization_id) {
                            return existingByClerkId[0].organization_id;
                        }

                        const existingByEmail = await txSql<
                            { id: string; organization_id: string }[]
                        >`
                            SELECT id, organization_id
                            FROM users
                            WHERE email = ${email}
                            LIMIT 1
                        `;

                        if (existingByEmail[0]?.organization_id) {
                            await txSql`
                                UPDATE users
                                SET clerk_user_id = ${userId}, role = ${role}, updated_at = NOW()
                                WHERE id = ${existingByEmail[0].id}
                            `;
                            return existingByEmail[0].organization_id;
                        }

                        const orgSlug = `${fullName
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
                        const orgName = `${fullName}'s Organization`;

                        const newOrg = await txSql<{ id: string }[]>`
                            INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
                            VALUES (${orgName}, ${orgSlug}, ${userId}, NOW(), NOW())
                            RETURNING id
                        `;

                        await txSql`
                            INSERT INTO users (id, name, email, clerk_user_id, role, organization_id, image_url, created_at, updated_at)
                            VALUES (gen_random_uuid(), ${fullName}, ${email}, ${userId}, ${role}, ${newOrg[0].id}, ${clerkUser.imageUrl || null}, NOW(), NOW())
                        `;

                        return newOrg[0].id;
                    });

                    orgId = created;

                    if (isDev) {
                        console.log(
                            `[AUTH] Auto-provisioned organization (${orgId}) for ${email}`,
                        );
                    }
                }
            }
        }

        // Keep request logs quiet; only explicit re-link events are logged.

        if (!orgId) {
            if (isDev) {
                console.error(
                    `[AUTH] No orgId found. Direct match user:`,
                    user[0],
                );
            }
            throw new Error("No organization found for user");
        }

        return orgId;
    } catch (error) {
        console.error("Failed to fetch organization:", error);
        throw new Error("Failed to fetch user organization");
    }
}

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const DEFAULT_AVATAR = "https://avatar.vercel.sh/placeholder.png";

export async function fetchRevenue() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<Revenue[]>`
            SELECT
                TO_CHAR(DATE_TRUNC('month', payment_date), 'Mon') AS month,
                COALESCE(SUM(amount), 0)::int AS revenue
            FROM invoices
            WHERE organization_id = ${organizationId}
                AND status = 'paid'
                AND payment_date IS NOT NULL
            GROUP BY DATE_TRUNC('month', payment_date)
            ORDER BY DATE_TRUNC('month', payment_date) DESC
            LIMIT 12`;

        const orderedData = data.slice().reverse();

        return orderedData;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch revenue data.");
    }
}

export async function fetchPendingRevenue() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<Revenue[]>`
            SELECT
                TO_CHAR(DATE_TRUNC('month', date), 'Mon') AS month,
                COALESCE(SUM(amount), 0)::int AS revenue
            FROM invoices
            WHERE organization_id = ${organizationId}
                AND status = 'pending'
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY DATE_TRUNC('month', date) DESC
            LIMIT 12`;

        const orderedData = data.slice().reverse();

        return orderedData;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch pending revenue data.");
    }
}

export async function fetchLatestInvoices() {
    try {
        const organizationId = await getOrganizationId();

        const data = (await sql.unsafe(
            `
            SELECT 
                invoices.amount, 
                invoices.date,
                invoices.payment_date,
                invoices.status,
                customers.name, 
                customers.id as customer_id, 
                customers.email, 
                customers.image_url,
                invoices.id
            FROM invoices
            JOIN customers ON invoices.customer_id = customers.id
            WHERE invoices.organization_id = $1
            ORDER BY invoices.date DESC
            LIMIT 6`,
            [organizationId],
        )) as (Omit<LatestInvoiceRaw, "image_url"> & {
            customer_id: string;
            image_url: string | null;
            status: "pending" | "paid";
        })[];

        const latestInvoices = data.map((invoice) => ({
            ...invoice,
            image_url: invoice.image_url || DEFAULT_AVATAR,
            date: formatDateToLocal(invoice.date),
            payment_date: invoice.payment_date
                ? formatDateToLocal(invoice.payment_date)
                : null,
            amount: invoice.amount,
        }));
        return latestInvoices;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch the latest invoices.");
    }
}

export async function fetchCardData() {
    try {
        const organizationId = await getOrganizationId();
        const invoiceCountPromise = sql.unsafe(
            `SELECT COUNT(*) FROM invoices WHERE organization_id = $1`,
            [organizationId],
        );
        const customerCountPromise = sql.unsafe(
            `SELECT COUNT(*) FROM customers WHERE organization_id = $1`,
            [organizationId],
        );
        const receiptCountPromise = sql.unsafe(
            `SELECT COUNT(*) FROM receipts WHERE organization_id = $1`,
            [organizationId],
        );
        const invoiceStatusPromise = sql.unsafe(
            `SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices
         WHERE organization_id = $1`,
            [organizationId],
        );
        const pendingCountPromise = sql.unsafe(
            `SELECT COUNT(*) FROM invoices WHERE organization_id = $1 AND status = 'pending'`,
            [organizationId],
        );

        const paidCurrentPromise = sql.unsafe(
            `SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_current FROM invoices WHERE organization_id = $1 AND date >= date_trunc('month', current_date)`,
            [organizationId],
        );
        const paidPrevPromise = sql.unsafe(
            `SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_prev FROM invoices WHERE organization_id = $1 AND date >= date_trunc('month', current_date - interval '1 month') AND date < date_trunc('month', current_date)`,
            [organizationId],
        );
        const customersCurrentPromise = sql.unsafe(
            `SELECT COUNT(*) AS count FROM customers WHERE organization_id = $1 AND created_at >= date_trunc('month', current_date)`,
            [organizationId],
        );
        const customersPrevPromise = sql.unsafe(
            `SELECT COUNT(*) AS count FROM customers WHERE organization_id = $1 AND created_at >= date_trunc('month', current_date - interval '1 month') AND created_at < date_trunc('month', current_date)`,
            [organizationId],
        );

        const data = await Promise.all([
            invoiceCountPromise,
            customerCountPromise,
            receiptCountPromise,
            invoiceStatusPromise,
            pendingCountPromise,
            paidCurrentPromise,
            paidPrevPromise,
            customersCurrentPromise,
            customersPrevPromise,
        ]);

        const numberOfInvoices = Number(data[0][0].count ?? "0");
        const numberOfCustomers = Number(data[1][0].count ?? "0");
        const numberOfReceipts = Number(data[2][0].count ?? "0");
        const totalPaidInvoices = formatCurrency(data[3][0].paid ?? "0");
        const totalPendingInvoices = formatCurrency(data[3][0].pending ?? "0");
        const numberOfPendingInvoices = Number(data[4][0].count ?? "0");

        const calcPercent = (currentRaw: any, prevRaw: any) => {
            const current = Number(currentRaw ?? 0);
            const prev = Number(prevRaw ?? 0);
            if (prev === 0) return current === 0 ? 0 : 100;
            return ((current - prev) / prev) * 100;
        };

        const paidCurrent = Number(data[5][0].paid_current ?? 0);
        const paidPrev = Number(data[6][0].paid_prev ?? 0);
        const percentPaidChange = calcPercent(paidCurrent, paidPrev);

        const customersCurrent = Number(data[7][0].count ?? 0);
        const customersPrev = Number(data[8][0].count ?? 0);
        const percentCustomersChange = calcPercent(
            customersCurrent,
            customersPrev,
        );
        const customersChange = customersCurrent - customersPrev;

        return {
            numberOfCustomers,
            numberOfInvoices,
            numberOfReceipts,
            totalPaidInvoices,
            totalPendingInvoices,
            numberOfPendingInvoices,
            percentPaidChange,
            percentCustomersChange,
            customersChange,
        };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch card data.");
    }
}

const ITEMS_PER_PAGE = 6;

export type InvoiceFilters = {
    query?: string;
    customerId?: string;
    status?: "pending" | "paid";
    dateFrom?: string;
    dateTo?: string;
};

export async function fetchFilteredInvoices(
    filters: InvoiceFilters,
    currentPage: number,
) {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const organizationId = await getOrganizationId();

    try {
        const conditions = [sql`invoices.organization_id = ${organizationId}`];

        if (filters.query) {
            const term = `%${filters.query}%`;
            conditions.push(
                sql`(COALESCE(customers.name, '') ILIKE ${term}
                    OR COALESCE(customers.email, '') ILIKE ${term}
                    OR invoices.amount::text ILIKE ${term}
                    OR invoices.date::text ILIKE ${term}
                    OR invoices.status ILIKE ${term})`,
            );
        }

        if (filters.customerId) {
            conditions.push(sql`invoices.customer_id = ${filters.customerId}`);
        }

        if (filters.status) {
            conditions.push(sql`invoices.status = ${filters.status}`);
        }

        if (filters.dateFrom) {
            conditions.push(sql`DATE(invoices.date) = ${filters.dateFrom}`);
        }

        if (filters.dateTo) {
            conditions.push(
                sql`DATE(invoices.payment_date) = ${filters.dateTo}`,
            );
        }

        let whereClause = sql``;
        if (conditions.length > 0) {
            whereClause = sql`WHERE ${conditions[0]}`;
            for (let i = 1; i < conditions.length; i++) {
                whereClause = sql`${whereClause} AND ${conditions[i]}`;
            }
        }

        const invoices = await sql<
            (Omit<InvoicesTable, "image_url"> & {
                customer_id: string;
                image_url: string | null;
                created_by: string | null;
            })[]
        >`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.payment_date,
        invoices.status,
        COALESCE(customers.name, 'Cliente removido') AS name,
        COALESCE(customers.email, '') AS email,
        customers.image_url,
        invoices.customer_id,
        invoices.created_by
      FROM invoices
      LEFT JOIN customers ON invoices.customer_id = customers.id
      ${whereClause}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

        // Map to add fallback for missing images
        const invoicesWithImage = invoices.map((invoice) => ({
            ...invoice,
            image_url: invoice.image_url || DEFAULT_AVATAR,
        }));

        return invoicesWithImage;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch invoices.");
    }
}

export async function fetchInvoicesPages(filters: InvoiceFilters) {
    try {
        const organizationId = await getOrganizationId();

        const conditions = [sql`invoices.organization_id = ${organizationId}`];

        if (filters.query) {
            const term = `%${filters.query}%`;
            conditions.push(
                sql`(COALESCE(customers.name, '') ILIKE ${term}
                    OR COALESCE(customers.email, '') ILIKE ${term}
                    OR invoices.amount::text ILIKE ${term}
                    OR invoices.date::text ILIKE ${term}
                    OR invoices.status ILIKE ${term})`,
            );
        }

        if (filters.customerId) {
            conditions.push(sql`invoices.customer_id = ${filters.customerId}`);
        }

        if (filters.status) {
            conditions.push(sql`invoices.status = ${filters.status}`);
        }

        if (filters.dateFrom) {
            conditions.push(sql`DATE(invoices.date) = ${filters.dateFrom}`);
        }

        if (filters.dateTo) {
            conditions.push(
                sql`DATE(invoices.payment_date) = ${filters.dateTo}`,
            );
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
        FROM invoices
        LEFT JOIN customers ON invoices.customer_id = customers.id
        ${whereClause}
    `;

        const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
        return totalPages;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch total number of invoices.");
    }
}

export async function fetchInvoiceById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<(InvoiceForm & { created_by?: string })[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status,
        invoices.date,
        invoices.payment_date,
        invoices.created_by
      FROM invoices
      WHERE invoices.id = ${id} AND invoices.organization_id = ${organizationId};
    `;

        return data[0];
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch invoice.");
    }
}

export async function fetchCustomers() {
    const organizationId = await getOrganizationId();

    try {
        const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      WHERE organization_id = ${organizationId}
      ORDER BY name ASC
    `;

        return customers;
    } catch (err) {
        console.error("Database Error:", err);
        throw new Error("Failed to fetch all customers.");
    }
}

export async function fetchFilteredCustomers(
    query: string,
): Promise<FormattedCustomersTable[]> {
    const organizationId = await getOrganizationId();

    try {
        // O banco retorna números
        const data = await sql<CustomersTableType[]>`
            SELECT
              customers.id,
              customers.name,
              customers.email,
              customers.image_url,
              customers.nif,
              customers.endereco_fiscal,
              customers.created_by,
              COUNT(invoices.id) AS total_invoices,
              COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) AS total_pending,
              COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END), 0) AS total_paid
            FROM customers
            LEFT JOIN invoices ON customers.id = invoices.customer_id
            WHERE 
              customers.organization_id = ${organizationId}
              AND (customers.name ILIKE ${`%${query}%`} OR customers.email ILIKE ${`%${query}%`})
            GROUP BY customers.id, customers.name, customers.email, customers.image_url, customers.nif, customers.endereco_fiscal, customers.created_by
            ORDER BY customers.name ASC
        `;
        const formattedCustomers: FormattedCustomersTable[] = data.map(
            (customer) => ({
                id: customer.id,
                name: customer.name,
                email: customer.email,
                image_url: customer.image_url || DEFAULT_AVATAR,
                nif: customer.nif,
                endereco_fiscal: customer.endereco_fiscal,
                created_by: customer.created_by,
                total_invoices: Number(customer.total_invoices),
                total_pending: Number(customer.total_pending),
                total_paid: Number(customer.total_paid),
            }),
        );

        return formattedCustomers;
    } catch (err) {
        console.error("Database Error:", err);
        throw new Error("Failed to fetch customer table.");
    }
}

export async function fetchCustomerById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<Customer[]>`
      SELECT id, name, email, image_url, nif, endereco_fiscal, created_by
      FROM customers
      WHERE id = ${id} AND organization_id = ${organizationId}
    `;

        const customer = data[0];
        return customer || undefined;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch customer.");
    }
}

export async function fetchUserById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<User[]>`
            SELECT id, name, email, password, role, image_url, iban
      FROM users
      WHERE id = ${id} AND organization_id = ${organizationId}
    `;

        return data[0] || undefined;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch user.");
    }
}

export async function fetchInvoiceCustomers() {
    try {
        const organizationId = await getOrganizationId();
        const data = await sql<{ id: string; name: string }[]>`
            SELECT id, name
            FROM customers
            WHERE organization_id = ${organizationId}
            ORDER BY name ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch invoice customers.");
    }
}

export async function fetchInvoiceDates() {
    try {
        const organizationId = await getOrganizationId();
        const data = await sql<{ date: string }[]>`
            SELECT DISTINCT invoices.date
            FROM invoices
            WHERE invoices.organization_id = ${organizationId}
            ORDER BY invoices.date DESC
        `;

        return data.map((row) => row.date);
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch invoice dates.");
    }
}

export async function fetchInvoicePaymentDates() {
    try {
        const organizationId = await getOrganizationId();
        const data = await sql<{ payment_date: string }[]>`
            SELECT DISTINCT invoices.payment_date
            FROM invoices
            WHERE invoices.organization_id = ${organizationId} 
            AND invoices.payment_date IS NOT NULL
            ORDER BY invoices.payment_date DESC
        `;

        return data.map((row) => row.payment_date);
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch invoice payment dates.");
    }
}

// ============================================
// PRESIDENTE QUERIES
// ============================================

// ---------- EQUIPAS ----------

export async function fetchEquipas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                escalao: string;
                estado: string;
                desporto: string;
                total_atletas: number;
                nome_treinador: string | null;
            }[]
        >`
            SELECT
                equipas.id,
                equipas.nome,
                equipas.escalao,
                equipas.estado,
                equipas.desporto,
                COUNT(atletas.id) AS total_atletas,
                MAX(staff.nome) AS nome_treinador
            FROM equipas
            LEFT JOIN atletas ON atletas.equipa_id = equipas.id
            LEFT JOIN staff ON staff.equipa_id = equipas.id AND staff.funcao = 'treinador'
            WHERE equipas.organization_id = ${organizationId}
            GROUP BY equipas.id, equipas.nome, equipas.escalao, equipas.estado, equipas.desporto
            ORDER BY equipas.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch equipas.");
    }
}

export async function fetchEquipaById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const equipa = await sql<
            {
                id: string;
                nome: string;
                escalao: string;
                estado: string;
                desporto: string;
            }[]
        >`
            SELECT id, nome, escalao, estado, desporto
            FROM equipas
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;

        const atletas = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
            }[]
        >`
            SELECT id, nome, posicao, numero_camisola, estado
            FROM atletas
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY nome ASC
        `;

        const staff = await sql<
            {
                id: string;
                nome: string;
                funcao: string;
            }[]
        >`
            SELECT id, nome, funcao
            FROM staff
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY funcao ASC
        `;

        const jogos = await sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
            }[]
        >`
            SELECT id, adversario, data, casa_fora, resultado_nos, resultado_adv, estado
            FROM jogos
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY data DESC
            LIMIT 10
        `;

        return { equipa: equipa[0], atletas, staff, jogos };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch equipa.");
    }
}

// ---------- ATLETAS ----------

export async function fetchAtletas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<{
            id:                 string;
            nome:               string;
            posicao:            string | null;
            numero_camisola:    number | null;
            estado:             string;
            equipa_nome:        string | null;
            equipa_id:          string | null;
            mensalidade_estado: string | null;
            federado:           boolean;
            numero_federado:    string | null;
            mao_dominante:      string | null;
        }[]>`
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
            WHERE jogos.organization_id = ${organizationId}
            ORDER BY jogos.data DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch jogos.");
    }
}

// ---------- MENSALIDADES ----------

export async function fetchMensalidades() {
    try {
        const organizationId = await getOrganizationId();

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
        const organizationId = await getOrganizationId();

        const [equipas, atletas, jogos, mensalidades, epoca] = await Promise.all([
            sql`SELECT COUNT(*) FROM equipas WHERE organization_id = ${organizationId}`,
            sql`SELECT COUNT(*) FROM atletas WHERE organization_id = ${organizationId}`,
            sql`SELECT COUNT(*) FROM jogos WHERE organization_id = ${organizationId} AND estado = 'agendado'`,
            sql`SELECT COUNT(*) FROM mensalidades WHERE organization_id = ${organizationId} AND estado = 'em_atraso'`,
            sql<{ nome: string }[]>`
    SELECT nome FROM epocas
    WHERE organization_id = ${organizationId} AND ativa = true
    LIMIT 1
`,
        ]);

        return {
            totalEquipas:          Number(equipas[0].count),
            totalAtletas:          Number(atletas[0].count),
            jogosAgendados:        Number(jogos[0].count),
            mensalidadesEmAtraso:  Number(mensalidades[0].count),
            epocaNome:             epoca[0]?.nome ?? null,
        };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch presidente dashboard.");
    }
}

export async function fetchUltimosJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<{
            id:             string;
            data:           string;
            adversario:     string;
            resultado_nos:  number | null;
            resultado_adv:  number | null;
            casa_fora:      string;
        }[]>`
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
        throw new Error("Failed to fetch últimos jogos.");
    }
}

export async function fetchProximosJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<{
            id:         string;
            data:       string;
            adversario: string;
            casa_fora:  string;
            local:      string | null;
        }[]>`
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
        throw new Error("Failed to fetch próximos jogos.");
    }
}


// ---------- STAFF ----------

export async function fetchStaff() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                funcao: string;
                equipa_id: string | null;
                equipa_nome: string | null;
                user_email: string | null;
                user_telefone: string | null;
            }[]
        >`
            SELECT
                staff.id,
                staff.nome,
                staff.funcao,
                staff.equipa_id,
                equipas.nome AS equipa_nome,
                users.email AS user_email,
                users.telefone AS user_telefone
            FROM staff
            LEFT JOIN equipas ON staff.equipa_id = equipas.id
            LEFT JOIN users ON staff.user_id = users.id
            WHERE staff.organization_id = ${organizationId}
            ORDER BY staff.funcao ASC, staff.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch staff.");
    }
}

// ---------- ESTATÍSTICAS ----------

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
                COALESCE(SUM(estatisticas_jogo.golos), 0) AS golos,
                COALESCE(SUM(estatisticas_jogo.assistencias), 0) AS assistencias,
                COUNT(DISTINCT assiduidade.sessao_id) AS total_treinos,
                COUNT(DISTINCT CASE WHEN assiduidade.presente THEN assiduidade.sessao_id END) AS presencas
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN estatisticas_jogo ON estatisticas_jogo.atleta_id = atletas.id
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

// ---------- ÉPOCA ----------

export async function fetchEpocaAtiva() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                data_inicio: string;
                data_fim: string;
                ativa: boolean;
            }[]
        >`
            SELECT id, nome, data_inicio, data_fim, ativa
            FROM epocas
            WHERE organization_id = ${organizationId}
            ORDER BY ativa DESC, data_inicio DESC
            LIMIT 1
        `;

        return data[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch epoca ativa.");
    }
}

// ---------- PERFIL ----------

export async function fetchPerfilPresidente() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                iban: string | null;
                org_name: string;
                org_slug: string;
                org_created_at: string;
            }[]
        >`
            SELECT
                u.iban,
                o.name   AS org_name,
                o.slug   AS org_slug,
                o.created_at AS org_created_at
            FROM users u
            JOIN organizations o ON o.id = u.organization_id
            WHERE u.organization_id = ${organizationId}
              AND u.role = 'admin'
            LIMIT 1
        `;

        return data[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch perfil presidente.");
    }
}

// ---------- COMUNICADOS ----------

export async function fetchComunicados() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                titulo: string;
                conteudo: string;
                destinatarios: string;
                criado_por: string;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, conteudo, destinatarios, criado_por, created_at
            FROM comunicados
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch comunicados.");
    }
}

// ---------- AUTORIZAÇÕES ----------

export async function fetchAutorizacoes() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                autorizado_a: string;
                autorizado_por: string;
                tipo_acao: string;
                notas: string | null;
                created_at: string;
            }[]
        >`
            SELECT id, autorizado_a, autorizado_por, tipo_acao, notas, created_at
            FROM autorizacoes_log
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch autorizacoes.");
    }
}

// ---------- DOCUMENTOS ----------

export async function fetchDocumentos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                tipo: string;
                url_r2: string;
                created_at: string;
            }[]
        >`
            SELECT id, nome, tipo, url_r2, created_at
            FROM documentos
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch documentos.");
    }
}

export async function fetchOrganizacao() {
    try {
        const organizationId = await getOrganizationId();
        const data = await sql<{
            id:            string;
            name:          string;
            slug:          string;
            desporto:      string | null;
            cidade:        string | null;
            pais:          string | null;
            website:       string | null;
            logo_url:      string | null;
            plano:         string | null;
            nif:           string | null;
            telefone:      string | null;
            morada:        string | null;
            codigo_postal: string | null;
        }[]>`
            SELECT id, name, slug, desporto, cidade, pais, website, logo_url, plano,
                   nif, telefone, morada, codigo_postal
            FROM organizations
            WHERE id = ${organizationId}
            LIMIT 1
        `;
        return data[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch organization.");
    }
}


export async function fetchNotificacoes() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                titulo: string;
                descricao: string;
                tipo: string;
                lida: boolean;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, descricao, tipo, lida, created_at
            FROM notificacoes
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
            LIMIT 50
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch notificacoes.");
    }
}

