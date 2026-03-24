import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const { id } = await params;
    const body = await req.json() as {
        resultado_nos?: number | null;
        resultado_adv?: number | null;
        estado?: string;
        adversario?: string;
        data?: string;
        casa_fora?: string;
        local?: string | null;
    };

    const estadosValidos = ["agendado", "realizado", "cancelado"];
    const estado = body.estado && estadosValidos.includes(body.estado)
        ? body.estado
        : undefined;

    // Validate resultado if provided
    if (body.resultado_nos !== undefined && body.resultado_nos !== null) {
        if (!Number.isInteger(body.resultado_nos) || body.resultado_nos < 0)
            return new Response("Resultado inválido.", { status: 400 });
    }
    if (body.resultado_adv !== undefined && body.resultado_adv !== null) {
        if (!Number.isInteger(body.resultado_adv) || body.resultado_adv < 0)
            return new Response("Resultado inválido.", { status: 400 });
    }

    const rows = await sql<{ id: string }[]>`
        UPDATE jogos
        SET
            resultado_nos = COALESCE(${body.resultado_nos ?? null}, resultado_nos),
            resultado_adv = COALESCE(${body.resultado_adv ?? null}, resultado_adv),
            estado        = COALESCE(${estado ?? null}, estado),
            adversario    = COALESCE(${body.adversario?.trim() ?? null}, adversario),
            data          = COALESCE(${body.data ?? null}::date, data),
            casa_fora     = COALESCE(${body.casa_fora ?? null}, casa_fora),
            local         = COALESCE(${body.local ?? null}, local)
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (rows.length === 0) return new Response("Not found", { status: 404 });

    return Response.json({ id: rows[0].id });
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const { id } = await params;

    const deleted = await sql`
        DELETE FROM jogos
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
