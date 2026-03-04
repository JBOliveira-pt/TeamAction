import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const pgSql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const invoice = await pgSql<
            {
                id: string;
                status: string;
                amount: number;
                date: string;
                payment_date: string | null;
                activity_code: string | null;
                created_by: string;
                organization_id: string;
            }[]
        >`SELECT id, status, amount, date, payment_date, activity_code, created_by, organization_id FROM invoices WHERE id = ${id}`;

        if (!invoice || invoice.length === 0) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 },
            );
        }

        const inv = invoice[0];

        const receipt = await pgSql<
            { id: string; status: string }[]
        >`SELECT id, status FROM receipts WHERE invoice_id = ${id}`;

        const issuer = await pgSql<
            { id: string; name: string; iban: string | null }[]
        >`SELECT id, name, iban FROM users WHERE organization_id = ${inv.organization_id} AND role = 'admin' LIMIT 1`;

        return NextResponse.json({
            invoice: {
                ...inv,
                date: inv.date.toString(),
                payment_date: inv.payment_date?.toString() || null,
            },
            receipt: receipt.length > 0 ? receipt[0] : null,
            issuer: issuer.length > 0 ? issuer[0] : null,
            debug: {
                shouldCreateReceipt:
                    inv.status === "pending"
                        ? "Would create"
                        : "Would NOT create",
                hasReceipt: receipt.length > 0,
                hasIban: issuer.length > 0 && issuer[0]?.iban ? true : false,
            },
        });
    } catch (error) {
        console.error("Debug error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
