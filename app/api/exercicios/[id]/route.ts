import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const CATEGORIAS = ["Técnico", "Tático", "Físico", "Misto"] as const;
const NIVEIS = ["Fácil", "Médio", "Intenso", "Difícil"] as const;

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
    const body = await req.json();
    const { nome, descricao, categoria, duracao_min, nivel } = body as {
        nome?: string;
        descricao?: string;
        categoria?: string;
        duracao_min?: number;
        nivel?: string;
    };

    if (!nome || nome.trim().length < 3 || nome.trim().length > 100)
        return new Response("Nome inválido.", { status: 400 });
    if (!descricao || !descricao.trim() || descricao.trim().length > 500)
        return new Response("Descrição inválida.", { status: 400 });
    if (!categoria || !CATEGORIAS.includes(categoria as never))
        return new Response("Categoria inválida.", { status: 400 });
    const dur = Number(duracao_min);
    if (!duracao_min || isNaN(dur) || dur < 5 || dur > 120)
        return new Response("Duração deve estar entre 5 e 120 minutos.", { status: 400 });
    if (!nivel || !NIVEIS.includes(nivel as never))
        return new Response("Nível inválido.", { status: 400 });

    const rows = await sql<{ id: string }[]>`
        UPDATE exercicios
        SET nome         = ${nome.trim()},
            descricao    = ${descricao.trim()},
            categoria    = ${categoria},
            duracao_min  = ${dur},
            nivel        = ${nivel},
            updated_at   = NOW()
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
        DELETE FROM exercicios
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
