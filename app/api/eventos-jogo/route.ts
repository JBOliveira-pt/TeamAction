import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS eventos_jogo (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            jogo_id         UUID        NOT NULL,
            atleta_id       UUID,
            tipo            TEXT        NOT NULL,
            minuto          INTEGER,
            observacoes     TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    await ensureTable();

    const jogoId = req.nextUrl.searchParams.get("jogo_id");
    if (!jogoId) return Response.json([]);

    const rows = await sql<{
        id: string;
        jogo_id: string;
        atleta_id: string | null;
        atleta_nome: string | null;
        tipo: string;
        minuto: number | null;
        observacoes: string | null;
        created_at: string;
    }[]>`
        SELECT e.id, e.jogo_id, e.atleta_id, a.nome AS atleta_nome,
               e.tipo, e.minuto, e.observacoes, e.created_at::text
        FROM eventos_jogo e
        LEFT JOIN atletas a ON a.id = e.atleta_id
        WHERE e.organization_id = ${me.organization_id}
          AND e.jogo_id = ${jogoId}
        ORDER BY e.minuto ASC NULLS LAST, e.created_at ASC
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
        jogo_id: string;
        atleta_id?: string;
        tipo: string;
        minuto?: number;
        observacoes?: string;
    };

    if (!body.jogo_id || !body.tipo)
        return new Response("jogo_id e tipo são obrigatórios.", { status: 400 });

    const tiposValidos = ["Golo", "Assistência", "Falta", "Cartão Amarelo", "Cartão Vermelho", "Substituição"];
    if (!tiposValidos.includes(body.tipo))
        return new Response("Tipo inválido.", { status: 400 });

    await ensureTable();

    const [evento] = await sql<{ id: string }[]>`
        INSERT INTO eventos_jogo (organization_id, jogo_id, atleta_id, tipo, minuto, observacoes)
        VALUES (
            ${me.organization_id},
            ${body.jogo_id},
            ${body.atleta_id ?? null},
            ${body.tipo},
            ${body.minuto ?? null},
            ${body.observacoes?.trim() ?? null}
        )
        RETURNING id
    `;

    return Response.json({ id: evento.id }, { status: 201 });
}
