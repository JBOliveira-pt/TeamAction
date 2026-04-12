// Rota API planos-nutricao/[id]: atualizar ou eliminar plano de nutricao por id.
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

    const me = await getUser(userId);
    if (!me) return new Response("User not found", { status: 404 });

    const { id } = await params;
    const body = await req.json() as {
        nome?: string;
        descricao?: string;
        objetivo?: string;
        observacoes?: string;
    };

    if (!body.nome?.trim())
        return new Response("Nome é obrigatório.", { status: 400 });

    const objetivosValidos = ["Pré-Jogo", "Recuperação", "Massa Muscular", "Perda de Peso"];
    if (body.objetivo && !objetivosValidos.includes(body.objetivo))
        return new Response("Objetivo inválido.", { status: 400 });

    const rows = await sql<{ id: string }[]>`
        UPDATE planos_nutricao
        SET nome        = ${body.nome.trim()},
            descricao   = ${body.descricao?.trim() ?? null},
            objetivo    = ${body.objetivo ?? null},
            observacoes = ${body.observacoes?.trim() ?? null}
        WHERE id = ${id}
          AND organization_id = ${me.organization_id}
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

    const me = await getUser(userId);
    if (!me) return new Response("User not found", { status: 404 });

    const { id } = await params;

    const deleted = await sql`
        DELETE FROM planos_nutricao
        WHERE id = ${id}
          AND organization_id = ${me.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
