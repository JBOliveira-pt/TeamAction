import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS sessoes (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            treinador_id    UUID        NOT NULL,
            equipa_id       UUID,
            data            DATE        NOT NULL,
            tipo            TEXT        NOT NULL,
            duracao_min     INTEGER     NOT NULL,
            observacoes     TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_sessoes_org_data
            ON sessoes (organization_id, data DESC)
    `;
}

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    await ensureTable();

    const rows = await sql<{
        id: string;
        data: string;
        tipo: string;
        duracao_min: number;
        observacoes: string | null;
        equipa_nome: string | null;
        created_at: string;
    }[]>`
        SELECT
            sessoes.id,
            sessoes.data,
            sessoes.tipo,
            sessoes.duracao_min,
            sessoes.observacoes,
            equipas.nome AS equipa_nome,
            sessoes.created_at
        FROM sessoes
        LEFT JOIN equipas ON equipas.id = sessoes.equipa_id
        WHERE sessoes.organization_id = ${user.organization_id}
        ORDER BY sessoes.data DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const body = await req.json();
    const { data, tipo, duracao_min, observacoes, equipa_id } = body as {
        data?: string;
        tipo?: string;
        duracao_min?: number;
        observacoes?: string;
        equipa_id?: string;
    };

    const tiposValidos = ["Tático", "Físico", "Técnico", "Misto"];

    if (!data) return new Response("Data obrigatória", { status: 400 });
    if (!tipo || !tiposValidos.includes(tipo)) return new Response("Tipo inválido", { status: 400 });
    if (!duracao_min || duracao_min < 15 || duracao_min > 300)
        return new Response("Duração deve estar entre 15 e 300 minutos", { status: 400 });

    await ensureTable();

    const rows = await sql<{
        id: string;
        data: string;
        tipo: string;
        duracao_min: number;
        observacoes: string | null;
        created_at: string;
    }[]>`
        INSERT INTO sessoes (organization_id, treinador_id, equipa_id, data, tipo, duracao_min, observacoes)
        VALUES (
            ${user.organization_id},
            ${user.id},
            ${equipa_id ?? null},
            ${data},
            ${tipo},
            ${duracao_min},
            ${observacoes?.trim() || null}
        )
        RETURNING id, data, tipo, duracao_min, observacoes, created_at
    `;

    return Response.json(rows[0], { status: 201 });
}
