// Rota API avaliacoes-fisicas/[id]: atualizar ou eliminar avaliacao fisica por id.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;

    const user = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const body = await req.json() as {
        data: string;
        velocidade_30m?: number;
        impulsao_vertical?: number;
        vo2max?: number;
        forca_kg?: number;
        observacoes?: string;
    };

    if (!body.data)
        return new Response("data é obrigatória.", { status: 400 });

    const rows = await sql<{ id: string }[]>`
        UPDATE avaliacoes_fisicas SET
            data               = ${body.data},
            velocidade_30m     = ${body.velocidade_30m ?? null},
            impulsao_vertical  = ${body.impulsao_vertical ?? null},
            vo2max             = ${body.vo2max ?? null},
            forca_kg           = ${body.forca_kg ?? null},
            observacoes        = ${body.observacoes?.trim() ?? null}
        WHERE id = ${id}
          AND organization_id = ${me.organization_id}
        RETURNING id
    `;

    if (rows.length === 0)
        return new Response("Avaliação não encontrada.", { status: 404 });

    return new Response("ok", { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;

    const user = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const rows = await sql<{ id: string }[]>`
        DELETE FROM avaliacoes_fisicas
        WHERE id = ${id} AND organization_id = ${me.organization_id}
        RETURNING id
    `;

    if (rows.length === 0)
        return new Response("Avaliação não encontrada.", { status: 404 });

    return new Response("ok", { status: 200 });
}
