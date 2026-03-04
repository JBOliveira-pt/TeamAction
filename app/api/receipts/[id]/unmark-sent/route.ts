import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextResponse } from "next/server";

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

        // Update receipt status to pending_send and clear sent_at/sent_by_user
        await sql`
            UPDATE receipts
            SET 
                status = 'pending_send',
                sent_at = NULL,
                sent_by_user = NULL
            WHERE id = ${id}
        `;

        return NextResponse.json(
            { message: "Receipt unmarked as sent" },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error unmarking receipt as sent:", error);
        return NextResponse.json(
            { error: "Failed to unmark receipt as sent" },
            { status: 500 },
        );
    }
}
