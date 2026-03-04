import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            });
        }

        // Get organization_id
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;

        if (!user || !user[0]?.organization_id) {
            return new Response(
                JSON.stringify({ error: "Organization not found" }),
                { status: 404 },
            );
        }

        const organizationId = user[0].organization_id;

        // Get total count of pending invoices
        const totalCount = await sql`
            SELECT COUNT(*) as total
            FROM invoices
            WHERE organization_id = ${organizationId}
            AND status = 'pending'
        `;

        // Fetch pending invoices with customer info (limit to 5 for dropdown)
        const pendingInvoices = await sql`
            SELECT 
                invoices.id,
                invoices.amount,
                invoices.date,
                invoices.status,
                customers.name as customer_name
            FROM invoices
            JOIN customers ON invoices.customer_id = customers.id
            WHERE invoices.organization_id = ${organizationId}
            AND invoices.status = 'pending'
            ORDER BY invoices.date DESC
            LIMIT 5
        `;

        // Format response
        const formatted = pendingInvoices.map((inv: any) => ({
            id: inv.id,
            customer_name: inv.customer_name,
            amount: inv.amount,
            date: inv.date,
            status: inv.status,
        }));

        return new Response(
            JSON.stringify({
                invoices: formatted,
                total: Number(totalCount[0].total),
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        console.error("API Error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch invoices" }),
            { status: 500 },
        );
    }
}
