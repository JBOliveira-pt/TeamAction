// Actions de atletas: adicionar e editar atletas no modal.
"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
    isIdadePermitidaEscalao,
    getIdadeMaximaEscalao,
    MAX_ATLETAS_POR_EQUIPA,
} from "@/app/lib/grau-escalao-compat";

/** Calcula idade a partir de data de nascimento. */
function calcularIdade(dataNascimento: string | Date): number {
    const birth = new Date(dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

/**
 * Valida se a equipa pode receber mais um atleta e se a idade é compatível.
 * Retorna string com erro ou null se OK.
 * @param atletaIdToExclude — ID do atleta a excluir da contagem (para edição)
 */
async function validarAtribuicaoEquipa(
    equipaId: string,
    atletaUserId: string | null,
    atletaIdToExclude?: string,
): Promise<string | null> {
    // 1. Buscar escalão da equipa
    const [equipa] = await sql<{ escalao: string }[]>`
        SELECT escalao FROM equipas WHERE id = ${equipaId} LIMIT 1
    `;
    if (!equipa) return "Equipa não encontrada.";

    // 2. Validar limite máximo de atletas (14)
    const excludeClause =
        atletaIdToExclude ?? "00000000-0000-0000-0000-000000000000";
    const [countRow] = await sql<{ total: number }[]>`
        SELECT COUNT(*)::int AS total FROM atletas
        WHERE equipa_id = ${equipaId} AND id != ${excludeClause}
    `;
    if ((countRow?.total ?? 0) >= MAX_ATLETAS_POR_EQUIPA) {
        return `Esta equipa já tem o máximo de ${MAX_ATLETAS_POR_EQUIPA} atletas.`;
    }

    // 3. Validar idade do atleta (se tiver conta com data de nascimento)
    if (atletaUserId) {
        const [userRow] = await sql<{ data_nascimento: string | null }[]>`
            SELECT data_nascimento FROM users WHERE id = ${atletaUserId} LIMIT 1
        `;
        if (userRow?.data_nascimento) {
            const idade = calcularIdade(userRow.data_nascimento);
            if (!isIdadePermitidaEscalao(idade, equipa.escalao)) {
                const limite = getIdadeMaximaEscalao(equipa.escalao);
                return `O atleta tem ${idade} anos mas o escalão ${equipa.escalao} requer idade inferior a ${limite} anos.`;
            }
        }
    }

    return null;
}

export async function adicionarAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }

    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const nome = formData.get("nome")?.toString().trim();
    const posicao = formData.get("posicao")?.toString().trim() || null;
    const numCamisola =
        formData.get("numero_camisola")?.toString().trim() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const estado = formData.get("estado")?.toString() || "ativo";
    const rawFederado = formData.get("federado") === "on";
    const numFederado =
        formData.get("numero_federado")?.toString().trim() || null;
    const maoDominante = formData.get("mao_dominante")?.toString() || null;
    const dataNascimento =
        formData.get("data_nascimento")?.toString().trim() || null;

    if (!nome) return { error: "Nome é obrigatório." };
    if (!dataNascimento) return { error: "Data de nascimento é obrigatória." };

    try {
        // Validar: federado só é possível se a organização tiver um clube
        let federado = rawFederado;
        if (federado) {
            const clubeRows = await sql<{ id: string }[]>`
                SELECT id FROM clubes WHERE organization_id = ${organizationId} LIMIT 1
            `;
            if (clubeRows.length === 0) federado = false;
        }
        const safeNumFederado = federado ? numFederado : null;

        // Validar atribuição à equipa (max 14 + idade via data_nascimento do atleta)
        if (equipaId) {
            const erroEquipa = await validarAtribuicaoEquipa(equipaId, null);
            if (erroEquipa) return { error: erroEquipa };

            // Validar idade do atleta fake pelo campo data_nascimento
            if (dataNascimento) {
                const [equipa] = await sql<{ escalao: string }[]>`
                    SELECT escalao FROM equipas WHERE id = ${equipaId} LIMIT 1
                `;
                if (equipa) {
                    const idade = calcularIdade(dataNascimento);
                    if (!isIdadePermitidaEscalao(idade, equipa.escalao)) {
                        const limite = getIdadeMaximaEscalao(equipa.escalao);
                        return {
                            error: `O atleta tem ${idade} anos mas o escalão ${equipa.escalao} requer idade inferior a ${limite} anos.`,
                        };
                    }
                }
            }
        }

        await sql`
            INSERT INTO atletas (
                id, nome, posicao, numero_camisola,
                equipa_id, estado, federado, numero_federado,
                mao_dominante, organization_id, data_nascimento
            ) VALUES (
                gen_random_uuid(), ${nome}, ${posicao},
                ${numCamisola ? parseInt(numCamisola) : null},
                ${equipaId}, ${estado}, ${federado}, ${safeNumFederado},
                ${maoDominante}, ${organizationId}, ${dataNascimento}
            )
        `;

        // Buscar nome da equipa para a notificaÃ§Ã£o
        let equipaNome = "sem equipa";
        if (equipaId) {
            const equipaResult = await sql<{ nome: string }[]>`
                SELECT nome FROM equipas WHERE id = ${equipaId}
            `;
            equipaNome = equipaResult[0]?.nome ?? "sem equipa";
        }

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo atleta registado',
                ${`${nome} foi adicionado${equipaId ? ` Ã  equipa ${equipaNome}` : " sem equipa atribuÃ­da"}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao adicionar atleta." };
    }

    await logAction(userId, "atleta_add", "/dashboard/presidente/atletas", {
        nome,
        equipaId,
    });
    revalidatePath("/dashboard/presidente/atletas");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

export async function editarAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }
    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const id = formData.get("id")?.toString();
    const nome = formData.get("nome")?.toString().trim();
    const posicao = formData.get("posicao")?.toString().trim() || null;
    const numCamisola =
        formData.get("numero_camisola")?.toString().trim() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const estado = formData.get("estado")?.toString() || "ativo";
    const rawFederado = formData.get("federado") === "on";
    const numFederado =
        formData.get("numero_federado")?.toString().trim() || null;
    const maoDominante = formData.get("mao_dominante")?.toString() || null;

    if (!id) return { error: "ID do atleta em falta." };
    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };

    try {
        // Validar: federado só é possível se a organização tiver um clube
        let federado = rawFederado;
        if (federado) {
            const clubeRows = await sql<{ id: string }[]>`
                SELECT id FROM clubes WHERE organization_id = ${organizationId} LIMIT 1
            `;
            if (clubeRows.length === 0) federado = false;
        }
        const safeNumFederado = federado ? numFederado : null;

        // Se está a mudar de equipa, validar unicidade + limite + idade
        if (equipaId) {
            const [atletaAtual] = await sql<
                {
                    equipa_id: string | null;
                    user_id: string | null;
                    data_nascimento: string | null;
                }[]
            >`
                SELECT equipa_id, user_id, data_nascimento FROM atletas WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
            `;
            if (atletaAtual?.equipa_id && atletaAtual.equipa_id !== equipaId) {
                return {
                    error: "Este atleta já pertence a outra equipa. Remove-o primeiro da equipa atual.",
                };
            }
            // Só validar limite/idade se está a ENTRAR numa equipa (nova atribuição)
            if (!atletaAtual?.equipa_id || atletaAtual.equipa_id !== equipaId) {
                const erroEquipa = await validarAtribuicaoEquipa(
                    equipaId,
                    atletaAtual?.user_id ?? null,
                    id,
                );
                if (erroEquipa) return { error: erroEquipa };

                // Se atleta fake (sem user_id), validar idade via data_nascimento da tabela atletas
                if (!atletaAtual?.user_id && atletaAtual?.data_nascimento) {
                    const [equipa] = await sql<{ escalao: string }[]>`
                        SELECT escalao FROM equipas WHERE id = ${equipaId} LIMIT 1
                    `;
                    if (equipa) {
                        const idade = calcularIdade(
                            atletaAtual.data_nascimento,
                        );
                        if (!isIdadePermitidaEscalao(idade, equipa.escalao)) {
                            const limite = getIdadeMaximaEscalao(
                                equipa.escalao,
                            );
                            return {
                                error: `O atleta tem ${idade} anos mas o escalão ${equipa.escalao} requer idade inferior a ${limite} anos.`,
                            };
                        }
                    }
                }
            }
        }

        await sql`
            UPDATE atletas SET
                nome             = ${nome},
                posicao          = ${posicao},
                numero_camisola  = ${numCamisola ? parseInt(numCamisola) : null},
                equipa_id        = ${equipaId},
                estado           = ${estado},
                federado         = ${federado},
                numero_federado  = ${safeNumFederado},
                mao_dominante    = ${maoDominante}
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao editar atleta." };
    }

    revalidatePath("/dashboard/presidente/atletas");
    return { success: true };
}
