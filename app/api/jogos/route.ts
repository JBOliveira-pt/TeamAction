import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

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

    const rows = await sql<
        {
            id: string;
            adversario: string;
            data: string;
            casa_fora: string;
            local: string | null;
            estado: string;
            resultado_nos: number | null;
            resultado_adv: number | null;
            equipa_id: string | null;
            equipa_nome: string | null;
        }[]
    >`
        SELECT
            j.id,
            j.adversario,
            j.data::text,
            j.casa_fora,
            j.local,
            j.estado,
            j.resultado_nos,
            j.resultado_adv,
            j.equipa_id,
            e.nome AS equipa_nome
        FROM jogos j
        LEFT JOIN equipas e ON e.id = j.equipa_id
        WHERE j.organization_id = ${user.organization_id}
        ORDER BY j.data DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });
    if (!user.organization_id)
        return new Response("Utilizador sem organização", { status: 400 });

    const body = (await req.json()) as {
        adversario?: string;
        data?: string;
        casa_fora?: string;
        local?: string;
        equipa_id?: string;
        hora_inicio?: string;
        hora_fim?: string;
    };

    if (!body.adversario?.trim() || body.adversario.trim().length < 2)
        return new Response(
            "Nome do adversário deve ter pelo menos 2 caracteres.",
            { status: 400 },
        );
    if (body.adversario.trim().length > 100)
        return new Response(
            "Nome do adversário não pode ter mais de 100 caracteres.",
            { status: 400 },
        );
    if (!body.data) return new Response("Data é obrigatória.", { status: 400 });

    const dataJogo = new Date(body.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataJogo < hoje)
        return new Response(
            "Não é possível agendar um jogo em data já passada.",
            { status: 400 },
        );

    if (!body.equipa_id)
        return new Response("Equipa é obrigatória.", { status: 400 });

    // Treinador só pode criar jogos para a sua equipa
    if (user.account_type === "treinador") {
        const equipa = await sql`
            SELECT id FROM equipas WHERE id = ${body.equipa_id} AND treinador_id = ${user.id}
        `;
        if (equipa.length === 0)
            return new Response("Só pode criar jogos para a sua equipa.", {
                status: 403,
            });
    }

    const casaFora = body.casa_fora === "fora" ? "fora" : "casa";
    const local = body.local?.trim() || null;
    const equipaId = body.equipa_id;
    const horaInicio = body.hora_inicio || null;
    const horaFim = body.hora_fim || null;

    try {
        const rows = await sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                local: string | null;
                estado: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                equipa_id: string | null;
            }[]
        >`
            INSERT INTO jogos (id, adversario, data, equipa_id, casa_fora, local, hora_inicio, hora_fim, estado, visibilidade_publica, organization_id)
            VALUES (
                gen_random_uuid(),
                ${body.adversario.trim()},
                ${body.data},
                ${equipaId},
                ${casaFora},
                ${local},
                ${horaInicio},
                ${horaFim},
                'agendado',
                false,
                ${user.organization_id}
            )
            RETURNING id, adversario, data::text, equipa_id, casa_fora, local, estado, resultado_nos, resultado_adv
        `;
        return Response.json(rows[0], { status: 201 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[POST /api/jogos]", msg);
        return new Response(msg, { status: 500 });
    }
}
