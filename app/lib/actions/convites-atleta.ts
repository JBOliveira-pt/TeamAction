"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function responderConviteEquipaAtleta(
    conviteId: string,
    decisao: "aceitar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const [user] = await sql<{ id: string; organization_id: string | null }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!user) return { error: "Utilizador não encontrado." };

    const [atleta] = await sql<{ id: string }[]>`
        SELECT id FROM atletas WHERE user_id = ${user.id} LIMIT 1
    `;
    if (!atleta) return { error: "Perfil de atleta não encontrado." };

    const [convite] = await sql<
        {
            id: string;
            equipa_id: string | null;
            treinador_nome: string;
            organization_id: string;
        }[]
    >`
        SELECT id, equipa_id, treinador_nome, organization_id
        FROM convites_equipa
        WHERE id = ${conviteId}
          AND atleta_id = ${atleta.id}
          AND estado = 'pendente'
        LIMIT 1
    `;
    if (!convite) return { error: "Convite não encontrado ou já respondido." };

    const novoEstado = decisao === "aceitar" ? "aceite" : "recusado";

    await sql`
        UPDATE convites_equipa SET estado = ${novoEstado}, updated_at = NOW()
        WHERE id = ${conviteId}
    `;

    if (decisao === "aceitar") {
        // Atualizar organization_id e equipa do atleta para a org do convite
        if (convite.equipa_id) {
            await sql`
                UPDATE atletas
                SET organization_id = ${convite.organization_id},
                    equipa_id = ${convite.equipa_id},
                    estado = 'Ativo',
                    updated_at = NOW()
                WHERE id = ${atleta.id}
            `.catch(() => {});
        } else {
            await sql`
                UPDATE atletas
                SET organization_id = ${convite.organization_id},
                    estado = 'Ativo',
                    updated_at = NOW()
                WHERE id = ${atleta.id}
            `.catch(() => {});
        }

        // Atualizar organization_id do user para ficar na mesma org do treinador
        await sql`
            UPDATE users
            SET organization_id = ${convite.organization_id},
                updated_at = NOW()
            WHERE id = ${user.id}
        `.catch(() => {});
    }

    revalidatePath("/dashboard/atleta/autorizacoes");
    return null;
}

export async function responderConviteClubeAtleta(
    relacaoId: string,
    decisao: "aceitar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!user) return { error: "Utilizador não encontrado." };

    const [relacao] = await sql<
        {
            id: string;
            alvo_clube_id: string;
            alvo_equipa_id: string | null;
            alvo_nome: string;
        }[]
    >`
        SELECT id, alvo_clube_id::text, alvo_equipa_id::text, alvo_nome
        FROM atleta_relacoes_pendentes
        WHERE id = ${relacaoId}
          AND atleta_user_id = ${user.id}
          AND relation_kind = 'clube'
          AND status = 'pendente'
        LIMIT 1
    `;
    if (!relacao) return { error: "Convite não encontrado ou já respondido." };

    if (decisao === "rejeitar") {
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'recusado', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;
    } else {
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'aceite', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;

        await sql`
            UPDATE users SET organization_id = ${relacao.alvo_clube_id}, updated_at = NOW()
            WHERE id = ${user.id}
        `.catch(() => {});

        await sql`
            UPDATE atletas
            SET organization_id = ${relacao.alvo_clube_id},
                equipa_id = ${relacao.alvo_equipa_id ?? null},
                estado = 'Ativo',
                updated_at = NOW()
            WHERE user_id = ${user.id}
        `.catch(() => {});
    }

    revalidatePath("/dashboard/atleta/autorizacoes");
    return null;
}

export async function responderConviteTreinadorAtleta(
    relacaoId: string,
    decisao: "aceitar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!user) return { error: "Utilizador não encontrado." };

    const [relacao] = await sql<
        {
            id: string;
            alvo_treinador_user_id: string | null;
            alvo_nome: string;
        }[]
    >`
        SELECT id, alvo_treinador_user_id::text, alvo_nome
        FROM atleta_relacoes_pendentes
        WHERE id = ${relacaoId}
          AND atleta_user_id = ${user.id}
          AND relation_kind = 'treinador'
          AND status = 'pendente'
        LIMIT 1
    `;
    if (!relacao) return { error: "Convite não encontrado ou já respondido." };

    if (decisao === "rejeitar") {
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'recusado', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;
    } else {
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'aceite', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;

        // Se o treinador tem uma organização, mover o atleta para lá
        if (relacao.alvo_treinador_user_id) {
            const [treinadorUser] = await sql<
                { organization_id: string | null }[]
            >`
                SELECT organization_id FROM users
                WHERE id = ${relacao.alvo_treinador_user_id}
                LIMIT 1
            `.catch(() => []);

            if (treinadorUser?.organization_id) {
                await sql`
                    UPDATE users
                    SET organization_id = ${treinadorUser.organization_id},
                        updated_at = NOW()
                    WHERE id = ${user.id}
                `.catch(() => {});

                await sql`
                    UPDATE atletas
                    SET organization_id = ${treinadorUser.organization_id},
                        estado = 'Ativo',
                        updated_at = NOW()
                    WHERE user_id = ${user.id}
                `.catch(() => {});
            }
        }
    }

    revalidatePath("/dashboard/atleta/autorizacoes");
    return null;
}
