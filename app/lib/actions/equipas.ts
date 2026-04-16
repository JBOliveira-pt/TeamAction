// Actions de equipas: criar, editar, eliminar e gerir treinadores.
"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";
import { isEscalaoPermitido } from "@/app/lib/grau-escalao-compat";

export async function criarEquipa(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;

    try {
        organizationId = await getOrganizationId();
    } catch (error) {
        console.error(
            "Failed to resolve organization for creating team:",
            error,
        );
        return {
            error: "Não foi possível identificar a organização. Tenta novamente.",
        };
    }

    const nome = formData.get("nome") as string;
    const { userId: clerkId } = await auth();
    const escalao = formData.get("escalao") as string;
    const desporto = formData.get("desporto") as string;
    const estado = formData.get("estado") as string;

    // Treinador Principal (staff_id, obrigatório)
    const treinadorStaffId =
        formData.get("treinador_staff_id")?.toString().trim() || null;

    // Treinador Adjunto (staff_id, opcional)
    const adjuntoStaffId =
        formData.get("adjunto_staff_id")?.toString().trim() || null;

    if (!nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    if (
        adjuntoStaffId &&
        treinadorStaffId &&
        adjuntoStaffId === treinadorStaffId
    ) {
        return {
            error: "O treinador adjunto não pode ser o mesmo que o principal.",
        };
    }

    try {
        const epocas = await sql<{ id: string }[]>`
            SELECT id FROM epocas
            WHERE organization_id = ${organizationId} AND ativa = true
            LIMIT 1
        `;
        const epocaId = epocas[0]?.id ?? null;

        // Validar treinador principal (staff entry) se fornecido
        let treinadorUserId: string | null = null;
        let treinadorStaffJaTemEquipa = false;
        if (treinadorStaffId) {
            const [treinadorStaff] = await sql<
                { id: string; user_id: string | null; nome: string }[]
            >`
                SELECT id, user_id, nome FROM staff
                WHERE id = ${treinadorStaffId}
                  AND organization_id = ${organizationId}
                  AND funcao IN ('Treinador Principal', 'Treinador Adjunto')
                  AND estado = 'ativo'
                LIMIT 1
            `;
            if (!treinadorStaff)
                return {
                    error: "Treinador principal selecionado não encontrado.",
                };

            treinadorUserId = treinadorStaff.user_id;

            treinadorStaffJaTemEquipa = !!(
                await sql<{ equipa_id: string }[]>`
                SELECT equipa_id FROM staff
                WHERE id = ${treinadorStaffId} AND equipa_id IS NOT NULL
                LIMIT 1
            `
            )[0];
        }

        // Validar adjunto se fornecido
        let adjuntoStaffJaTemEquipa = false;
        if (adjuntoStaffId) {
            const [adjuntoStaff] = await sql<
                { id: string; user_id: string | null; nome: string }[]
            >`
                SELECT id, user_id, nome FROM staff
                WHERE id = ${adjuntoStaffId}
                  AND organization_id = ${organizationId}
                  AND funcao IN ('Treinador Principal', 'Treinador Adjunto')
                  AND estado = 'ativo'
                LIMIT 1
            `;
            if (!adjuntoStaff)
                return {
                    error: "Treinador adjunto selecionado não encontrado.",
                };

            adjuntoStaffJaTemEquipa = !!(
                await sql<{ equipa_id: string }[]>`
                SELECT equipa_id FROM staff
                WHERE id = ${adjuntoStaffId} AND equipa_id IS NOT NULL
                LIMIT 1
            `
            )[0];
        }

        // Criar equipa (treinador_id pode ser null)
        const [newEquipa] = await sql<{ id: string }[]>`
            INSERT INTO equipas (nome, escalao, desporto, estado, epoca_id, organization_id, treinador_id, created_at, updated_at)
            VALUES (
                ${nome.trim()}, ${escalao.trim()}, ${desporto.trim()},
                ${estado}, ${epocaId}, ${organizationId}, ${treinadorUserId}, NOW(), NOW()
            )
            RETURNING id
        `;

        // Associar o staff do treinador principal à equipa (se fornecido)
        if (treinadorStaffId) {
            if (treinadorStaffJaTemEquipa) {
                await sql`
                    INSERT INTO staff (id, nome, funcao, equipa_id, user_id, organization_id, estado, grau_tecnico_id, created_at, updated_at)
                    SELECT gen_random_uuid(), s.nome, 'Treinador Principal', ${newEquipa.id}, s.user_id, s.organization_id, s.estado, s.grau_tecnico_id, NOW(), NOW()
                    FROM staff s WHERE s.id = ${treinadorStaffId}
                `;
            } else {
                await sql`
                    UPDATE staff SET equipa_id = ${newEquipa.id}, funcao = 'Treinador Principal', updated_at = NOW()
                    WHERE id = ${treinadorStaffId}
                `;
            }
        }

        // Associar o staff do adjunto à equipa se fornecido
        if (adjuntoStaffId) {
            if (adjuntoStaffJaTemEquipa) {
                await sql`
                    INSERT INTO staff (id, nome, funcao, equipa_id, user_id, organization_id, estado, grau_tecnico_id, created_at, updated_at)
                    SELECT gen_random_uuid(), s.nome, 'Treinador Adjunto', ${newEquipa.id}, s.user_id, s.organization_id, s.estado, s.grau_tecnico_id, NOW(), NOW()
                    FROM staff s WHERE s.id = ${adjuntoStaffId}
                `;
            } else {
                await sql`
                    UPDATE staff SET equipa_id = ${newEquipa.id}, funcao = 'Treinador Adjunto', updated_at = NOW()
                    WHERE id = ${adjuntoStaffId}
                `;
            }
        }

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova equipa criada',
                ${`Equipa ${nome.trim()} (${escalao.trim()}) foi criada com sucesso.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "equipa_create",
            "/dashboard/presidente/equipas",
            {
                nome: nome.trim(),
                escalao: escalao.trim(),
                desporto: desporto.trim(),
                estado,
                treinadorStaffId,
                adjuntoStaffId,
            },
        );
        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao criar equipa. Tenta novamente." };
    }
}

export async function criarEquipaTreinador(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;

    try {
        organizationId = await getOrganizationId();
    } catch (error) {
        console.error(
            "Failed to resolve organization for creating team:",
            error,
        );
        return {
            error: "Não foi possível identificar a organização. Tenta novamente.",
        };
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) return { error: "Sessão expirada." };

    const nome = formData.get("nome") as string;
    const escalao = formData.get("escalao") as string;
    const desporto = formData.get("desporto") as string;
    const estado = formData.get("estado") as string;

    if (!nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    try {
        const [trainerUser] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId} LIMIT 1
        `;
        if (!trainerUser) return { error: "Utilizador não encontrado." };

        // Validar se o curso do treinador cobre o escalão selecionado
        const cursoRows = await sql<{ level_id: number }[]>`
            SELECT g.id AS level_id
            FROM user_cursos uc
            INNER JOIN cursos c ON c.id = uc.curso_id
            INNER JOIN graus_tecnicos g ON g.id = c.level_id
            WHERE uc.user_id = ${trainerUser.id}
            ORDER BY g.id DESC
            LIMIT 1
        `;
        if (cursoRows.length > 0) {
            const grauId = cursoRows[0].level_id;
            if (!isEscalaoPermitido(grauId, escalao.trim())) {
                return {
                    error: "O seu curso não cobre o escalão selecionado.",
                };
            }
        }

        const epocas = await sql<{ id: string }[]>`
            SELECT id FROM epocas
            WHERE organization_id = ${organizationId} AND ativa = true
            LIMIT 1
        `;
        const epocaId = epocas[0]?.id ?? null;

        await sql`
            INSERT INTO equipas (nome, escalao, desporto, estado, epoca_id, organization_id, treinador_id, created_at, updated_at)
            VALUES (
                ${nome.trim()}, ${escalao.trim()}, ${(desporto || "").trim()},
                ${estado}, ${epocaId}, ${organizationId}, ${trainerUser.id}, NOW(), NOW()
            )
        `;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova equipa criada',
                ${`Equipa ${nome.trim()} (${escalao.trim()}) foi criada com sucesso.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "equipa_create",
            "/dashboard/treinador/equipas",
            {
                nome: nome.trim(),
                escalao: escalao.trim(),
                desporto: (desporto || "").trim(),
                estado,
            },
        );
        revalidatePath("/dashboard/treinador/equipas");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao criar equipa. Tenta novamente." };
    }
}

export async function editarEquipaTreinador(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) return { error: "Sessão expirada." };

    const id = formData.get("id") as string;
    const nome = formData.get("nome") as string;
    const estado = formData.get("estado") as string;

    if (!id || !nome?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    try {
        const [trainerUser] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId} LIMIT 1
        `;
        if (!trainerUser) return { error: "Utilizador não encontrado." };

        // Verificar que a equipa pertence ao treinador
        const [equipa] = await sql<
            { id: string; nome: string; estado: string }[]
        >`
            SELECT id, nome, estado FROM equipas
            WHERE id = ${id}
              AND organization_id = ${organizationId}
              AND treinador_id = ${trainerUser.id}
            LIMIT 1
        `;
        if (!equipa) return { error: "Equipa não encontrada." };

        // Impedir edição de equipas atribuídas pelo clube (possuem staff record)
        const [staffRecord] = await sql<{ id: string }[]>`
            SELECT id FROM staff
            WHERE equipa_id = ${id}
              AND organization_id = ${organizationId}
              AND funcao IN ('Treinador Principal', 'Treinador Adjunto')
            LIMIT 1
        `;
        if (staffRecord) {
            return {
                error: "Não é possível editar equipas atribuídas pelo clube.",
            };
        }

        const nomeAnterior = equipa.nome;
        const estadoAnterior = equipa.estado;
        const nomeAlterado = nome.trim() !== nomeAnterior;
        const estadoAlterado = estado !== estadoAnterior;

        await sql`
            UPDATE equipas
            SET nome = ${nome.trim()}, estado = ${estado}, updated_at = NOW()
            WHERE id = ${id}
              AND organization_id = ${organizationId}
              AND treinador_id = ${trainerUser.id}
        `;

        // Notificar atletas reais (com user_id) sobre a alteração
        if (nomeAlterado || estadoAlterado) {
            const partes: string[] = [];
            if (nomeAlterado)
                partes.push(`nome alterado para "${nome.trim()}"`);
            if (estadoAlterado) partes.push(`estado alterado para "${estado}"`);
            const descricao = `A equipa "${nomeAnterior}" foi atualizada: ${partes.join(", ")}.`;

            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                SELECT gen_random_uuid(), ${organizationId}, a.user_id,
                       'Equipa Atualizada', ${descricao}, 'Info', false, NOW()
                FROM atletas a
                WHERE a.equipa_id = ${id}
                  AND a.user_id IS NOT NULL
            `.catch(() => {});
        }

        await logAction(
            clerkId,
            "equipa_update",
            "/dashboard/treinador/equipas",
            {
                equipa_id: id,
                nome: nome.trim(),
                estado,
            },
        );

        revalidatePath("/dashboard/treinador/equipas");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao editar equipa. Tenta novamente." };
    }
}

export async function eliminarEquipaTreinador(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) return { error: "Sessão expirada." };

    try {
        const [trainerUser] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId} LIMIT 1
        `;
        if (!trainerUser) return { error: "Utilizador não encontrado." };

        const [equipa] = await sql<{ id: string; nome: string }[]>`
            SELECT id, nome FROM equipas
            WHERE id = ${id}
              AND organization_id = ${organizationId}
              AND treinador_id = ${trainerUser.id}
            LIMIT 1
        `;
        if (!equipa) return { error: "Equipa não encontrada." };

        // Impedir eliminação de equipas atribuídas pelo clube
        const [staffRecord] = await sql<{ id: string }[]>`
            SELECT id FROM staff
            WHERE equipa_id = ${id}
              AND organization_id = ${organizationId}
              AND funcao IN ('Treinador Principal', 'Treinador Adjunto')
            LIMIT 1
        `;
        if (staffRecord) {
            return {
                error: "Não é possível eliminar equipas atribuídas pelo clube.",
            };
        }

        const nomeEquipa = equipa.nome;

        // Notificar atletas reais antes de desassociar
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            SELECT gen_random_uuid(), ${organizationId}, a.user_id,
                   'Equipa Eliminada',
                   ${`A equipa "${nomeEquipa}" foi eliminada pelo treinador. Permaneces associado(a) ao treinador, mas sem equipa atribuída.`},
                   'Aviso', false, NOW()
            FROM atletas a
            WHERE a.equipa_id = ${id}
              AND a.user_id IS NOT NULL
        `.catch(() => {});

        // Desassociar atletas da equipa (mantêm-se no treinador)
        await sql`UPDATE atletas SET equipa_id = NULL, updated_at = NOW() WHERE equipa_id = ${id}`;

        await sql`DELETE FROM equipas WHERE id = ${id} AND organization_id = ${organizationId} AND treinador_id = ${trainerUser.id}`;

        await logAction(
            clerkId,
            "equipa_delete",
            "/dashboard/treinador/equipas",
            {
                equipa_id: id,
                nome: nomeEquipa,
            },
        );

        revalidatePath("/dashboard/treinador/equipas");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao eliminar equipa. Tenta novamente." };
    }
}

export async function editarEquipa(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    const { userId: clerkId } = await auth();
    const id = formData.get("id") as string;
    const nome = formData.get("nome") as string;
    const escalao = formData.get("escalao") as string;
    const estado = formData.get("estado") as string;

    // Treinador Principal (staff_id, obrigatório)
    const treinadorStaffId =
        formData.get("treinador_staff_id")?.toString().trim() || null;

    // Treinador Adjunto (staff_id, opcional)
    const adjuntoStaffId =
        formData.get("adjunto_staff_id")?.toString().trim() || null;

    if (!id || !nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }
    if (
        adjuntoStaffId &&
        treinadorStaffId &&
        adjuntoStaffId === treinadorStaffId
    ) {
        return {
            error: "O treinador adjunto não pode ser o mesmo que o principal.",
        };
    }

    try {
        const rows = await sql<{ id: string }[]>`
            SELECT id FROM equipas WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
        `;
        if (rows.length === 0) return { error: "Equipa não encontrada." };

        // Validar treinador principal (staff entry) se fornecido
        let treinadorUserId: string | null = null;
        if (treinadorStaffId) {
            const [treinadorStaff] = await sql<
                { id: string; user_id: string | null; nome: string }[]
            >`
                SELECT id, user_id, nome FROM staff
                WHERE id = ${treinadorStaffId}
                  AND organization_id = ${organizationId}
                  AND funcao IN ('Treinador Principal', 'Treinador Adjunto')
                  AND estado = 'ativo'
                LIMIT 1
            `;
            if (!treinadorStaff)
                return {
                    error: "Treinador principal selecionado não encontrado.",
                };

            treinadorUserId = treinadorStaff.user_id;
        }

        // Validar adjunto se fornecido
        if (adjuntoStaffId) {
            const [adjuntoStaff] = await sql<
                { id: string; user_id: string | null; nome: string }[]
            >`
                SELECT id, user_id, nome FROM staff
                WHERE id = ${adjuntoStaffId}
                  AND organization_id = ${organizationId}
                  AND funcao IN ('Treinador Principal', 'Treinador Adjunto')
                  AND estado = 'ativo'
                LIMIT 1
            `;
            if (!adjuntoStaff)
                return {
                    error: "Treinador adjunto selecionado não encontrado.",
                };
        }

        // Atualizar equipa (treinador_id pode ser null)
        await sql`
            UPDATE equipas
            SET nome = ${nome.trim()}, escalao = ${escalao.trim()}, estado = ${estado},
                treinador_id = ${treinadorUserId}, updated_at = NOW()
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;

        // Desassociar staff anteriores desta equipa
        await sql`
            UPDATE staff SET equipa_id = NULL, updated_at = NOW()
            WHERE equipa_id = ${id}
              AND funcao IN ('Treinador Principal', 'Treinador Adjunto')
              AND organization_id = ${organizationId}
        `;

        // Associar novo treinador principal (se fornecido)
        if (treinadorStaffId) {
            const [treinStaffAtual] = await sql<{ equipa_id: string | null }[]>`
                SELECT equipa_id FROM staff WHERE id = ${treinadorStaffId} LIMIT 1
            `;
            if (
                treinStaffAtual?.equipa_id &&
                treinStaffAtual.equipa_id !== id
            ) {
                await sql`
                    INSERT INTO staff (id, nome, funcao, equipa_id, user_id, organization_id, estado, grau_tecnico_id, created_at, updated_at)
                    SELECT gen_random_uuid(), s.nome, 'Treinador Principal', ${id}, s.user_id, s.organization_id, s.estado, s.grau_tecnico_id, NOW(), NOW()
                    FROM staff s WHERE s.id = ${treinadorStaffId}
                `;
            } else {
                await sql`
                    UPDATE staff SET equipa_id = ${id}, funcao = 'Treinador Principal', updated_at = NOW()
                    WHERE id = ${treinadorStaffId}
                `;
            }
        }

        // Associar novo adjunto se fornecido
        if (adjuntoStaffId) {
            const [adjStaffAtual] = await sql<{ equipa_id: string | null }[]>`
                SELECT equipa_id FROM staff WHERE id = ${adjuntoStaffId} LIMIT 1
            `;
            if (adjStaffAtual?.equipa_id && adjStaffAtual.equipa_id !== id) {
                await sql`
                    INSERT INTO staff (id, nome, funcao, equipa_id, user_id, organization_id, estado, grau_tecnico_id, created_at, updated_at)
                    SELECT gen_random_uuid(), s.nome, 'Treinador Adjunto', ${id}, s.user_id, s.organization_id, s.estado, s.grau_tecnico_id, NOW(), NOW()
                    FROM staff s WHERE s.id = ${adjuntoStaffId}
                `;
            } else {
                await sql`
                    UPDATE staff SET equipa_id = ${id}, funcao = 'Treinador Adjunto', updated_at = NOW()
                    WHERE id = ${adjuntoStaffId}
                `;
            }
        }

        await logAction(
            clerkId,
            "equipa_update",
            "/dashboard/presidente/equipas",
            {
                equipa_id: id,
                nome: nome.trim(),
                escalao: escalao.trim(),
                estado,
                treinadorStaffId,
                adjuntoStaffId,
            },
        );

        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath(`/dashboard/presidente/equipas/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao editar equipa. Tenta novamente." };
    }
}

export async function eliminarEquipa(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    const { userId: clerkId } = await auth();

    try {
        const rows = await sql<{ id: string; nome: string }[]>`
            SELECT id, nome FROM equipas WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
        `;
        if (rows.length === 0) return { error: "Equipa não encontrada." };

        const nomeEquipa = rows[0].nome;

        // Desassociar atletas da equipa antes de eliminar
        await sql`UPDATE atletas SET equipa_id = NULL WHERE equipa_id = ${id}`;

        // Desassociar staff da equipa antes de eliminar
        await sql`UPDATE staff SET equipa_id = NULL WHERE equipa_id = ${id}`;

        await sql`DELETE FROM equipas WHERE id = ${id} AND organization_id = ${organizationId}`;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Equipa eliminada',
                ${`A equipa "${nomeEquipa}" foi eliminada.`},
                'Aviso',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "equipa_delete",
            "/dashboard/presidente/equipas",
            {
                equipa_id: id,
                nome: nomeEquipa,
            },
        );

        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao eliminar equipa. Tenta novamente." };
    }
}

export async function atribuirTreinadorEquipa(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const equipaId = formData.get("equipa_id")?.toString().trim();
    const treinadorId = formData.get("treinador_id")?.toString().trim() || null;

    if (!equipaId) return { error: "Equipa inválida." };
    if (!treinadorId) {
        return { error: "É obrigatório selecionar um treinador." };
    }

    try {
        const organizationId = await getOrganizationId();

        const [treinador] = await sql<{ id: string }[]>`
            SELECT id FROM users
            WHERE id = ${treinadorId}
              AND organization_id = ${organizationId}
              AND account_type = 'treinador'
            LIMIT 1
        `;
        if (!treinador) return { error: "Treinador não encontrado." };

        await sql`
            UPDATE equipas
            SET treinador_id = ${treinadorId}, updated_at = NOW()
            WHERE id = ${equipaId} AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atribuir treinador." };
    }

    revalidatePath("/dashboard/presidente/equipas");
    revalidatePath(`/dashboard/presidente/equipas/${equipaId}`);
    return { success: true };
}
