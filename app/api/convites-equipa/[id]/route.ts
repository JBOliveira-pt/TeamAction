import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Athlete accepts or declines a convite
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ id: string; organization_id: string; name: string }[]>`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const { id } = await params;
    const body = await req.json() as { estado: "aceite" | "recusado" };

    if (!["aceite", "recusado"].includes(body.estado))
        return new Response("Estado inválido.", { status: 400 });

    // Get convite
    const conviteRows = await sql<{
        id: string;
        treinador_id: string;
        atleta_id: string;
        equipa_id: string | null;
        equipa_nome: string | null;
        treinador_nome: string;
        organization_id: string;
        estado: string;
    }[]>`
        SELECT id, treinador_id, atleta_id, equipa_id, equipa_nome, treinador_nome, organization_id, estado
        FROM convites_equipa
        WHERE id = ${id} AND organization_id = ${me.organization_id}
        LIMIT 1
    `;
    const convite = conviteRows[0];
    if (!convite) return new Response("Convite não encontrado.", { status: 404 });
    if (convite.estado !== "pendente") return new Response("Convite já respondido.", { status: 409 });

    // Update convite estado
    await sql`
        UPDATE convites_equipa
        SET estado = ${body.estado}, updated_at = NOW()
        WHERE id = ${id}
    `;

    // If accepted, assign athlete to equipa
    if (body.estado === "aceite" && convite.equipa_id) {
        await sql`
            UPDATE atletas SET equipa_id = ${convite.equipa_id}
            WHERE id = ${convite.atleta_id} AND organization_id = ${me.organization_id}
        `.catch(() => {});
    }

    // Notify the treinador
    const decisao = body.estado === "aceite" ? "aceitou" : "recusou";
    const atletaRows = await sql<{ nome: string }[]>`
        SELECT nome FROM atletas WHERE id = ${convite.atleta_id} LIMIT 1
    `.catch(() => []);
    const atletaNome = atletaRows[0]?.nome ?? "O atleta";

    await sql`
        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
        VALUES (
            gen_random_uuid(),
            ${convite.organization_id},
            ${convite.treinador_id},
            ${`Convite ${body.estado === "aceite" ? "aceite" : "recusado"}`},
            ${`${atletaNome} ${decisao} o convite para a equipa${convite.equipa_nome ? ` "${convite.equipa_nome}"` : ""}.`},
            'convite_equipa',
            false,
            NOW()
        )
    `.catch(() => {});

    return Response.json({ ok: true, estado: body.estado });
}
