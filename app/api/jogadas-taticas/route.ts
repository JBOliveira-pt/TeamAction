import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS jogadas_taticas (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            treinador_id    UUID        NOT NULL,
            nome            TEXT        NOT NULL,
            tipo            TEXT        NOT NULL DEFAULT 'Personalizada',
            sistema         TEXT        NOT NULL DEFAULT '6-0',
            posicoes        JSONB       NOT NULL DEFAULT '[]',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_jogadas_taticas_org
            ON jogadas_taticas (organization_id, created_at DESC)
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
        nome: string;
        tipo: string;
        sistema: string;
        posicoes: unknown;
        created_at: string;
    }[]>`
        SELECT id, nome, tipo, sistema, posicoes, created_at
        FROM jogadas_taticas
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

    const body = await req.json() as {
        nome?: string;
        tipo?: string;
        sistema?: string;
        posicoes?: unknown[];
    };

    if (!body.nome?.trim() || body.nome.trim().length < 2)
        return new Response("Nome deve ter pelo menos 2 caracteres.", { status: 400 });
    if (body.nome.trim().length > 80)
        return new Response("Nome não pode ter mais de 80 caracteres.", { status: 400 });

    const tiposValidos = ["Ataque", "Defesa", "Transição", "Bola Parada", "Personalizada"];
    if (!body.tipo || !tiposValidos.includes(body.tipo))
        return new Response("Tipo inválido.", { status: 400 });

    await ensureTable();

    const rows = await sql<{ id: string; nome: string; tipo: string; sistema: string; posicoes: unknown; created_at: string }[]>`
        INSERT INTO jogadas_taticas (organization_id, treinador_id, nome, tipo, sistema, posicoes)
        VALUES (
            ${user.organization_id},
            ${user.id},
            ${body.nome.trim()},
            ${body.tipo},
            ${body.sistema ?? "6-0"},
            ${JSON.stringify(body.posicoes ?? [])}
        )
        RETURNING id, nome, tipo, sistema, posicoes, created_at
    `;

    return Response.json(rows[0], { status: 201 });
}
