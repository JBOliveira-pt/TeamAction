import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth-helpers";
import { requireApiAccountType } from "@/app/lib/api-guards";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const access = await requireApiAccountType();
        if (!access.ok) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status },
            );
        }

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
                status: "pendente_envio" | "enviado_atleta";
            }[]
        >`
            SELECT id, created_by, organization_id, status
            FROM recibos
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
            currentUser.account_type === "presidente" ||
            receipt.created_by === currentUser.id;

        if (!canSend) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (receipt.status === "enviado_atleta") {
            return NextResponse.json(
                { error: "Recibo ja enviado" },
                { status: 409 },
            );
        }

        await sql`
            UPDATE recibos
            SET 
                status = 'enviado_atleta',
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
