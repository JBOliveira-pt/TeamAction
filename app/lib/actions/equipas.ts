// Actions de equipas: criar, editar, eliminar e gerir treinadores.
"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

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

    if (!treinadorStaffId) {
        return {
            error: "É obrigatório associar um treinador principal à equipa.",
        };
    }

    if (adjuntoStaffId && adjuntoStaffId === treinadorStaffId) {
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

        // Validar treinador principal (staff entry)
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
            return { error: "Treinador principal selecionado não encontrado." };

        // Verificar se o staff entry já tem equipa (para decidir update vs novo staff)
        const treinadorStaffJaTemEquipa = !!(
            await sql<{ equipa_id: string }[]>`
            SELECT equipa_id FROM staff
            WHERE id = ${treinadorStaffId} AND equipa_id IS NOT NULL
            LIMIT 1
        `
        )[0];

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

        // treinador_id na equipa: user_id do staff (null se for fictício)
        const treinadorUserId = treinadorStaff.user_id;

        // Criar equipa
        const [newEquipa] = await sql<{ id: string }[]>`
            INSERT INTO equipas (nome, escalao, desporto, estado, epoca_id, organization_id, treinador_id, created_at, updated_at)
            VALUES (
                ${nome.trim()}, ${escalao.trim()}, ${desporto.trim()},
                ${estado}, ${epocaId}, ${organizationId}, ${treinadorUserId}, NOW(), NOW()
            )
            RETURNING id
        `;

        // Associar o staff do treinador principal à equipa
        if (treinadorStaffJaTemEquipa) {
            // Staff já associado a outra equipa — criar nova entrada para esta
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
    const escalao = formData.get("escalao") as string;
    const estado = formData.get("estado") as string;

    if (!id || !nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    try {
        const [trainerUser] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId} LIMIT 1
        `;
        if (!trainerUser) return { error: "Utilizador não encontrado." };

        // Verificar que a equipa pertence ao treinador
        const [equipa] = await sql<{ id: string }[]>`
            SELECT id FROM equipas
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

        await sql`
            UPDATE equipas
            SET nome = ${nome.trim()}, escalao = ${escalao.trim()}, estado = ${estado}, updated_at = NOW()
            WHERE id = ${id}
              AND organization_id = ${organizationId}
              AND treinador_id = ${trainerUser.id}
        `;

        await logAction(
            clerkId,
            "equipa_update",
            "/dashboard/treinador/equipas",
            {
                equipa_id: id,
                nome: nome.trim(),
                escalao: escalao.trim(),
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
    if (!treinadorStaffId) {
        return {
            error: "É obrigatório associar um treinador principal à equipa.",
        };
    }
    if (adjuntoStaffId && adjuntoStaffId === treinadorStaffId) {
        return {
            error: "O treinador adjunto não pode ser o mesmo que o principal.",
        };
    }

    try {
        const rows = await sql<{ id: string }[]>`
            SELECT id FROM equipas WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
        `;
        if (rows.length === 0) return { error: "Equipa não encontrada." };

        // Validar treinador principal (staff entry)
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
            return { error: "Treinador principal selecionado não encontrado." };

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

        // treinador_id na equipa: user_id do staff (null se for fictício)
        const treinadorUserId = treinadorStaff.user_id;

        // Atualizar equipa
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

        // Associar novo treinador principal
        // Se o staff entry já tem outra equipa, criar nova entrada; senão, atualizar
        const [treinStaffAtual] = await sql<{ equipa_id: string | null }[]>`
            SELECT equipa_id FROM staff WHERE id = ${treinadorStaffId} LIMIT 1
        `;
        if (treinStaffAtual?.equipa_id && treinStaffAtual.equipa_id !== id) {
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
