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
        data?: string;
        hora?: string;
        tipo?: string;
        duracao_min?: number;
        local?: string;
        notas?: string;
        equipa_id?: string;
    };

    const tiposValidos = ["Tático", "Físico", "Técnico", "Misto"];
    if (!body.data) return new Response("Data obrigatória", { status: 400 });
    if (!body.hora) return new Response("Hora obrigatória", { status: 400 });
    if (!body.tipo || !tiposValidos.includes(body.tipo)) return new Response("Tipo inválido", { status: 400 });
    if (!body.duracao_min || body.duracao_min < 15 || body.duracao_min > 300)
        return new Response("Duração deve estar entre 15 e 300 minutos", { status: 400 });

    const rows = await sql<{
        id: string;
        data: string;
        hora: string;
        tipo: string;
        duracao_min: number;
        local: string | null;
        notas: string | null;
        equipa_id: string | null;
        created_at: string;
    }[]>`
        UPDATE sessoes SET
            data        = ${body.data},
            hora        = ${body.hora},
            tipo        = ${body.tipo},
            duracao_min = ${body.duracao_min},
            local       = ${body.local?.trim() || null},
            notas       = ${body.notas?.trim() || null},
            equipa_id   = ${body.equipa_id || null},
            updated_at  = NOW()
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id, data, hora, tipo, duracao_min, local, notas, equipa_id, created_at
    `;

    if (rows.length === 0) return new Response("Not found", { status: 404 });

    return Response.json(rows[0]);
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
        DELETE FROM sessoes
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
