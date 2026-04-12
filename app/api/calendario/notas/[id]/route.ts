// Rota API calendario/notas/[id]: eliminar nota de calendario por id.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

async function isMinorPending(dbUserId: string): Promise<boolean> {
    const [atleta] = await sql<{ menor_idade: boolean | null }[]>`
        SELECT menor_idade FROM atletas WHERE user_id = ${dbUserId} LIMIT 1
    `;
    if (atleta?.menor_idade !== true) return false;
    const pendente = await sql<{ id: string }[]>`
        SELECT id FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${dbUserId}
          AND relation_kind = 'responsavel'
          AND status IN ('pendente', 'pendente_responsavel')
        LIMIT 1
    `;
    return pendente.length > 0;
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    if (await isMinorPending(user.id)) {
        return Response.json(
            {
                error: "Conta de atleta menor pendente de validação do responsável.",
            },
            { status: 403 },
        );
    }

    const { id } = await params;

    const deleted = await sql`
        DELETE FROM calendar_notes
        WHERE id = ${id}
          AND user_id = ${user.id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
