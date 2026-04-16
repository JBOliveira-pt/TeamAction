// Actions de staff: adicionar, editar, remover e suspender membros.
"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isEscalaoPermitido } from "@/app/lib/grau-escalao-compat";

const FUNCOES_TREINADOR = ["Treinador Principal", "Treinador Adjunto"];

export async function verificarConvitePendenteTreinador(
    targetUserId: string,
): Promise<{ pendente: boolean; funcao?: string; equipa_nome?: string }> {
    const { userId } = await auth();
    if (!userId) return { pendente: false };

    const [me] = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
    `;
    if (!me?.organization_id) return { pendente: false };

    const [row] = await sql<{ funcao: string; equipa_nome: string | null }[]>`
        SELECT s.funcao, e.nome AS equipa_nome
        FROM staff s
        LEFT JOIN equipas e ON e.id = s.equipa_id
        WHERE s.user_id = ${targetUserId}
          AND s.organization_id = ${me.organization_id}
          AND s.estado = 'pendente'
        LIMIT 1
    `;
    if (row) {
        return {
            pendente: true,
            funcao: row.funcao,
            equipa_nome: row.equipa_nome ?? undefined,
        };
    }
    return { pendente: false };
}

export async function adicionarMembro(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    let organizationId: string | undefined;
    let presidenteDbId: string | undefined;
    try {
        const user = await sql<
            { id: string; organization_id: string }[]
        >`SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
        presidenteDbId = user[0]?.id;
    } catch {
        return { error: "Erro ao obter organização." };
    }

    if (!organizationId || !presidenteDbId)
        return { error: "Organização não encontrada." };

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

    // Validação: impedir convite duplicado para o mesmo treinador real na organização
    if (isTreinador && treinadorMode === "real" && userIdStaff) {
        const [jaPendente] = await sql<{ id: string }[]>`
            SELECT id FROM staff
            WHERE user_id = ${userIdStaff}
              AND organization_id = ${organizationId}
              AND estado = 'pendente'
            LIMIT 1
        `;
        if (jaPendente) {
            return {
                error: "Já existe um convite pendente para este treinador neste clube.",
            };
        }
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

    // Validação: compatibilidade grau técnico ↔ escalão da equipa (treinadores reais)
    if (isTreinador && treinadorMode === "real" && userIdStaff && equipaId) {
        const [grauRow] = await sql<{ grau_id: number }[]>`
            SELECT gt.id AS grau_id
            FROM user_cursos uc
            JOIN cursos c ON c.id = uc.curso_id
            JOIN graus_tecnicos gt ON gt.id = c.level_id
            WHERE uc.user_id = ${userIdStaff}
            ORDER BY gt.id DESC
            LIMIT 1
        `;
        if (grauRow) {
            const [equipaRow] = await sql<{ escalao: string }[]>`
                SELECT escalao FROM equipas WHERE id = ${equipaId}
            `;
            if (
                equipaRow &&
                !isEscalaoPermitido(grauRow.grau_id, equipaRow.escalao)
            ) {
                return {
                    error: `O grau técnico deste treinador não permite treinar no escalão ${equipaRow.escalao}.`,
                };
            }
        } else if (funcao === "Treinador Principal") {
            // Treinador sem curso registado não pode ser Treinador Principal
            return {
                error: "Treinadores sem curso registado só podem ser adicionados como Treinador Adjunto.",
            };
        }
    }

    try {
        const resolvedUserId =
            isTreinador && treinadorMode === "real" ? userIdStaff : null;

        // Estado: treinadores reais (convite interno) e fake com email (convite externo) = 'pendente'
        // Treinadores fictícios puros (sem email) e não-treinadores = 'ativo'
        const estado =
            isTreinador && treinadorMode === "real"
                ? "pendente"
                : isTreinador && treinadorMode === "fake" && treinadorEmailFake
                  ? "pendente"
                  : "ativo";

        // grau_tecnico_id — apenas para treinadores fictícios
        const grauTecnicoId =
            isTreinador && treinadorMode === "fake"
                ? parseInt(
                      formData.get("grau_tecnico_id")?.toString() ?? "",
                      10,
                  ) || null
                : null;

        await sql`
            INSERT INTO staff (id, nome, funcao, equipa_id, user_id, organization_id, estado, grau_tecnico_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${nome}, ${funcao}, ${equipaId}, ${resolvedUserId}, ${organizationId}, ${estado}, ${grauTecnicoId}, NOW(), NOW())
        `;

        // Se treinador real, criar convite_clube + notificação pessoal
        if (
            isTreinador &&
            treinadorMode === "real" &&
            userIdStaff &&
            equipaId
        ) {
            // Buscar clube da organização
            const [clube] = await sql<
                { id: string; organization_id: string }[]
            >`
                SELECT id, organization_id FROM clubes
                WHERE organization_id = ${organizationId} LIMIT 1
            `;

            if (clube) {
                await sql`
                    INSERT INTO convites_clube (id, clube_org_id, convidado_user_id, convidado_por, equipa_id, tipo, estado, created_at, updated_at)
                    VALUES (gen_random_uuid(), ${clube.organization_id}, ${userIdStaff}, ${presidenteDbId}, ${equipaId}, 'treinador', 'pendente', NOW(), NOW())
                `;
            } else {
                console.error(
                    "[adicionarMembro] Clube não encontrado para organization_id:",
                    organizationId,
                );
            }

            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${organizationId},
                    ${userIdStaff},
                    'Convite para clube',
                    ${`Foste convidado para ser ${funcao} numa equipa do clube.`},
                    'convite_clube',
                    false,
                    NOW()
                )
            `;
        }

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
                const [clubeFake] = await sql<
                    { id: string; organization_id: string }[]
                >`
                    SELECT id, organization_id FROM clubes
                    WHERE organization_id = ${organizationId} LIMIT 1
                `;

                if (clubeFake) {
                    await sql`
                        INSERT INTO convites_clube (id, clube_org_id, convidado_user_id, convidado_por, equipa_id, tipo, estado, created_at, updated_at)
                        VALUES (gen_random_uuid(), ${clubeFake.organization_id}, ${existingUser.id}, ${presidenteDbId}, ${equipaId}, 'treinador', 'pendente', NOW(), NOW())
                    `;
                } else {
                    console.error(
                        "[adicionarMembro fake] Clube não encontrado para organization_id:",
                        organizationId,
                    );
                }

                // Vincular user_id no staff row para uso posterior na aceitação
                await sql`
                    UPDATE staff
                    SET user_id = ${existingUser.id}, updated_at = NOW()
                    WHERE organization_id = ${organizationId}
                      AND nome = ${nome}
                      AND funcao = ${funcao}
                      AND estado = 'pendente'
                      AND user_id IS NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                `.catch(() => {});
                await sql`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${organizationId},
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
                    INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${organizationId},
                        'Treinador não encontrado na plataforma',
                        ${`O presidente tentou associar o treinador "${nome}" (${treinadorEmailFake}) como ${funcao}, mas o email não está registado. É necessário enviar convite manualmente.`},
                        'Alerta',
                        false,
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
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo membro de staff adicionado',
                ${`${nome} foi adicionado como ${funcao}${equipaId ? ` na equipa ${equipaNome}` : ""}.`},
                'Info',
                false,
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

    // Validação: Treinador Principal real exige curso registado
    if (funcao === "Treinador Principal" && isTreinador && userIdStaff) {
        const [temCurso] = await sql<{ id: string }[]>`
            SELECT uc.id FROM user_cursos uc WHERE uc.user_id = ${userIdStaff} LIMIT 1
        `;
        if (!temCurso) {
            return {
                error: "Treinadores sem curso registado só podem ser Treinador Adjunto.",
            };
        }
    }

    const resolvedUserId = isTreinador ? userIdStaff : null;

    // grau_tecnico_id — apenas para treinadores fictícios (sem user_id)
    const grauTecnicoId =
        isTreinador && !resolvedUserId
            ? parseInt(formData.get("grau_tecnico_id")?.toString() ?? "", 10) ||
              null
            : null;

    try {
        await sql`
            UPDATE staff SET
                nome      = ${nome},
                funcao    = ${funcao},
                equipa_id = ${equipaId},
                user_id   = ${resolvedUserId},
                grau_tecnico_id = ${grauTecnicoId}
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
        // Buscar dados do membro antes de remover (para notificar)
        const [membro] = await sql<
            { nome: string; funcao: string; user_id: string | null }[]
        >`SELECT nome, funcao, user_id FROM staff WHERE id = ${id} AND organization_id = ${organizationId}`;

        await sql`DELETE FROM staff WHERE id = ${id} AND organization_id = ${organizationId}`;

        // Notificar o treinador real (com user_id) que foi excluído
        if (membro?.user_id) {
            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${membro.user_id},
                    ${membro.user_id},
                    'Exclusão do clube',
                    ${`Foste removido da posição de ${membro.funcao} pelo presidente do clube.`},
                    'Alerta',
                    false,
                    NOW()
                )
            `;
        }
    } catch (error) {
        console.error(error);
        throw new Error("Erro ao remover membro.");
    }

    revalidatePath("/dashboard/presidente/staff");
}

export async function suspenderMembro(id: string): Promise<void> {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organização.");
    }
    if (!organizationId) throw new Error("Organização não encontrada.");

    try {
        const [membro] = await sql<
            { nome: string; funcao: string; user_id: string | null }[]
        >`SELECT nome, funcao, user_id FROM staff WHERE id = ${id} AND organization_id = ${organizationId}`;

        await sql`
            UPDATE staff SET estado = 'suspenso', updated_at = NOW()
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;

        // Notificar o treinador real que foi suspenso
        if (membro?.user_id) {
            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${membro.user_id},
                    ${membro.user_id},
                    'Suspensão do clube',
                    ${`Foste suspenso da posição de ${membro.funcao} pelo presidente do clube.`},
                    'Alerta',
                    false,
                    NOW()
                )
            `;
        }
    } catch (error) {
        console.error(error);
        throw new Error("Erro ao suspender membro.");
    }

    await logAction(userId, "staff_suspend", "/dashboard/presidente/staff", {
        id,
    });
    revalidatePath("/dashboard/presidente/staff");
}
