// Rota API jogadas-taticas/[id]: atualizar ou eliminar jogada tatica por id.
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
        nome?: string;
        tipo?: string;
        sistema?: string;
        posicoes?: object[];
        setas?: object[];
        descricao?: string;
    };

    if (!body.nome?.trim() || body.nome.trim().length < 2)
        return new Response("Nome deve ter pelo menos 2 caracteres.", { status: 400 });

    const rows = await sql<{ id: string }[]>`
        UPDATE jogadas_taticas
        SET nome       = ${body.nome.trim()},
            tipo       = ${body.tipo ?? "Personalizada"},
            sistema    = ${body.sistema ?? "6-0"},
            posicoes   = ${sql.json((body.posicoes ?? []) as never)},
            setas      = ${sql.json((body.setas ?? []) as never)},
            descricao  = ${body.descricao?.trim() ?? ""},
            updated_at = NOW()
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
        DELETE FROM jogadas_taticas
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
