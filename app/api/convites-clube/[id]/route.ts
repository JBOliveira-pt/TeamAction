import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/**
 * PUT /api/convites-clube/[id]
 *
 * Accept or reject a club invite.
 *
 * Body: { estado: 'aceite' | 'recusado' }
 *
 * When accepted:
 * - Treinador: assigned as equipa.treinador_id on the club's equipa
 * - Atleta: atletas record moved to club org/equipa, user.organization_id updated
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const userRows = await sql<
        { id: string; organization_id: string; account_type: string | null }[]
    >`
        SELECT id, organization_id, account_type
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;
    const me = userRows[0];
    if (!me) return new Response("Utilizador não encontrado.", { status: 404 });

    const { id } = await params;
    const body = (await req.json()) as { estado: "aceite" | "recusado" };

    if (!["aceite", "recusado"].includes(body.estado)) {
        return new Response("Estado inválido. Use 'aceite' ou 'recusado'.", {
            status: 400,
        });
    }

    // Fetch the invite
    const conviteRows = await sql<
        {
            id: string;
            clube_org_id: string;
            equipa_id: string;
            convidado_user_id: string;
            tipo: string;
            estado: string;
        }[]
    >`
        SELECT id, clube_org_id, equipa_id, convidado_user_id, tipo, estado
        FROM convites_clube
        WHERE id = ${id}
          AND convidado_user_id = ${me.id}
        LIMIT 1
    `;
    const convite = conviteRows[0];
    if (!convite)
        return new Response("Convite não encontrado.", { status: 404 });
    if (convite.estado !== "pendente")
        return new Response("Convite já respondido.", { status: 409 });

    // Reject
    if (body.estado === "recusado") {
        await sql`
            UPDATE convites_clube
            SET estado = 'recusado', updated_at = NOW()
            WHERE id = ${id}
        `;
        return Response.json({ ok: true, estado: "recusado" });
    }

    // Accept
    await sql`
        UPDATE convites_clube
        SET estado = 'aceite', updated_at = NOW()
        WHERE id = ${id}
    `;

    if (convite.tipo === "treinador") {
        // Buscar a equipa atual do treinador (antes de mover) para encontrar atletas
        const equipaAntigaRows = await sql<{ id: string }[]>`
            SELECT id FROM equipas
            WHERE organization_id = ${me.organization_id}
              AND treinador_id = ${me.id}
            LIMIT 1
        `.catch(() => []);
        const equipaAntigaId = equipaAntigaRows[0]?.id;

        // Assign as trainer on the club's equipa
        await sql`
            UPDATE equipas
            SET treinador_id = ${me.id}, updated_at = NOW()
            WHERE id = ${convite.equipa_id}
        `;

        // Move user to the club's organization
        await sql`
            UPDATE users
            SET organization_id = ${convite.clube_org_id}, updated_at = NOW()
            WHERE id = ${me.id}
        `;

        // Update equipa in the trainer's old organization (remove trainer ref if any)
        await sql`
            UPDATE equipas
            SET treinador_id = NULL, updated_at = NOW()
            WHERE organization_id = ${me.organization_id}
              AND treinador_id = ${me.id}
        `.catch(() => {});

        // N2: Enviar pedido de federação a todos os atletas da equipa antiga
        if (equipaAntigaId) {
            const atletasDaEquipa = await sql<
                { user_id: string; nome: string }[]
            >`
                SELECT user_id, nome FROM atletas
                WHERE equipa_id = ${equipaAntigaId} AND user_id IS NOT NULL
            `.catch(() => []);

            // Buscar nome do clube de destino
            const clubeNomeRows = await sql<{ nome: string }[]>`
                SELECT nome FROM clubes WHERE organization_id = ${convite.clube_org_id} LIMIT 1
            `.catch(() => []);
            const clubeDestNome = clubeNomeRows[0]?.nome ?? "Clube";

            for (const atleta of atletasDaEquipa) {
                // Criar relação pendente de tipo 'clube' para cada atleta
                await sql`
                    INSERT INTO atleta_relacoes_pendentes (
                        id, atleta_user_id, relation_kind, status,
                        alvo_clube_id, alvo_equipa_id, alvo_nome,
                        created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), ${atleta.user_id}, 'clube', 'pendente',
                        ${convite.clube_org_id}, ${convite.equipa_id}, ${clubeDestNome},
                        NOW(), NOW()
                    )
                `.catch(() => {});

                // Notificar o atleta
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${me.organization_id},
                        ${atleta.user_id},
                        'Pedido de Federação — O teu treinador juntou-se a um clube',
                        ${`O treinador entrou no clube "${clubeDestNome}". Para continuares vinculado ao treinador, aceita o convite de federação. Caso recuses, serás desvinculado da equipa.`},
                        'federacao_clube',
                        false,
                        NOW()
                    )
                `.catch(() => {});
            }
        }
    }

    if (convite.tipo === "atleta") {
        // Move user to the club's organization
        await sql`
            UPDATE users
            SET organization_id = ${convite.clube_org_id}, updated_at = NOW()
            WHERE id = ${me.id}
        `;

        // Move atleta record to club org + equipa
        await sql`
            UPDATE atletas
            SET organization_id = ${convite.clube_org_id},
                equipa_id = ${convite.equipa_id},
                updated_at = NOW()
            WHERE user_id = ${me.id}
        `.catch(() => {});
    }

    // Cancel any other pending invites for this user
    await sql`
        UPDATE convites_clube
        SET estado = 'recusado', updated_at = NOW()
        WHERE convidado_user_id = ${me.id}
          AND estado = 'pendente'
          AND id != ${id}
    `.catch(() => {});

    // Notify the club presidente
    const clubeNomeRows = await sql<{ nome: string }[]>`
        SELECT nome FROM equipas WHERE id = ${convite.equipa_id} LIMIT 1
    `;
    const clubeNome = clubeNomeRows[0]?.nome ?? "Clube";
    const tipoLabel = convite.tipo === "treinador" ? "treinador" : "atleta";

    await sql`
        INSERT INTO notificacoes (
            id, organization_id, titulo, descricao, tipo, lida, created_at
        )
        VALUES (
            gen_random_uuid(),
            ${convite.clube_org_id},
            ${"Convite aceite"},
            ${`O ${tipoLabel} "${me.id}" aceitou o convite para se juntar ao "${clubeNome}".`},
            'Info',
            false,
            NOW()
        )
    `.catch(() => {});

    return Response.json({ ok: true, estado: "aceite" });
}
