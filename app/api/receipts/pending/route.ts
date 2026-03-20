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
            FROM recibos
            WHERE organization_id = ${organizationId}
            AND status = 'pendente_envio'
        `;

        const pendingRecibos = await sql`
            SELECT
                recibos.id,
                recibos.recibo_number,
                recibos.amount,
                recibos.received_date,
                recibos.status,
                COALESCE(atletas.nome, 'Atleta removido') as atleta_nome
            FROM recibos
            LEFT JOIN atletas ON recibos.atleta_id = atletas.id
            WHERE recibos.organization_id = ${organizationId}
            AND recibos.status = 'pendente_envio'
            ORDER BY recibos.created_at DESC
            LIMIT 5
        `;

        const formatted = pendingRecibos.map((recibo: any) => ({
            id: recibo.id,
            recibo_number: recibo.recibo_number,
            atleta_nome: recibo.atleta_nome,
            amount: recibo.amount,
            received_date: recibo.received_date,
            status: recibo.status,
        }));

        return new Response(
            JSON.stringify({
                recibos: formatted,
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
            JSON.stringify({ error: "Failed to fetch recibos" }),
            { status: 500 },
        );
    }
}
