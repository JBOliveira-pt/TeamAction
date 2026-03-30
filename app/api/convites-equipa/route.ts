import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS convites_equipa (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            treinador_id    UUID        NOT NULL,
            treinador_nome  TEXT        NOT NULL,
            atleta_id       UUID        NOT NULL,
            equipa_id       UUID,
            equipa_nome     TEXT,
            estado          TEXT        NOT NULL DEFAULT 'pendente',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        treinador_nome: string;
        atleta_id: string;
        atleta_nome: string;
        equipa_nome: string | null;
        estado: string;
        created_at: string;
    }[]>`
        SELECT c.id, c.treinador_nome, c.atleta_id,
               a.nome AS atleta_nome, c.equipa_nome, c.estado, c.created_at::text
        FROM convites_equipa c
        JOIN atletas a ON a.id = c.atleta_id
        WHERE c.organization_id = ${me.organization_id}
          AND c.estado = 'pendente'
        ORDER BY c.created_at DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ id: string; organization_id: string; name: string }[]>`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const body = await req.json() as {
        atleta_id: string;
        equipa_id?: string;
        equipa_nome?: string;
    };

    if (!body.atleta_id) return new Response("atleta_id obrigatório.", { status: 400 });

    // Get atleta info
    const atletaRows = await sql<{ id: string; nome: string; user_id: string | null }[]>`
        SELECT id, nome, user_id FROM atletas
        WHERE id = ${body.atleta_id} LIMIT 1
    `;
    const atleta = atletaRows[0];
    if (!atleta) return new Response("Atleta não encontrado.", { status: 404 });

    await ensureTable();

    // Check if already has a pending invite
    const existing = await sql<{ id: string }[]>`
        SELECT id FROM convites_equipa
        WHERE atleta_id = ${body.atleta_id}
          AND organization_id = ${me.organization_id}
          AND estado = 'pendente'
        LIMIT 1
    `;
    if (existing.length > 0)
        return new Response("Já existe um convite pendente para este atleta.", { status: 409 });

    const equipaId = body.equipa_id || null;
    const equipaNome = body.equipa_nome?.trim() || null;

    const [convite] = await sql<{ id: string }[]>`
        INSERT INTO convites_equipa (organization_id, treinador_id, treinador_nome, atleta_id, equipa_id, equipa_nome)
        VALUES (${me.organization_id}, ${me.id}, ${me.name}, ${body.atleta_id}, ${equipaId}, ${equipaNome})
        RETURNING id
    `;

    // Create targeted notification for the athlete (if they have a user account)
    if (atleta.user_id) {
        const titulo = `Convite para a equipa${equipaNome ? ` ${equipaNome}` : ""}`;
        const descricao = `Parabéns! O treinador "${me.name}" quer que se junte à equipa${equipaNome ? ` "${equipaNome}"` : ""} como atleta!`;

        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${me.organization_id},
                ${atleta.user_id},
                ${titulo},
                ${descricao},
                'convite_equipa',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    return Response.json({ id: convite.id, atleta_nome: atleta.nome }, { status: 201 });
}
