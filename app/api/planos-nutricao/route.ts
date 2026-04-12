// Rota API planos-nutricao: listar e criar planos de nutricao.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS planos_nutricao (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            treinador_id    UUID        NOT NULL,
            nome            TEXT        NOT NULL,
            descricao       TEXT,
            objetivo        TEXT,
            observacoes     TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    await ensureTable();

    const rows = await sql<{
        id: string;
        nome: string;
        descricao: string | null;
        objetivo: string | null;
        observacoes: string | null;
        created_at: string;
    }[]>`
        SELECT id, nome, descricao, objetivo, observacoes, created_at::text
        FROM planos_nutricao
        WHERE organization_id = ${me.organization_id}
        ORDER BY created_at DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const body = await req.json() as {
        nome: string;
        descricao?: string;
        objetivo?: string;
        observacoes?: string;
    };

    if (!body.nome?.trim())
        return new Response("Nome é obrigatório.", { status: 400 });

    const objetivosValidos = ["Pré-Jogo", "Recuperação", "Massa Muscular", "Perda de Peso"];
    if (body.objetivo && !objetivosValidos.includes(body.objetivo))
        return new Response("Objetivo inválido.", { status: 400 });

    await ensureTable();

    const [plano] = await sql<{ id: string }[]>`
        INSERT INTO planos_nutricao (organization_id, treinador_id, nome, descricao, objetivo, observacoes)
        VALUES (
            ${me.organization_id},
            ${me.id},
            ${body.nome.trim()},
            ${body.descricao?.trim() ?? null},
            ${body.objetivo ?? null},
            ${body.observacoes?.trim() ?? null}
        )
        RETURNING id
    `;

    return Response.json({ id: plano.id }, { status: 201 });
}
