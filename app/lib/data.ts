import postgres from "postgres";
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
async function getOrganizationId(): Promise<string> {
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
