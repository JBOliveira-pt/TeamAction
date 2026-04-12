// Rota API convites-clube: CRUD de convites de clube (presidente envia, utilizador recebe).
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/**
 * GET /api/convites-clube
 *
 * Devolve convites de clube pendentes para o utilizador (como destinatário)
 * OU todos os convites pendentes do clube do presidente (como remetente).
 *
 * Query params:
 *   ?role=presidente  → listar convites enviados por este clube
 *   (default)         → listar convites recebidos pelo utilizador
 */
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<
        { id: string; organization_id: string; account_type: string | null }[]
    >`
        SELECT id, organization_id, account_type
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const role = req.nextUrl.searchParams.get("role");

    if (role === "presidente") {
        // Vista do presidente: todos os convites enviados pelo seu clube
        const rows = await sql`
            SELECT
                cc.id,
                cc.tipo,
                cc.estado,
                cc.created_at::text,
                u.name  AS convidado_nome,
                u.email AS convidado_email,
                u.account_type AS convidado_account_type,
                e.nome  AS equipa_nome
            FROM convites_clube cc
            JOIN users u ON u.id = cc.convidado_user_id
            JOIN equipas e ON e.id = cc.equipa_id
            WHERE cc.clube_org_id = ${me.organization_id}
            ORDER BY cc.created_at DESC
        `;
        return Response.json(rows);
    }

    // Predefinido: convites recebidos pelo utilizador
    const rows = await sql`
        SELECT
            cc.id,
            cc.tipo,
            cc.estado,
            cc.created_at::text,
            c.nome   AS clube_nome,
            e.nome   AS equipa_nome,
            e.desporto,
            sender.name AS convidado_por_nome
        FROM convites_clube cc
        JOIN clubes c ON c.organization_id = cc.clube_org_id
        JOIN equipas e ON e.id = cc.equipa_id
        JOIN users sender ON sender.id = cc.convidado_por
        WHERE cc.convidado_user_id = ${me.id}
          AND cc.estado = 'pendente'
        ORDER BY cc.created_at DESC
    `;

    return Response.json(rows);
}

/**
 * POST /api/convites-clube
 *
 * Presidente envia convite a um utilizador externo (treinador ou atleta)
 * para se juntar à equipa do seu clube.
 *
 * Body: { convidado_user_id: string, tipo: 'treinador' | 'atleta' }
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<
        { id: string; organization_id: string; account_type: string | null }[]
    >`
        SELECT id, organization_id, account_type
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    // Apenas o presidente pode enviar convites de clube
    if (me.account_type !== "presidente") {
        return new Response(
            "Apenas o Presidente pode enviar convites de clube.",
            { status: 403 },
        );
    }

    // Verificar que esta org tem um clube
    const clubeRows = await sql<{ id: string }[]>`
        SELECT id FROM clubes
        WHERE organization_id = ${me.organization_id}
        LIMIT 1
    `;
    if (clubeRows.length === 0) {
        return new Response("Clube não encontrado para esta organização.", {
            status: 404,
        });
    }

    // Obter a equipa do clube (mirror 1:1)
    const equipaRows = await sql<{ id: string; nome: string }[]>`
        SELECT id, nome FROM equipas
        WHERE organization_id = ${me.organization_id}
        LIMIT 1
    `;
    if (equipaRows.length === 0) {
        return new Response("Equipa do clube não encontrada.", { status: 404 });
    }
    const equipa = equipaRows[0];

    const body = (await req.json()) as {
        convidado_user_id: string;
        tipo: "treinador" | "atleta";
    };

    if (
        !body.convidado_user_id ||
        !["treinador", "atleta"].includes(body.tipo)
    ) {
        return new Response(
            "Campos obrigatórios: convidado_user_id e tipo (treinador/atleta).",
            { status: 400 },
        );
    }

    // Verificar que o utilizador convidado existe e corresponde ao account_type esperado
    const convidadoRows = await sql<
        {
            id: string;
            name: string;
            organization_id: string;
            account_type: string | null;
        }[]
    >`
        SELECT id, name, organization_id, account_type
        FROM users
        WHERE id = ${body.convidado_user_id}
        LIMIT 1
    `;
    const convidado = convidadoRows[0];
    if (!convidado) {
        return new Response("Utilizador convidado não encontrado.", {
            status: 404,
        });
    }

    if (convidado.organization_id === me.organization_id) {
        return new Response("Este utilizador já pertence ao seu clube.", {
            status: 409,
        });
    }

    if (convidado.account_type !== body.tipo) {
        return new Response(
            `O utilizador selecionado não é ${body.tipo === "treinador" ? "um treinador" : "um atleta"}.`,
            { status: 400 },
        );
    }

    // Para treinador: verificar se a equipa já tem treinador ou convite pendente
    if (body.tipo === "treinador") {
        const existingTrainer = await sql<{ treinador_id: string | null }[]>`
            SELECT treinador_id FROM equipas
            WHERE id = ${equipa.id}
        `;
        if (existingTrainer[0]?.treinador_id) {
            return new Response("A equipa já tem um treinador atribuído.", {
                status: 409,
            });
        }

        const pendingTrainerInvite = await sql<{ id: string }[]>`
            SELECT id FROM convites_clube
            WHERE equipa_id = ${equipa.id}
              AND tipo = 'treinador'
              AND estado = 'pendente'
            LIMIT 1
        `;
        if (pendingTrainerInvite.length > 0) {
            return new Response(
                "Já existe um convite pendente para treinador nesta equipa.",
                { status: 409 },
            );
        }
    }

    // Verificar se já existe convite pendente para este utilizador
    const existingInvite = await sql<{ id: string }[]>`
        SELECT id FROM convites_clube
        WHERE convidado_user_id = ${body.convidado_user_id}
          AND clube_org_id = ${me.organization_id}
          AND estado = 'pendente'
        LIMIT 1
    `;
    if (existingInvite.length > 0) {
        return new Response(
            "Já existe um convite pendente para este utilizador.",
            { status: 409 },
        );
    }

    // Criar o convite
    const [convite] = await sql<{ id: string }[]>`
        INSERT INTO convites_clube (
            clube_org_id, equipa_id, convidado_user_id, tipo, convidado_por
        )
        VALUES (
            ${me.organization_id},
            ${equipa.id},
            ${body.convidado_user_id},
            ${body.tipo},
            ${me.id}
        )
        RETURNING id
    `;

    // Criar notificação para o utilizador convidado
    const tipoLabel = body.tipo === "treinador" ? "treinador" : "atleta";
    await sql`
        INSERT INTO notificacoes (
            id, organization_id, recipient_user_id,
            titulo, descricao, tipo, lida, created_at
        )
        VALUES (
            gen_random_uuid(),
            ${convidado.organization_id},
            ${body.convidado_user_id},
            ${"Convite de clube"},
            ${`O clube "${equipa.nome}" convidou-o para se juntar como ${tipoLabel}. Aceda aos seus convites para responder.`},
            'convite_clube',
            false,
            NOW()
        )
    `.catch(() => {});

    return Response.json(
        { id: convite.id, convidado_nome: convidado.name, tipo: body.tipo },
        { status: 201 },
    );
}
