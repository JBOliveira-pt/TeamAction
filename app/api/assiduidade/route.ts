import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureColunas() {
    await sql`ALTER TABLE assiduidade ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'P'`;
    await sql`ALTER TABLE assiduidade ADD COLUMN IF NOT EXISTS comentario TEXT`;
}

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

// GET → lista todos os registos de assiduidade da organização
// Devolve: atletas × sessões com estado P/F/J
export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    try {
        await ensureColunas();
    } catch { /* colunas já existem */ }

    // Sessões com registos (últimas 10)
    const sessoes = await sql<{
        id: string;
        data: string;
        tipo: string;
        duracao_min: number;
    }[]>`
        SELECT DISTINCT s.id, s.data, s.tipo, s.duracao_min
        FROM sessoes s
        INNER JOIN assiduidade a ON a.sessao_id = s.id
        WHERE s.organization_id = ${user.organization_id}
        ORDER BY s.data DESC
        LIMIT 10
    `;

    // Atletas da organização
    const atletas = await sql<{
        id: string;
        nome: string;
        posicao: string | null;
        numero_camisola: number | null;
    }[]>`
        SELECT id, nome, posicao, numero_camisola
        FROM atletas
        WHERE organization_id = ${user.organization_id}
            AND estado = 'Ativo'
        ORDER BY nome ASC
    `;

    // Todos os registos de assiduidade para as sessões encontradas
    const registos = await sql<{
        atleta_id: string;
        sessao_id: string;
        estado: string;
        comentario: string | null;
    }[]>`
        SELECT a.atleta_id, a.sessao_id, a.estado, a.comentario
        FROM assiduidade a
        INNER JOIN sessoes s ON s.id = a.sessao_id
        WHERE s.organization_id = ${user.organization_id}
    `;

    return Response.json({ sessoes, atletas, registos });
}

// POST → registar / actualizar assiduidade para uma sessão (bulk upsert)
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const body = await req.json() as {
        sessao_id?: string;
        registos?: { atleta_id: string; estado: string; comentario?: string }[];
    };

    if (!body.sessao_id) return new Response("sessao_id obrigatório", { status: 400 });
    if (!Array.isArray(body.registos) || body.registos.length === 0)
        return new Response("registos obrigatórios", { status: 400 });

    const estadosValidos = ["P", "F", "J"];
    for (const r of body.registos) {
        if (!r.atleta_id) return new Response("atleta_id obrigatório em cada registo", { status: 400 });
        if (!estadosValidos.includes(r.estado)) return new Response("estado deve ser P, F ou J", { status: 400 });
    }

    // Verificar que a sessão pertence à organização
    const sessaoCheck = await sql<{ id: string }[]>`
        SELECT id FROM sessoes WHERE id = ${body.sessao_id} AND organization_id = ${user.organization_id}
    `;
    if (sessaoCheck.length === 0) return new Response("Sessão não encontrada", { status: 404 });

    try {
        await ensureColunas();
    } catch { /* colunas já existem */ }

    // Apagar registos anteriores da sessão e inserir novos
    await sql`DELETE FROM assiduidade WHERE sessao_id = ${body.sessao_id}`;

    for (const r of body.registos) {
        await sql`
            INSERT INTO assiduidade (atleta_id, sessao_id, presente, estado, comentario)
            VALUES (
                ${r.atleta_id},
                ${body.sessao_id},
                ${r.estado === "P"},
                ${r.estado},
                ${r.comentario?.trim() || null}
            )
        `;
    }

    return new Response(null, { status: 204 });
}
