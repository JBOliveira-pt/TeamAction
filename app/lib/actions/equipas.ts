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

    // Treinador Principal (real, obrigatório)
    const treinadorId = formData.get("treinador_id")?.toString().trim() || null;

    // Treinador Adjunto (real, opcional)
    const adjuntoId = formData.get("adjunto_id")?.toString().trim() || null;

    if (!nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    if (!treinadorId) {
        return {
            error: "É obrigatório associar um treinador principal à equipa.",
        };
    }

    if (adjuntoId && adjuntoId === treinadorId) {
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

        // Validar treinador principal
        const [treinador] = await sql<{ id: string }[]>`
            SELECT id FROM users
            WHERE id = ${treinadorId}
              AND organization_id = ${organizationId}
              AND account_type = 'treinador'
            LIMIT 1
        `;
        if (!treinador)
            return { error: "Treinador principal selecionado não encontrado." };

        // Verificar se o treinador principal já está noutra equipa como Principal
        const [jaTemEquipaPrincipal] = await sql<
            { id: string; nome: string }[]
        >`
            SELECT id, nome FROM equipas
            WHERE treinador_id = ${treinadorId}
              AND organization_id = ${organizationId}
            LIMIT 1
        `;
        if (jaTemEquipaPrincipal) {
            return {
                error: `Este treinador já é Principal na equipa "${jaTemEquipaPrincipal.nome}".`,
            };
        }

        // Verificar se o treinador principal já está noutra equipa como Adjunto
        const [jaEAdjunto] = await sql<{ equipa_nome: string }[]>`
            SELECT e.nome AS equipa_nome FROM staff s
            JOIN equipas e ON e.id = s.equipa_id
            WHERE s.user_id = ${treinadorId}
              AND s.funcao = 'Treinador Adjunto'
              AND s.organization_id = ${organizationId}
            LIMIT 1
        `;
        if (jaEAdjunto) {
            return {
                error: `Este treinador já é Adjunto na equipa "${jaEAdjunto.equipa_nome}". Um treinador só pode estar associado a uma equipa.`,
            };
        }

        // Validar adjunto se fornecido
        if (adjuntoId) {
            const [adjunto] = await sql<{ id: string }[]>`
                SELECT id FROM users
                WHERE id = ${adjuntoId}
                  AND organization_id = ${organizationId}
                  AND account_type = 'treinador'
                LIMIT 1
            `;
            if (!adjunto)
                return {
                    error: "Treinador adjunto selecionado não encontrado.",
                };

            // Verificar se o adjunto já é Principal noutra equipa
            const [adjuntoJaPrincipal] = await sql<
                { id: string; nome: string }[]
            >`
                SELECT id, nome FROM equipas
                WHERE treinador_id = ${adjuntoId}
                  AND organization_id = ${organizationId}
                LIMIT 1
            `;
            if (adjuntoJaPrincipal) {
                return {
                    error: `O treinador adjunto selecionado já é Principal na equipa "${adjuntoJaPrincipal.nome}".`,
                };
            }

            // Verificar se o adjunto já é Adjunto noutra equipa
            const [adjuntoJaAdjunto] = await sql<{ equipa_nome: string }[]>`
                SELECT e.nome AS equipa_nome FROM staff s
                JOIN equipas e ON e.id = s.equipa_id
                WHERE s.user_id = ${adjuntoId}
                  AND s.funcao = 'Treinador Adjunto'
                  AND s.organization_id = ${organizationId}
                LIMIT 1
            `;
            if (adjuntoJaAdjunto) {
                return {
                    error: `O treinador adjunto selecionado já é Adjunto na equipa "${adjuntoJaAdjunto.equipa_nome}".`,
                };
            }
        }

        // Criar equipa
        const [newEquipa] = await sql<{ id: string }[]>`
            INSERT INTO equipas (nome, escalao, desporto, estado, epoca_id, organization_id, treinador_id, created_at, updated_at)
            VALUES (
                ${nome.trim()}, ${escalao.trim()}, ${desporto.trim()},
                ${estado}, ${epocaId}, ${organizationId}, ${treinadorId}, NOW(), NOW()
            )
            RETURNING id
        `;

        // Criar staff entry para adjunto se fornecido
        if (adjuntoId) {
            await sql`
                INSERT INTO staff (id, organization_id, equipa_id, user_id, nome, funcao, estado, created_at, updated_at)
                SELECT gen_random_uuid(), ${organizationId}, ${newEquipa.id}, ${adjuntoId}, u.name, 'Treinador Adjunto', 'ativo', NOW(), NOW()
                FROM users u WHERE u.id = ${adjuntoId}
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
                treinadorId,
                adjuntoId,
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

    // Treinador Principal (real, obrigatório)
    const treinadorId = formData.get("treinador_id")?.toString().trim() || null;

    // Treinador Adjunto (real, opcional)
    const adjuntoId = formData.get("adjunto_id")?.toString().trim() || null;

    if (!id || !nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }
    if (!treinadorId) {
        return {
            error: "É obrigatório associar um treinador principal à equipa.",
        };
    }
    if (adjuntoId && adjuntoId === treinadorId) {
        return {
            error: "O treinador adjunto não pode ser o mesmo que o principal.",
        };
    }

    try {
        const rows = await sql<{ id: string }[]>`
            SELECT id FROM equipas WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
        `;
        if (rows.length === 0) return { error: "Equipa não encontrada." };

        // Validar treinador principal
        const [treinador] = await sql<{ id: string }[]>`
            SELECT id FROM users
            WHERE id = ${treinadorId}
              AND organization_id = ${organizationId}
              AND account_type = 'treinador'
            LIMIT 1
        `;
        if (!treinador)
            return { error: "Treinador principal selecionado não encontrado." };

        // Verificar se o treinador principal já é Principal noutra equipa (exceto a atual)
        const [jaTemEquipaPrincipal] = await sql<
            { id: string; nome: string }[]
        >`
            SELECT id, nome FROM equipas
            WHERE treinador_id = ${treinadorId}
              AND organization_id = ${organizationId}
              AND id != ${id}
            LIMIT 1
        `;
        if (jaTemEquipaPrincipal) {
            return {
                error: `Este treinador já é Principal na equipa "${jaTemEquipaPrincipal.nome}".`,
            };
        }

        // Verificar se o treinador principal já é Adjunto noutra equipa
        const [jaEAdjunto] = await sql<{ equipa_nome: string }[]>`
            SELECT e.nome AS equipa_nome FROM staff s
            JOIN equipas e ON e.id = s.equipa_id
            WHERE s.user_id = ${treinadorId}
              AND s.funcao = 'Treinador Adjunto'
              AND s.organization_id = ${organizationId}
              AND s.equipa_id != ${id}
            LIMIT 1
        `;
        if (jaEAdjunto) {
            return {
                error: `Este treinador já é Adjunto na equipa "${jaEAdjunto.equipa_nome}". Um treinador só pode estar associado a uma equipa.`,
            };
        }

        // Validar adjunto se fornecido
        if (adjuntoId) {
            const [adjunto] = await sql<{ id: string }[]>`
                SELECT id FROM users
                WHERE id = ${adjuntoId}
                  AND organization_id = ${organizationId}
                  AND account_type = 'treinador'
                LIMIT 1
            `;
            if (!adjunto)
                return {
                    error: "Treinador adjunto selecionado não encontrado.",
                };

            // Verificar se o adjunto já é Principal noutra equipa
            const [adjuntoJaPrincipal] = await sql<
                { id: string; nome: string }[]
            >`
                SELECT id, nome FROM equipas
                WHERE treinador_id = ${adjuntoId}
                  AND organization_id = ${organizationId}
                LIMIT 1
            `;
            if (adjuntoJaPrincipal) {
                return {
                    error: `O treinador adjunto selecionado já é Principal na equipa "${adjuntoJaPrincipal.nome}".`,
                };
            }

            // Verificar se o adjunto já é Adjunto noutra equipa (exceto a atual)
            const [adjuntoJaAdjunto] = await sql<{ equipa_nome: string }[]>`
                SELECT e.nome AS equipa_nome FROM staff s
                JOIN equipas e ON e.id = s.equipa_id
                WHERE s.user_id = ${adjuntoId}
                  AND s.funcao = 'Treinador Adjunto'
                  AND s.organization_id = ${organizationId}
                  AND s.equipa_id != ${id}
                LIMIT 1
            `;
            if (adjuntoJaAdjunto) {
                return {
                    error: `O treinador adjunto selecionado já é Adjunto na equipa "${adjuntoJaAdjunto.equipa_nome}".`,
                };
            }
        }

        // Atualizar equipa
        await sql`
            UPDATE equipas
            SET nome = ${nome.trim()}, escalao = ${escalao.trim()}, estado = ${estado},
                treinador_id = ${treinadorId}, updated_at = NOW()
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;

        // Gerir staff de Treinador Adjunto
        // Remover adjunto antigo desta equipa
        await sql`
            DELETE FROM staff
            WHERE equipa_id = ${id} AND funcao = 'Treinador Adjunto' AND organization_id = ${organizationId}
        `;
        // Inserir novo adjunto se fornecido
        if (adjuntoId) {
            await sql`
                INSERT INTO staff (id, organization_id, equipa_id, user_id, nome, funcao, estado, created_at, updated_at)
                SELECT gen_random_uuid(), ${organizationId}, ${id}, ${adjuntoId}, u.name, 'Treinador Adjunto', 'ativo', NOW(), NOW()
                FROM users u WHERE u.id = ${adjuntoId}
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
                treinadorId,
                adjuntoId,
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
