import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth-helpers";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id } = await params;

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        const receiptRows = await sql<
            {
                id: string;
                created_by: string | null;
                organization_id: string;
                status: "pending_send" | "sent_to_customer";
            }[]
        >`
            SELECT id, created_by, organization_id, status
            FROM receipts
            WHERE id = ${id}
        `;

        const receipt = receiptRows[0];
        if (!receipt) {
            return NextResponse.json(
                { error: "Receipt not found" },
                { status: 404 },
            );
        }

        if (receipt.organization_id !== currentUser.organization_id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const canSend =
            currentUser.role === "admin" ||
            receipt.created_by === currentUser.id;

        if (!canSend) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (receipt.status === "sent_to_customer") {
            return NextResponse.json(
                { error: "Receipt already sent" },
                { status: 409 },
            );
        }

        // Update receipt status and sent_at timestamp
        await sql`
            UPDATE receipts
            SET 
                status = 'sent_to_customer',
                sent_at = NOW(),
                sent_by_user = ${currentUser.id}
            WHERE id = ${id}
        `;

        return NextResponse.json(
            { message: "Receipt marked as sent" },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error marking receipt as sent:", error);
        return NextResponse.json(
            { error: "Failed to mark receipt as sent" },
            { status: 500 },
        );
    }
}
