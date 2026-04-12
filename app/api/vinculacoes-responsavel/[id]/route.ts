// Rota API vinculacoes-responsavel/[id]: atleta menor aceita ou recusa vinculacao de responsavel.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";
import { sendResponsibleInviteEmail } from "@/app/lib/send-responsible-invite";

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
    const body = (await req.json()) as {
        estado: "aceite" | "recusado";
        novoEmail?: string;
    };

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
        // Novo email é OBRIGATÓRIO ao recusar
        const novoEmail = body.novoEmail?.trim().toLowerCase();
        if (!novoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail))
            return new Response(
                "É obrigatório indicar um novo e-mail de responsável válido.",
                { status: 400 },
            );

        if (novoEmail === pedido.alvo_email.toLowerCase())
            return new Response(
                "O novo e-mail deve ser diferente do responsável recusado.",
                { status: 400 },
            );

        // Atualizar pedido para recusado
        await sql`
            UPDATE atleta_relacoes_pendentes
            SET status = 'recusado', updated_at = NOW()
            WHERE id = ${id}
        `;

        // Atualizar encarregado_educacao com o novo email
        await sql`
            UPDATE atletas
            SET encarregado_educacao = ${novoEmail}, updated_at = NOW()
            WHERE user_id = ${me.id}
        `.catch(() => {});

        // Criar nova relação pendente para o novo responsável
        await sql`
            INSERT INTO atleta_relacoes_pendentes (
                id, atleta_user_id, relation_kind, status,
                alvo_email, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), ${me.id}, 'responsavel', 'pendente',
                ${novoEmail}, NOW(), NOW()
            )
            ON CONFLICT DO NOTHING
        `;

        // Obter nome do atleta para o email
        const atletaRows = await sql<{ nome: string }[]>`
            SELECT nome FROM atletas WHERE user_id = ${me.id} LIMIT 1
        `.catch(() => []);
        const atletaNome = atletaRows[0]?.nome ?? me.email;

        // Enviar convite por email ao novo responsável
        try {
            await sendResponsibleInviteEmail(me.id, atletaNome, novoEmail);
        } catch (inviteErr) {
            console.error(
                "[VINCULACAO] Erro ao enviar convite ao novo responsável:",
                inviteErr,
            );
        }

        // Notificar admin sobre a recusa + novo responsável indicado
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${me.organization_id ?? "00000000-0000-0000-0000-000000000000"},
                'Atleta menor recusou responsável',
                ${`O atleta "${me.email}" recusou a vinculação com "${pedido.alvo_email}" e indicou um novo responsável: "${novoEmail}". O perfil do atleta permanece limitado até o novo responsável criar sua conta.`},
                'Alerta',
                false,
                NOW()
            )
        `.catch(() => {});

        // Notificar o responsável recusado
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
