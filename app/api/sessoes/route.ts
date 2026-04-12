// Rota API sessoes: listar e criar sessoes de treino da organizacao.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS sessoes (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            treinador_id    UUID,
            criado_por      UUID,
            equipa_id       UUID,
            data            DATE        NOT NULL,
            hora            TIME        NOT NULL DEFAULT '00:00:00',
            tipo            TEXT,
            duracao_min     INTEGER,
            local           TEXT,
            notas           TEXT,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            updated_at      TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_sessoes_org_data
            ON sessoes (organization_id, data DESC)
    `;
    // Migrate existing tables — add missing columns
    await sql`ALTER TABLE sessoes ALTER COLUMN hora SET DEFAULT '00:00:00'`.catch(
        () => {},
    );
    await sql`ALTER TABLE sessoes ADD COLUMN IF NOT EXISTS duracao_min INTEGER`.catch(
        () => {},
    );
    await sql`ALTER TABLE sessoes ADD COLUMN IF NOT EXISTS local TEXT`.catch(
        () => {},
    );
    await sql`ALTER TABLE sessoes ADD COLUMN IF NOT EXISTS notas TEXT`.catch(
        () => {},
    );
    await sql`ALTER TABLE sessoes ADD COLUMN IF NOT EXISTS criado_por UUID`.catch(
        () => {},
    );
}

async function getUser(clerkUserId: string) {
    const rows = await sql<
        { id: string; organization_id: string; account_type: string | null }[]
    >`
        SELECT id, organization_id, account_type FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    await ensureTable();

    const rows = await sql<
        {
            id: string;
            data: string;
            hora: string;
            tipo: string;
            duracao_min: number;
            local: string | null;
            notas: string | null;
            equipa_id: string | null;
            equipa_nome: string | null;
            criado_por_nome: string | null;
            created_at: string;
        }[]
    >`
        SELECT
            s.id,
            s.data,
            s.hora,
            s.tipo,
            s.duracao_min,
            s.local,
            s.notas,
            s.equipa_id,
            e.nome AS equipa_nome,
            u.name AS criado_por_nome,
            s.created_at
        FROM sessoes s
        LEFT JOIN equipas e ON e.id = s.equipa_id
        LEFT JOIN users u ON u.id = s.criado_por
        WHERE s.organization_id = ${user.organization_id}
        ORDER BY s.data DESC, s.hora DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });
    if (!user.organization_id)
        return new Response("Organização não encontrada", { status: 400 });

    const body = await req.json();
    const { data, hora, tipo, duracao_min, local, notas, equipa_id } = body as {
        data?: string;
        hora?: string;
        tipo?: string;
        duracao_min?: number;
        local?: string;
        notas?: string;
        equipa_id?: string;
    };

    const tiposValidos = ["Tático", "Físico", "Técnico", "Misto"];

    if (!data) return new Response("Data obrigatória", { status: 400 });
    if (!hora) return new Response("Hora obrigatória", { status: 400 });
    if (!tipo || !tiposValidos.includes(tipo))
        return new Response("Tipo inválido", { status: 400 });
    if (!duracao_min || duracao_min < 15 || duracao_min > 300)
        return new Response("Duração deve estar entre 15 e 300 minutos", {
            status: 400,
        });

    // Treinador só pode criar sessões para a sua equipa
    if (user.account_type === "treinador" && equipa_id) {
        const equipa = await sql`
            SELECT id FROM equipas WHERE id = ${equipa_id} AND treinador_id = ${user.id}
        `;
        if (equipa.length === 0)
            return new Response("Só pode criar sessões para a sua equipa.", {
                status: 403,
            });
    }

    await ensureTable();

    const rows = await sql<
        {
            id: string;
            data: string;
            hora: string;
            tipo: string;
            duracao_min: number;
            local: string | null;
            notas: string | null;
            created_at: string;
        }[]
    >`
        INSERT INTO sessoes (organization_id, treinador_id, criado_por, equipa_id, data, hora, tipo, duracao_min, local, notas)
        VALUES (
            ${user.organization_id},
            ${user.id},
            ${user.id},
            ${equipa_id ?? null},
            ${data},
            ${hora},
            ${tipo},
            ${duracao_min},
            ${local?.trim() || null},
            ${notas?.trim() || null}
        )
        RETURNING id, data, hora, tipo, duracao_min, local, notas, created_at
    `;

    return Response.json(rows[0], { status: 201 });
}
