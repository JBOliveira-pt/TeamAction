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

    // Find the game and its mirror to collect events from both sides
    const jogo = await sql<
        { id: string; organization_id: string; mirror_game_id: string | null }[]
    >`
        SELECT id, organization_id, mirror_game_id FROM jogos WHERE id = ${jogoId} LIMIT 1
    `;
    if (jogo.length === 0) return Response.json([]);

    const gameOrgId = jogo[0].organization_id;
    const mirrorId = jogo[0].mirror_game_id;

    // User must own this game OR it must be the mirror of one they own
    const ownsGame = gameOrgId === me.organization_id;
    const ownsMirror = mirrorId
        ? (
              await sql<
                  { organization_id: string }[]
              >`SELECT organization_id FROM jogos WHERE id = ${mirrorId} LIMIT 1`
          )[0]?.organization_id === me.organization_id
        : false;
    if (!ownsGame && !ownsMirror) return Response.json([]);

    // Collect events from this game's org AND from the mirror game's org
    const jogoIds = [jogoId];
    if (mirrorId) jogoIds.push(mirrorId);

    const rows = await sql<
        {
            id: string;
            jogo_id: string;
            atleta_id: string | null;
            atleta_nome: string | null;
            tipo: string;
            minuto: number | null;
            observacoes: string | null;
            created_at: string;
            source_org_id: string;
        }[]
    >`
        SELECT e.id, e.jogo_id, e.atleta_id, a.nome AS atleta_nome,
               e.tipo, e.minuto, e.observacoes, e.created_at::text,
               e.organization_id AS source_org_id
        FROM eventos_jogo e
        LEFT JOIN atletas a ON a.id = e.atleta_id
        WHERE e.jogo_id = ANY(${jogoIds})
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

    const body = (await req.json()) as {
        jogo_id: string;
        atleta_id?: string;
        tipo: string;
        minuto?: number;
        observacoes?: string;
    };

    if (!body.jogo_id || !body.tipo)
        return new Response("jogo_id e tipo são obrigatórios.", {
            status: 400,
        });

    const tiposValidos = [
        "Golo Feito",
        "Golo Sofrido",
        "Assistência",
        "Falta",
        "Cartão Amarelo",
        "Cartão Vermelho",
        "Substituição",
    ];
    if (!tiposValidos.includes(body.tipo))
        return new Response("Tipo inválido.", { status: 400 });

    // Verify the user owns this game
    const jogo = await sql<
        { id: string; organization_id: string; mirror_game_id: string | null }[]
    >`
        SELECT id, organization_id, mirror_game_id FROM jogos WHERE id = ${body.jogo_id} LIMIT 1
    `;
    if (jogo.length === 0)
        return new Response("Jogo não encontrado.", { status: 404 });
    if (jogo[0].organization_id !== me.organization_id)
        return new Response(
            "Só pode registar eventos em jogos criados por si.",
            { status: 403 },
        );

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

    // Sync to mirror game: invert Golo Feito <-> Golo Sofrido for the other org
    const mirrorGameId = jogo[0].mirror_game_id;
    if (mirrorGameId) {
        const mirrorGame = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM jogos WHERE id = ${mirrorGameId} LIMIT 1
        `;
        if (mirrorGame.length > 0) {
            let mirrorTipo = body.tipo;
            if (body.tipo === "Golo Feito") mirrorTipo = "Golo Sofrido";
            else if (body.tipo === "Golo Sofrido") mirrorTipo = "Golo Feito";

            await sql`
                INSERT INTO eventos_jogo (organization_id, jogo_id, atleta_id, tipo, minuto, observacoes)
                VALUES (
                    ${mirrorGame[0].organization_id},
                    ${mirrorGameId},
                    ${body.atleta_id ?? null},
                    ${mirrorTipo},
                    ${body.minuto ?? null},
                    ${body.observacoes?.trim() ?? null}
                )
            `;
        }
    }

    return Response.json({ id: evento.id }, { status: 201 });
}
