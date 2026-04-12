// Rota API exercicios: listar e criar exercicios de treino com categoria e nivel.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const CATEGORIAS = ["Técnico", "Tático", "Físico", "Misto"] as const;
const NIVEIS = ["Fácil", "Médio", "Intenso", "Difícil"] as const;

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS exercicios (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            treinador_id    UUID        NOT NULL,
            nome            TEXT        NOT NULL,
            descricao       TEXT        NOT NULL,
            categoria       TEXT        NOT NULL,
            duracao_min     INTEGER     NOT NULL,
            nivel           TEXT        NOT NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_exercicios_org
            ON exercicios (organization_id, created_at DESC)
    `;
}

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

function validar(body: Record<string, unknown>) {
    const { nome, descricao, categoria, duracao_min, nivel } = body;
    if (!nome || typeof nome !== "string" || nome.trim().length < 3)
        return "Nome deve ter pelo menos 3 caracteres.";
    if (nome.trim().length > 100)
        return "Nome não pode ter mais de 100 caracteres.";
    if (!descricao || typeof descricao !== "string" || !descricao.trim())
        return "Descrição obrigatória.";
    if (descricao.trim().length > 500)
        return "Descrição não pode ter mais de 500 caracteres.";
    if (!categoria || !CATEGORIAS.includes(categoria as never))
        return "Categoria inválida.";
    const dur = Number(duracao_min);
    if (!duracao_min || isNaN(dur) || dur < 5 || dur > 120)
        return "Duração deve estar entre 5 e 120 minutos.";
    if (!nivel || !NIVEIS.includes(nivel as never))
        return "Nível inválido.";
    return null;
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    await ensureTable();

    const rows = await sql<{
        id: string;
        nome: string;
        descricao: string;
        categoria: string;
        duracao_min: number;
        nivel: string;
        created_at: string;
    }[]>`
        SELECT id, nome, descricao, categoria, duracao_min, nivel, created_at
        FROM exercicios
        WHERE organization_id = ${user.organization_id}
        ORDER BY created_at DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const body = await req.json();
    const erro = validar(body);
    if (erro) return new Response(erro, { status: 400 });

    const { nome, descricao, categoria, duracao_min, nivel } = body;

    await ensureTable();

    const rows = await sql<{
        id: string;
        nome: string;
        descricao: string;
        categoria: string;
        duracao_min: number;
        nivel: string;
        created_at: string;
    }[]>`
        INSERT INTO exercicios (organization_id, treinador_id, nome, descricao, categoria, duracao_min, nivel)
        VALUES (${user.organization_id}, ${user.id}, ${nome.trim()}, ${descricao.trim()}, ${categoria}, ${Number(duracao_min)}, ${nivel})
        RETURNING id, nome, descricao, categoria, duracao_min, nivel, created_at
    `;

    return Response.json(rows[0], { status: 201 });
}
