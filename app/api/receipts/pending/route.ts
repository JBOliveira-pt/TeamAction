import { auth } from "@clerk/nextjs/server";
import { requireApiAccountType } from "@/app/lib/api-guards";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
    try {
        const access = await requireApiAccountType();
        if (!access.ok) {
            return new Response(JSON.stringify({ error: access.error }), {
                status: access.status,
            });
        }

        const { userId } = await auth();

        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            });
        }

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

        const totalCount = await sql`
            SELECT COUNT(*) as total
            FROM receipts
            WHERE organization_id = ${organizationId}
            AND status = 'pending_send'
        `;

        const columnCheck = await sql<{ has_receipt_number: boolean }[]>`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                    AND table_name = 'receipts'
                    AND column_name = 'receipt_number'
            ) AS has_receipt_number
        `;

        const hasReceiptNumber = columnCheck[0]?.has_receipt_number === true;

        const pendingReceipts = hasReceiptNumber
            ? await sql`
                SELECT
                    receipts.id,
                    receipts.receipt_number,
                    receipts.amount,
                    receipts.received_date,
                    receipts.status,
                    customers.name as customer_name
                FROM receipts
                JOIN customers ON receipts.customer_id = customers.id
                WHERE receipts.organization_id = ${organizationId}
                AND receipts.status = 'pending_send'
                ORDER BY receipts.received_date DESC
                LIMIT 5
            `
            : await sql`
                SELECT
                    receipts.id,
                    receipts.amount,
                    receipts.received_date,
                    receipts.status,
                    customers.name as customer_name
                FROM receipts
                JOIN customers ON receipts.customer_id = customers.id
                WHERE receipts.organization_id = ${organizationId}
                AND receipts.status = 'pending_send'
                ORDER BY receipts.received_date DESC
                LIMIT 5
            `;

        const formatted = pendingReceipts.map((receipt: any) => ({
            id: receipt.id,
            receipt_number: receipt.receipt_number ?? receipt.id.slice(0, 8),
            customer_name: receipt.customer_name,
            amount: receipt.amount,
            received_date: receipt.received_date,
            status: receipt.status,
        }));

        return new Response(
            JSON.stringify({
                receipts: formatted,
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
            JSON.stringify({ error: "Failed to fetch receipts" }),
            { status: 500 },
        );
    }
}
