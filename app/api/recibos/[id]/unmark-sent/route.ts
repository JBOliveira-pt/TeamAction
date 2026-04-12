// Rota API recibos/[id]/unmark-sent: remover marcacao de enviado de um recibo.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextResponse } from "next/server";
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

        await sql`
            UPDATE recibos
            SET 
                status = 'pendente_envio',
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
