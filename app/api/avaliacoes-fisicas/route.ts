import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS avaliacoes_fisicas (
            id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id     UUID        NOT NULL,
            treinador_id        UUID        NOT NULL,
            atleta_id           UUID        NOT NULL,
            data                DATE        NOT NULL,
            velocidade_30m      NUMERIC,
            impulsao_vertical   INTEGER,
            vo2max              NUMERIC,
            forca_kg            NUMERIC,
            observacoes         TEXT,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        atleta_id: string;
        atleta_nome: string;
        data: string;
        velocidade_30m: number | null;
        impulsao_vertical: number | null;
        vo2max: number | null;
        forca_kg: number | null;
        observacoes: string | null;
    }[]>`
        SELECT af.id, af.atleta_id, a.nome AS atleta_nome,
               af.data::text, af.velocidade_30m, af.impulsao_vertical,
               af.vo2max, af.forca_kg, af.observacoes
        FROM avaliacoes_fisicas af
        JOIN atletas a ON a.id = af.atleta_id
        WHERE af.organization_id = ${me.organization_id}
        ORDER BY af.data DESC, a.nome ASC
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
        atleta_id: string;
        data: string;
        velocidade_30m?: number;
        impulsao_vertical?: number;
        vo2max?: number;
        forca_kg?: number;
        observacoes?: string;
    };

    if (!body.atleta_id || !body.data)
        return new Response("atleta_id e data são obrigatórios.", { status: 400 });

    await ensureTable();

    const [avaliacao] = await sql<{ id: string }[]>`
        INSERT INTO avaliacoes_fisicas (
            organization_id, treinador_id, atleta_id, data,
            velocidade_30m, impulsao_vertical, vo2max, forca_kg, observacoes
        )
        VALUES (
            ${me.organization_id},
            ${me.id},
            ${body.atleta_id},
            ${body.data},
            ${body.velocidade_30m ?? null},
            ${body.impulsao_vertical ?? null},
            ${body.vo2max ?? null},
            ${body.forca_kg ?? null},
            ${body.observacoes?.trim() ?? null}
        )
        RETURNING id
    `;

    return Response.json({ id: avaliacao.id }, { status: 201 });
}
