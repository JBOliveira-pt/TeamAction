import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// PUT — atleta menor aceita ou recusa vinculação de responsável
// R5: Se recusar → perfil suspenso + notificação ao admin
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const userRows = await sql<
        { id: string; email: string; organization_id: string | null }[]
    >`
        SELECT id, email, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = userRows[0];
    if (!me) return new Response("Utilizador não encontrado.", { status: 404 });

    const { id } = await params;
    const body = (await req.json()) as { estado: "aceite" | "recusado" };

    if (!["aceite", "recusado"].includes(body.estado))
        return new Response("Estado inválido.", { status: 400 });

    // Buscar o pedido de vinculação
    const pedidoRows = await sql<
        {
            id: string;
            atleta_user_id: string;
            alvo_email: string;
            alvo_responsavel_user_id: string | null;
            status: string;
        }[]
    >`
        SELECT id, atleta_user_id, alvo_email, alvo_responsavel_user_id::text, status
        FROM atleta_relacoes_pendentes
        WHERE id = ${id}
          AND atleta_user_id = ${me.id}
          AND relation_kind = 'responsavel'
        LIMIT 1
    `;
    const pedido = pedidoRows[0];
    if (!pedido) return new Response("Pedido não encontrado.", { status: 404 });
    if (pedido.status !== "pendente")
        return new Response("Pedido já respondido.", { status: 409 });

    if (body.estado === "recusado") {
        // Atualizar pedido para recusado
        await sql`
            UPDATE atleta_relacoes_pendentes
            SET status = 'recusado', updated_at = NOW()
            WHERE id = ${id}
        `;

        // R5: Perfil do menor fica suspenso
        await sql`
            UPDATE atletas
            SET estado = 'Suspenso', updated_at = NOW()
            WHERE user_id = ${me.id}
        `.catch(() => {});

        // Limpar encarregado_educacao
        await sql`
            UPDATE atletas
            SET encarregado_educacao = NULL, updated_at = NOW()
            WHERE user_id = ${me.id}
              AND encarregado_educacao = ${pedido.alvo_email}
        `.catch(() => {});

        // R5: Notificar admin sobre a recusa
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${me.organization_id ?? "00000000-0000-0000-0000-000000000000"},
                'Atleta menor recusou responsável',
                ${`O atleta "${me.email}" recusou a vinculação com o responsável "${pedido.alvo_email}". O perfil do atleta foi suspenso até que um responsável seja associado.`},
                'Alerta',
                false,
                NOW()
            )
        `.catch(() => {});

        // Notificar o responsável sobre a recusa
        if (pedido.alvo_responsavel_user_id) {
            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${me.organization_id ?? "00000000-0000-0000-0000-000000000000"},
                    ${pedido.alvo_responsavel_user_id},
                    'Vinculação recusada pelo atleta',
                    ${`O atleta menor "${me.email}" recusou a sua vinculação como responsável.`},
                    'Aviso',
                    false,
                    NOW()
                )
            `.catch(() => {});
        }

        return Response.json({ ok: true, estado: "recusado" });
    }

    // Aceitar — confirmar vinculação
    await sql`
        UPDATE atleta_relacoes_pendentes
        SET status = 'aceite', updated_at = NOW()
        WHERE id = ${id}
    `;

    // Garantir que encarregado_educacao está preenchido
    await sql`
        UPDATE atletas
        SET encarregado_educacao = ${pedido.alvo_email}, updated_at = NOW()
        WHERE user_id = ${me.id}
    `.catch(() => {});

    // Notificar o responsável
    if (pedido.alvo_responsavel_user_id) {
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${me.organization_id ?? "00000000-0000-0000-0000-000000000000"},
                ${pedido.alvo_responsavel_user_id},
                'Vinculação aceite pelo atleta',
                ${`O atleta menor "${me.email}" aceitou a sua vinculação como responsável.`},
                'Info',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    return Response.json({ ok: true, estado: "aceite" });
}
