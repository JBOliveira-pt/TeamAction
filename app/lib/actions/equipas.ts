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

        // Verificar se já está noutra equipa
        if (treinadorStaff.user_id) {
            // Verificar via equipas.treinador_id (real)
            const [jaTemEquipaPrincipal] = await sql<
                { id: string; nome: string }[]
            >`
                SELECT id, nome FROM equipas
                WHERE treinador_id = ${treinadorStaff.user_id}
                  AND organization_id = ${organizationId}
                LIMIT 1
            `;
            if (jaTemEquipaPrincipal) {
                return {
                    error: `Este treinador já é Principal na equipa "${jaTemEquipaPrincipal.nome}".`,
                };
            }
        }

        // Verificar se o staff entry já está associado a outra equipa
        const [staffJaTemEquipa] = await sql<{ equipa_nome: string }[]>`
            SELECT e.nome AS equipa_nome FROM staff s
            JOIN equipas e ON e.id = s.equipa_id
            WHERE s.id = ${treinadorStaffId}
              AND s.equipa_id IS NOT NULL
            LIMIT 1
        `;
        if (staffJaTemEquipa) {
            return {
                error: `Este treinador já está associado à equipa "${staffJaTemEquipa.equipa_nome}".`,
            };
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

            const [adjuntoJaTemEquipa] = await sql<{ equipa_nome: string }[]>`
                SELECT e.nome AS equipa_nome FROM staff s
                JOIN equipas e ON e.id = s.equipa_id
                WHERE s.id = ${adjuntoStaffId}
                  AND s.equipa_id IS NOT NULL
                LIMIT 1
            `;
            if (adjuntoJaTemEquipa) {
                return {
                    error: `O treinador adjunto já está associado à equipa "${adjuntoJaTemEquipa.equipa_nome}".`,
                };
            }
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

        // Associar o staff do treinador principal à equipa + actualizar função
        await sql`
            UPDATE staff SET equipa_id = ${newEquipa.id}, funcao = 'Treinador Principal', updated_at = NOW()
            WHERE id = ${treinadorStaffId}
        `;

        // Associar o staff do adjunto à equipa se fornecido
        if (adjuntoStaffId) {
            await sql`
                UPDATE staff SET equipa_id = ${newEquipa.id}, funcao = 'Treinador Adjunto', updated_at = NOW()
                WHERE id = ${adjuntoStaffId}
            `;
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

        // Verificar se o staff entry já está associado a outra equipa (exceto a atual)
        const [staffJaTemEquipa] = await sql<{ equipa_nome: string }[]>`
            SELECT e.nome AS equipa_nome FROM staff s
            JOIN equipas e ON e.id = s.equipa_id
            WHERE s.id = ${treinadorStaffId}
              AND s.equipa_id IS NOT NULL
              AND s.equipa_id != ${id}
            LIMIT 1
        `;
        if (staffJaTemEquipa) {
            return {
                error: `Este treinador já está associado à equipa "${staffJaTemEquipa.equipa_nome}".`,
            };
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

            const [adjuntoJaTemEquipa] = await sql<{ equipa_nome: string }[]>`
                SELECT e.nome AS equipa_nome FROM staff s
                JOIN equipas e ON e.id = s.equipa_id
                WHERE s.id = ${adjuntoStaffId}
                  AND s.equipa_id IS NOT NULL
                  AND s.equipa_id != ${id}
                LIMIT 1
            `;
            if (adjuntoJaTemEquipa) {
                return {
                    error: `O treinador adjunto já está associado à equipa "${adjuntoJaTemEquipa.equipa_nome}".`,
                };
            }
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
        await sql`
            UPDATE staff SET equipa_id = ${id}, funcao = 'Treinador Principal', updated_at = NOW()
            WHERE id = ${treinadorStaffId}
        `;

        // Associar novo adjunto se fornecido
        if (adjuntoStaffId) {
            await sql`
                UPDATE staff SET equipa_id = ${id}, funcao = 'Treinador Adjunto', updated_at = NOW()
                WHERE id = ${adjuntoStaffId}
            `;
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

        // Verificar se já é Principal noutra equipa
        const [jaTemEquipa] = await sql<{ id: string; nome: string }[]>`
            SELECT id, nome FROM equipas
            WHERE treinador_id = ${treinadorId}
              AND organization_id = ${organizationId}
              AND id != ${equipaId}
            LIMIT 1
        `;
        if (jaTemEquipa) {
            return {
                error: `Este treinador já é Principal na equipa "${jaTemEquipa.nome}".`,
            };
        }

        // Verificar se já é Adjunto noutra equipa
        const [jaEAdjunto] = await sql<{ equipa_nome: string }[]>`
            SELECT e.nome AS equipa_nome FROM staff s
            JOIN equipas e ON e.id = s.equipa_id
            WHERE s.user_id = ${treinadorId}
              AND s.funcao = 'Treinador Adjunto'
              AND s.organization_id = ${organizationId}
              AND s.equipa_id != ${equipaId}
            LIMIT 1
        `;
        if (jaEAdjunto) {
            return {
                error: `Este treinador já é Adjunto na equipa "${jaEAdjunto.equipa_nome}". Um treinador só pode estar associado a uma equipa.`,
            };
        }

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
