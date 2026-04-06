"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ========================================
// Staff Actions (Modal)
// ========================================

const FUNCOES_TREINADOR = ["Treinador Principal", "Treinador Adjunto"];

export async function adicionarMembro(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organização." };
    }

    if (!organizationId) return { error: "Organização não encontrada." };

    const nome = formData.get("nome")?.toString().trim();
    const funcao = formData.get("funcao")?.toString() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const userIdStaff = formData.get("userid")?.toString().trim() || null;
    const treinadorMode = formData.get("treinador_mode")?.toString() || null;
    const treinadorEmailFake =
        formData.get("treinador_email_fake")?.toString().trim() || null;

    if (!nome) return { error: "Nome é obrigatório." };
    if (!funcao) return { error: "Função é obrigatória." };

    const isTreinador = FUNCOES_TREINADOR.includes(funcao);

    // Validação: treinadores reais devem ter user_id
    if (isTreinador && treinadorMode === "real" && !userIdStaff) {
        return {
            error: "É obrigatório selecionar um utilizador da plataforma para treinadores reais.",
        };
    }

    // Validação: unicidade de Treinador Principal e Treinador Adjunto por equipa
    if (isTreinador && equipaId) {
        const [jaExiste] = await sql<{ id: string }[]>`
            SELECT id FROM staff
            WHERE equipa_id = ${equipaId}
              AND funcao = ${funcao}
              AND organization_id = ${organizationId}
            LIMIT 1
        `;
        if (jaExiste) {
            return {
                error: `Esta equipa já tem um ${funcao}. Remove o atual antes de adicionar outro.`,
            };
        }
    }

    try {
        const resolvedUserId =
            isTreinador && treinadorMode === "real" ? userIdStaff : null;

        await sql`
            INSERT INTO staff (id, nome, funcao, equipa_id, user_id, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${nome}, ${funcao}, ${equipaId}, ${resolvedUserId}, ${organizationId}, NOW(), NOW())
        `;

        // Se treinador fake com email, verificar existência e criar convite/notificação
        if (isTreinador && treinadorMode === "fake" && treinadorEmailFake) {
            const [existingUser] = await sql<
                { id: string; name: string; account_type: string | null }[]
            >`
                SELECT id, name, account_type FROM users
                WHERE email = ${treinadorEmailFake}
                  AND account_type = 'treinador'
                LIMIT 1
            `;

            if (existingUser) {
                // Treinador existe — criar convite de vinculação ao clube
                await sql`
                    INSERT INTO convites_clube (id, clube_id, clube_org_id, convidado_user_id, tipo, estado, created_at, updated_at)
                    SELECT gen_random_uuid(), c.id, c.organization_id, ${existingUser.id}, 'treinador', 'pendente', NOW(), NOW()
                    FROM clubes c WHERE c.organization_id = ${organizationId} LIMIT 1
                `;
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${existingUser.id},
                        ${existingUser.id},
                        'Convite para clube',
                        ${`Foste convidado para ser ${funcao} no clube.`},
                        'convite_clube',
                        false,
                        NOW()
                    )
                `;
            } else {
                // Treinador não existe — notificar admin
                await sql`
                    INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${organizationId},
                        'Treinador não encontrado na plataforma',
                        ${`O presidente tentou associar o treinador "${nome}" (${treinadorEmailFake}) como ${funcao}, mas o email não está registado. É necessário enviar convite manualmente.`},
                        'Alerta',
                        NOW()
                    )
                `;
            }
        }

        // Buscar nome da equipa para a notificação
        let equipaNome = "sem equipa";
        if (equipaId) {
            const equipaResult = await sql<{ nome: string }[]>`
                SELECT nome FROM equipas WHERE id = ${equipaId}
            `;
            equipaNome = equipaResult[0]?.nome ?? "sem equipa";
        }

        // Notificação automática
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo membro de staff adicionado',
                ${`${nome} foi adicionado como ${funcao}${equipaId ? ` na equipa ${equipaNome}` : ""}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao adicionar membro de staff." };
    }

    await logAction(userId, "staff_add", "/dashboard/presidente/staff", {
        nome,
        funcao,
        equipaId,
        userIdStaff,
    });
    revalidatePath("/dashboard/presidente/staff");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

export async function editarMembro(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }
    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const id = formData.get("id")?.toString();
    const nome = formData.get("nome")?.toString().trim();
    const funcao = formData.get("funcao")?.toString() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const userIdStaff = formData.get("userid")?.toString().trim() || null;

    if (!id) return { error: "ID do membro em falta." };
    if (!nome) return { error: "Nome é obrigatório." };
    if (!funcao) return { error: "Função é obrigatória." };

    const isTreinador = FUNCOES_TREINADOR.includes(funcao);

    // Validação: unicidade de Treinador Principal e Treinador Adjunto por equipa
    if (isTreinador && equipaId) {
        const [jaExiste] = await sql<{ id: string }[]>`
            SELECT id FROM staff
            WHERE equipa_id = ${equipaId}
              AND funcao = ${funcao}
              AND organization_id = ${organizationId}
              AND id != ${id}
            LIMIT 1
        `;
        if (jaExiste) {
            return {
                error: `Esta equipa já tem um ${funcao}. Remove o atual antes de adicionar outro.`,
            };
        }
    }

    const resolvedUserId = isTreinador ? userIdStaff : null;

    try {
        await sql`
            UPDATE staff SET
                nome      = ${nome},
                funcao    = ${funcao},
                equipa_id = ${equipaId},
                user_id   = ${resolvedUserId}
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao editar membro." };
    }

    revalidatePath("/dashboard/presidente/staff");
    return { success: true };
}

export async function removerMembro(id: string): Promise<void> {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
      SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organização.");
    }
    if (!organizationId) throw new Error("Organização não encontrada.");

    try {
        await sql`DELETE FROM staff WHERE id = ${id} AND organization_id = ${organizationId}`;
    } catch (error) {
        console.error(error);
        throw new Error("Erro ao remover membro.");
    }

    revalidatePath("/dashboard/presidente/staff");
}
