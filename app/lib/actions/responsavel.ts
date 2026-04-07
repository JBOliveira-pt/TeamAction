"use server";

import { auth } from "@clerk/nextjs/server";
import { sql } from "./_shared";
import { revalidatePath } from "next/cache";

/**
 * Verifica que o utilizador autenticado é responsável (encarregado_educacao)
 * de pelo menos um menor. Retorna o email do guardião.
 */
async function getGuardianEmail(): Promise<string | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    const [guardian] = await sql<{ email: string }[]>`
        SELECT email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return guardian?.email ?? null;
}

/**
 * Responsável aprova ou rejeita um convite de equipa pendente.
 */
export async function aprovarConviteEquipa(
    conviteId: string,
    decisao: "aprovar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return { error: "Não autenticado." };

    // Buscar convite e verificar que é do menor vinculado a este responsável
    const [convite] = await sql<
        {
            id: string;
            atleta_id: string;
            equipa_id: string | null;
            treinador_id: string;
            organization_id: string;
            equipa_nome: string | null;
            treinador_nome: string;
        }[]
    >`
        SELECT ce.id, ce.atleta_id, ce.equipa_id, ce.treinador_id,
               ce.organization_id, ce.equipa_nome, ce.treinador_nome
        FROM convites_equipa ce
        INNER JOIN atletas a ON a.id = ce.atleta_id
        WHERE ce.id = ${conviteId}
          AND ce.estado = 'pendente_responsavel'
          AND a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    if (!convite) return { error: "Convite não encontrado ou não autorizado." };

    if (decisao === "rejeitar") {
        await sql`
            UPDATE convites_equipa SET estado = 'recusado', updated_at = NOW()
            WHERE id = ${conviteId}
        `;

        // Notificar treinador
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${convite.organization_id},
                ${convite.treinador_id},
                'Convite recusado pelo responsável',
                ${`O encarregado de educação recusou o convite de equipa${convite.equipa_nome ? ` "${convite.equipa_nome}"` : ""} para o atleta menor.`},
                'convite_equipa',
                false,
                NOW()
            )
        `.catch(() => {});
    } else {
        // Aprovar — executar a lógica original de aceitação
        await sql`
            UPDATE convites_equipa SET estado = 'aceite', updated_at = NOW()
            WHERE id = ${conviteId}
        `;

        if (convite.equipa_id) {
            await sql`
                UPDATE atletas SET equipa_id = ${convite.equipa_id}
                WHERE id = ${convite.atleta_id}
            `.catch(() => {});
        }

        // Notificar treinador
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${convite.organization_id},
                ${convite.treinador_id},
                'Convite aprovado pelo responsável',
                ${`O encarregado de educação aprovou o convite de equipa${convite.equipa_nome ? ` "${convite.equipa_nome}"` : ""} para o atleta menor.`},
                'convite_equipa',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    revalidatePath("/dashboard/responsavel/autorizacoes");
    return null;
}

/**
 * Responsável aprova ou rejeita um convite de clube pendente.
 */
export async function aprovarConviteClube(
    relacaoId: string,
    decisao: "aprovar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return { error: "Não autenticado." };

    const [relacao] = await sql<
        {
            id: string;
            atleta_user_id: string;
            alvo_clube_id: string;
            alvo_equipa_id: string | null;
            alvo_nome: string;
        }[]
    >`
        SELECT arp.id, arp.atleta_user_id, arp.alvo_clube_id::text, arp.alvo_equipa_id::text, arp.alvo_nome
        FROM atleta_relacoes_pendentes arp
        INNER JOIN atletas a ON a.user_id = arp.atleta_user_id
        WHERE arp.id = ${relacaoId}
          AND arp.relation_kind = 'clube'
          AND arp.status = 'pendente_responsavel'
          AND a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    if (!relacao) return { error: "Convite não encontrado ou não autorizado." };

    if (decisao === "rejeitar") {
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'recusado', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;

        // Desvincula atleta do treinador (equipa_id = NULL)
        await sql`
            UPDATE atletas SET equipa_id = NULL, updated_at = NOW()
            WHERE user_id = ${relacao.atleta_user_id}
        `.catch(() => {});
    } else {
        // Aprovar — executar lógica de aceitação do clube
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'aceite', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;

        // Mover utilizador para a organização do clube
        await sql`
            UPDATE users SET organization_id = ${relacao.alvo_clube_id}, updated_at = NOW()
            WHERE id = ${relacao.atleta_user_id}
        `.catch(() => {});

        // Atualizar atleta
        // Verificar conflito: treinador independente
        const meOrg = await sql<{ organization_id: string | null }[]>`
            SELECT organization_id FROM users WHERE id = ${relacao.atleta_user_id} LIMIT 1
        `.catch(() => []);
        let suspenso = false;
        const currentOrg = meOrg[0]?.organization_id;
        if (currentOrg) {
            const clubeAtual = await sql<{ id: string }[]>`
                SELECT c.id FROM clubes c WHERE c.organization_id = ${currentOrg} LIMIT 1
            `.catch(() => []);
            const treinadorNaOrg = await sql<{ id: string }[]>`
                SELECT u.id FROM users u WHERE u.organization_id = ${currentOrg} AND u.id != ${relacao.atleta_user_id} LIMIT 1
            `.catch(() => []);
            if (clubeAtual.length === 0 && treinadorNaOrg.length > 0) {
                suspenso = true;
            }
        }

        const estadoAtleta = suspenso ? "Suspenso" : "Ativo";
        await sql`
            UPDATE atletas
            SET organization_id = ${relacao.alvo_clube_id},
                estado = ${estadoAtleta},
                equipa_id = ${relacao.alvo_equipa_id ?? null},
                updated_at = NOW()
            WHERE user_id = ${relacao.atleta_user_id}
        `.catch(() => {});
    }

    revalidatePath("/dashboard/responsavel/autorizacoes");
    return null;
}

/**
 * Responsável aprova ou rejeita um pedido de plano pendente.
 */
export async function aprovarPedidoPlano(
    pedidoId: string,
    decisao: "aprovar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return { error: "Não autenticado." };

    const [pedido] = await sql<
        {
            id: string;
            user_id: string;
            organization_id: string;
            plano_solicitado: string;
        }[]
    >`
        SELECT pp.id, pp.user_id, pp.organization_id, pp.plano_solicitado
        FROM pedidos_plano pp
        INNER JOIN atletas a ON a.user_id = pp.user_id
        WHERE pp.id = ${pedidoId}
          AND pp.status = 'pendente_responsavel'
          AND a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    if (!pedido) return { error: "Pedido não encontrado ou não autorizado." };

    if (decisao === "rejeitar") {
        await sql`
            UPDATE pedidos_plano SET status = 'rejeitado', updated_at = NOW()
            WHERE id = ${pedidoId}
        `;
    } else {
        // Aprovar — mover para estado pendente (admin ainda precisa aprovar a mudança efetiva)
        await sql`
            UPDATE pedidos_plano SET status = 'pendente', updated_at = NOW()
            WHERE id = ${pedidoId}
        `;

        // Recriar notificação para admin
        const planoLabel: Record<string, string> = {
            team: "Team",
            club_pro: "Club Pro",
            legend: "Legend",
        };

        const [userData] = await sql<{ name: string }[]>`
            SELECT name FROM users WHERE id = ${pedido.user_id} LIMIT 1
        `.catch(() => [{ name: "Atleta" }]);

        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${pedido.organization_id},
                NULL,
                'Pedido de Alteração de Plano (aprovado pelo responsável)',
                ${`O responsável aprovou o pedido do atleta "${userData.name}" para o plano ${planoLabel[pedido.plano_solicitado] || pedido.plano_solicitado}.`},
                'Aviso',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    revalidatePath("/dashboard/responsavel/autorizacoes");
    return null;
}

/**
 * Responsável aprova ou rejeita alterações de dados pendentes de um menor.
 * O id recebido é o user_id do atleta (não um ID de pedido).
 */
export async function aprovarAlteracaoDados(
    atletaUserId: string,
    decisao: "aprovar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return { error: "Não autenticado." };

    const [atleta] = await sql<
        {
            user_id: string;
            dados_pendentes: Record<string, unknown> | null;
        }[]
    >`
        SELECT user_id, dados_pendentes
        FROM atletas
        WHERE user_id = ${atletaUserId}
          AND menor_idade = true
          AND encarregado_educacao = ${guardianEmail}
          AND dados_pendentes IS NOT NULL
        LIMIT 1
    `;
    if (!atleta) return { error: "Pedido não encontrado ou não autorizado." };

    if (decisao === "rejeitar") {
        await sql`
            UPDATE atletas SET dados_pendentes = NULL, updated_at = NOW()
            WHERE user_id = ${atletaUserId}
        `;
        revalidatePath("/dashboard/responsavel/autorizacoes");
        return null;
    }

    // Aprovar — aplicar as alterações pendentes
    const pending = atleta.dados_pendentes as Record<string, unknown>;
    const usersChanges = (pending?.users ?? {}) as Record<string, unknown>;
    const atletasChanges = (pending?.atletas ?? {}) as Record<string, unknown>;

    if (Object.keys(usersChanges).length > 0) {
        if (usersChanges.name !== undefined) {
            await sql`UPDATE users SET name = ${String(usersChanges.name)}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
            const [clerkRow] = await sql<{ clerk_user_id: string }[]>`
                SELECT clerk_user_id FROM users WHERE id = ${atletaUserId} LIMIT 1
            `.catch(() => []);
            if (clerkRow?.clerk_user_id) {
                const parts = String(usersChanges.name).split(" ");
                await fetch(
                    `https://api.clerk.com/v1/users/${clerkRow.clerk_user_id}`,
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            first_name: parts[0] || "",
                            last_name: parts.slice(1).join(" ") || "",
                        }),
                    },
                ).catch(() => {});
            }
        }
        if (usersChanges.telefone !== undefined)
            await sql`UPDATE users SET telefone = ${usersChanges.telefone as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
        if (usersChanges.morada !== undefined)
            await sql`UPDATE users SET morada = ${usersChanges.morada as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
        if (usersChanges.cidade !== undefined)
            await sql`UPDATE users SET cidade = ${usersChanges.cidade as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
        if (usersChanges.codigo_postal !== undefined)
            await sql`UPDATE users SET codigo_postal = ${usersChanges.codigo_postal as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
        if (usersChanges.pais !== undefined)
            await sql`UPDATE users SET pais = ${usersChanges.pais as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
        if (usersChanges.data_nascimento !== undefined)
            await sql`UPDATE users SET data_nascimento = ${usersChanges.data_nascimento as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
        if (usersChanges.nif !== undefined)
            await sql`UPDATE users SET nif = ${usersChanges.nif as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
        if (usersChanges.image_url !== undefined)
            await sql`UPDATE users SET image_url = ${usersChanges.image_url as string | null}, updated_at = NOW() WHERE id = ${atletaUserId}`.catch(
                () => {},
            );
    }

    if (Object.keys(atletasChanges).length > 0) {
        if (atletasChanges.mao_dominante !== undefined)
            await sql`UPDATE atletas SET mao_dominante = ${atletasChanges.mao_dominante as string | null}, updated_at = NOW() WHERE user_id = ${atletaUserId}`.catch(
                () => {},
            );
        if (atletasChanges.encarregado_educacao !== undefined)
            await sql`UPDATE atletas SET encarregado_educacao = ${atletasChanges.encarregado_educacao as string | null}, updated_at = NOW() WHERE user_id = ${atletaUserId}`.catch(
                () => {},
            );
        if (atletasChanges.peso_kg !== undefined)
            await sql`UPDATE atletas SET peso_kg = ${atletasChanges.peso_kg as number | null}, updated_at = NOW() WHERE user_id = ${atletaUserId}`.catch(
                () => {},
            );
        if (atletasChanges.altura_cm !== undefined)
            await sql`UPDATE atletas SET altura_cm = ${atletasChanges.altura_cm as number | null}, updated_at = NOW() WHERE user_id = ${atletaUserId}`.catch(
                () => {},
            );
    }

    // Limpar dados pendentes
    await sql`
        UPDATE atletas SET dados_pendentes = NULL, updated_at = NOW()
        WHERE user_id = ${atletaUserId}
    `;

    revalidatePath("/dashboard/responsavel/autorizacoes");
    revalidatePath("/dashboard/atleta/perfil");
    revalidatePath("/dashboard/atleta/geral");
    return null;
}

/**
 * Responsável edita directamente os dados cadastrais do menor.
 * (Menores não podem editar os próprios dados cadastrais.)
 */
export async function editarDadosCadastraisEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return { error: "Não autenticado." };

    // Buscar menor vinculado a este responsável
    const [minor] = await sql<{ user_id: string }[]>`
        SELECT a.user_id
        FROM atletas a
        WHERE a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    if (!minor) return { error: "Nenhum atleta menor vinculado à sua conta." };

    const firstName = formData.get("firstName")?.toString().trim();
    const lastName = formData.get("lastName")?.toString().trim();
    const telefoneRaw = formData.get("telefone")?.toString().trim() || null;
    const morada = formData.get("morada")?.toString().trim() || null;
    const cidade = formData.get("cidade")?.toString().trim() || null;
    const codigoPostal =
        formData.get("codigo_postal")?.toString().trim() || null;
    const pais = formData.get("pais")?.toString().trim() || null;
    const nifRaw = formData.get("nif")?.toString().trim() || null;

    // Normalizar telefone: guardar apenas os 9 dígitos
    const telefone = telefoneRaw
        ? telefoneRaw.replace(/\D/g, "").replace(/^351/, "").slice(0, 9) || null
        : null;

    // Normalizar NIF: guardar apenas os 9 dígitos
    const nif = nifRaw ? nifRaw.replace(/\D/g, "").slice(0, 9) || null : null;

    if (!firstName) return { error: "Nome é obrigatório." };
    if (!lastName) return { error: "Apelido é obrigatório." };

    if (telefone && telefone.length !== 9) {
        return { error: "Telefone deve ter 9 dígitos." };
    }
    if (nif && nif.length !== 9) {
        return { error: "NIF deve ter 9 dígitos." };
    }
    if (codigoPostal && !/^\d{4}-\d{3}$/.test(codigoPostal)) {
        return { error: "Código postal deve ter o formato 0000-000." };
    }

    const fullName = `${firstName} ${lastName}`.trim();

    try {
        // Atualizar dados pessoais na BD
        await sql`
            UPDATE users
            SET name = ${fullName},
                telefone = ${telefone},
                morada = ${morada},
                cidade = ${cidade},
                codigo_postal = ${codigoPostal},
                pais = ${pais},
                nif = ${nif},
                updated_at = NOW()
            WHERE id = ${minor.user_id}
        `;

        // Sincronizar nome com o Clerk
        const [clerkRow] = await sql<{ clerk_user_id: string }[]>`
            SELECT clerk_user_id FROM users WHERE id = ${minor.user_id} LIMIT 1
        `.catch(() => []);
        if (clerkRow?.clerk_user_id) {
            await fetch(
                `https://api.clerk.com/v1/users/${clerkRow.clerk_user_id}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                    }),
                },
            ).catch(() => {});
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar dados do atleta." };
    }

    revalidatePath("/dashboard/responsavel/dados-educando");
    revalidatePath("/dashboard/atleta/perfil");
    return { success: true };
}

export async function editarInfoDesportivaEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return { error: "Não autenticado." };

    const [minor] = await sql<{ user_id: string }[]>`
        SELECT a.user_id
        FROM atletas a
        WHERE a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    if (!minor) return { error: "Nenhum atleta menor vinculado à sua conta." };

    const alturaRaw = formData.get("altura_cm")?.toString().trim() || "";
    const pesoRaw = formData.get("peso_kg")?.toString().trim() || "";
    const maoDominante =
        formData.get("mao_dominante")?.toString().trim() || null;

    let alturaCm: number | null = null;
    if (alturaRaw) {
        alturaCm = parseInt(alturaRaw, 10);
        if (isNaN(alturaCm) || alturaCm < 100 || alturaCm > 300) {
            return { error: "Altura deve estar entre 100 e 300 cm." };
        }
    }

    let pesoKg: number | null = null;
    if (pesoRaw) {
        pesoKg = parseFloat(pesoRaw);
        if (isNaN(pesoKg) || pesoKg < 10 || pesoKg > 300) {
            return { error: "Peso deve estar entre 10 e 300 kg." };
        }
    }

    if (
        maoDominante &&
        !["direita", "esquerda", "ambidestro"].includes(maoDominante)
    ) {
        return { error: "Mão dominante inválida." };
    }

    try {
        await sql`
            UPDATE atletas
            SET altura_cm = ${alturaCm},
                peso_kg = ${pesoKg},
                mao_dominante = ${maoDominante},
                updated_at = NOW()
            WHERE user_id = ${minor.user_id}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar informações desportivas." };
    }

    revalidatePath("/dashboard/responsavel/dados-educando");
    revalidatePath("/dashboard/atleta/perfil");
    return { success: true };
}

/**
 * Responsável solicita troca de plano em nome do menor.
 * O pedido vai diretamente para o admin (status 'pendente').
 */
export async function solicitarTrocaPlanoEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return { error: "Não autenticado." };

    const plano = String(formData.get("plano") || "").trim();
    const planosValidos = ["team", "club_pro", "legend"];
    if (!planosValidos.includes(plano)) {
        return { error: "Plano inválido." };
    }

    // Buscar menor vinculado
    const [minor] = await sql<
        { user_id: string; organization_id: string; name: string }[]
    >`
        SELECT u.id AS user_id, u.organization_id, u.name
        FROM atletas a
        INNER JOIN users u ON u.id = a.user_id
        WHERE a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    if (!minor) return { error: "Nenhum atleta menor vinculado à sua conta." };

    // Verificar se já existe pedido pendente
    const existing = await sql<{ id: string }[]>`
        SELECT id FROM pedidos_plano
        WHERE user_id = ${minor.user_id} AND status IN ('pendente', 'pendente_responsavel')
        LIMIT 1
    `;
    if (existing.length) {
        return {
            error: "Já existe um pedido de alteração de plano em análise para este atleta.",
        };
    }

    // Criar pedido directamente como "pendente" (admin aprova)
    await sql`
        INSERT INTO pedidos_plano (user_id, organization_id, plano_solicitado, status)
        VALUES (${minor.user_id}, ${minor.organization_id}, ${plano}, 'pendente')
    `;

    const planoLabel: Record<string, string> = {
        team: "Team",
        club_pro: "Club Pro",
        legend: "Legend",
    };

    // Notificar admin
    await sql`
        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
        VALUES (
            gen_random_uuid(),
            ${minor.organization_id},
            NULL,
            'Pedido de Alteração de Plano (Menor)',
            ${`O encarregado de educação solicitou a alteração para o plano ${planoLabel[plano] || plano} para o atleta "${minor.name}".`},
            'Aviso',
            false,
            NOW()
        )
    `.catch(() => {});

    revalidatePath("/dashboard/responsavel/dados-educando");
    return { success: true };
}

// ---------- MÉDICO DO EDUCANDO ----------

/**
 * Retorna o email do menor vinculado ao responsável autenticado.
 */
async function getMinorEmail(): Promise<string | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return null;

    const [minor] = await sql<{ email: string }[]>`
        SELECT u.email
        FROM atletas a
        INNER JOIN users u ON u.id = a.user_id
        WHERE a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    return minor?.email ?? null;
}

/**
 * Retorna o user_id do menor vinculado ao responsável autenticado.
 */
async function getMinorUserId(): Promise<string | null> {
    const guardianEmail = await getGuardianEmail();
    if (!guardianEmail) return null;

    const [minor] = await sql<{ user_id: string }[]>`
        SELECT a.user_id
        FROM atletas a
        WHERE a.menor_idade = true
          AND a.encarregado_educacao = ${guardianEmail}
        LIMIT 1
    `;
    return minor?.user_id ?? null;
}

export async function editarRegistoMedicoEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const minorEmail = await getMinorEmail();
    if (!minorEmail)
        return { error: "Não autenticado ou sem menor vinculado." };

    const id = formData.get("id")?.toString().trim();
    const descricao = formData.get("descricao")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString().trim();
    const dataPrevistaRetorno =
        formData.get("data_prevista_retorno")?.toString().trim() || null;
    const observacoes = formData.get("observacoes")?.toString().trim() || null;
    const estado = formData.get("estado")?.toString().trim();

    if (!id) return { error: "ID inválido." };
    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };
    if (estado !== "ativo" && estado !== "resolvido")
        return { error: "Estado inválido." };

    try {
        const updated = await sql`
            UPDATE medico
            SET descricao             = ${descricao},
                data_inicio           = ${dataInicio},
                data_prevista_retorno = ${dataPrevistaRetorno},
                observacoes           = ${observacoes},
                estado                = ${estado}
            WHERE id    = ${id}
              AND email = ${minorEmail}
            RETURNING id
        `;
        if (updated.length === 0) return { error: "Registo não encontrado." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar registo médico." };
    }

    revalidatePath("/dashboard/responsavel/medico");
    return { success: true };
}

export async function apagarRegistoMedicoEducando(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    const minorEmail = await getMinorEmail();
    if (!minorEmail)
        return { error: "Não autenticado ou sem menor vinculado." };

    try {
        const deleted = await sql`
            DELETE FROM medico
            WHERE id    = ${id}
              AND email = ${minorEmail}
            RETURNING id
        `;
        if (deleted.length === 0) return { error: "Registo não encontrado." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao apagar registo médico." };
    }

    revalidatePath("/dashboard/responsavel/medico");
    return { success: true };
}

// ---------- CONDIÇÃO FÍSICA DO EDUCANDO ----------

export async function editarMedidaCondicaoFisicaEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const minorUserId = await getMinorUserId();
    if (!minorUserId)
        return { error: "Não autenticado ou sem menor vinculado." };

    const id = formData.get("id")?.toString().trim();
    const alturaStr = formData.get("altura")?.toString().trim();
    const pesoStr = formData.get("peso")?.toString().trim();
    const dataRegisto = formData.get("data_registo")?.toString().trim();

    if (!id) return { error: "ID inválido." };

    const altura = alturaStr ? parseFloat(alturaStr) : NaN;
    const peso = pesoStr ? parseFloat(pesoStr) : NaN;

    if (isNaN(altura) || altura <= 0) return { error: "Altura inválida." };
    if (isNaN(peso) || peso <= 0) return { error: "Peso inválido." };
    if (!dataRegisto) return { error: "Data do registo é obrigatória." };

    try {
        const updated = await sql`
            UPDATE condicao_fisica
            SET altura       = ${altura},
                peso         = ${peso},
                data_registo = ${dataRegisto}::date
            WHERE id      = ${id}
              AND user_id  = ${minorUserId}
            RETURNING id
        `;
        if (updated.length === 0) return { error: "Registo não encontrado." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar medida." };
    }

    revalidatePath("/dashboard/responsavel/condicao-fisica");
    return { success: true };
}

export async function apagarMedidaCondicaoFisicaEducando(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    const minorUserId = await getMinorUserId();
    if (!minorUserId)
        return { error: "Não autenticado ou sem menor vinculado." };

    try {
        const deleted = await sql`
            DELETE FROM condicao_fisica
            WHERE id      = ${id}
              AND user_id  = ${minorUserId}
            RETURNING id
        `;
        if (deleted.length === 0) return { error: "Registo não encontrado." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao apagar medida." };
    }

    revalidatePath("/dashboard/responsavel/condicao-fisica");
    return { success: true };
}

export async function adicionarLesaoEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const minorEmail = await getMinorEmail();
    if (!minorEmail)
        return { error: "Não autenticado ou sem menor vinculado." };

    const descricao = formData.get("descricao")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString().trim();
    const dataPrevistaRetorno =
        formData.get("data_prevista_retorno")?.toString().trim() || null;
    const observacoes = formData.get("observacoes")?.toString().trim() || null;

    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };

    try {
        await sql`
            INSERT INTO medico (email, tipo, descricao, data_inicio, data_prevista_retorno, observacoes, estado)
            VALUES (${minorEmail}, 'lesao', ${descricao}, ${dataInicio}, ${dataPrevistaRetorno}, ${observacoes}, 'ativo')
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar lesão." };
    }

    revalidatePath("/dashboard/responsavel/medico");
    return { success: true };
}

export async function adicionarDoencaEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const minorEmail = await getMinorEmail();
    if (!minorEmail)
        return { error: "Não autenticado ou sem menor vinculado." };

    const descricao = formData.get("descricao")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString().trim();
    const dataPrevistaRetorno =
        formData.get("data_prevista_retorno")?.toString().trim() || null;
    const observacoes = formData.get("observacoes")?.toString().trim() || null;

    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };

    try {
        await sql`
            INSERT INTO medico (email, tipo, descricao, data_inicio, data_prevista_retorno, observacoes, estado)
            VALUES (${minorEmail}, 'doenca', ${descricao}, ${dataInicio}, ${dataPrevistaRetorno}, ${observacoes}, 'ativo')
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar doença." };
    }

    revalidatePath("/dashboard/responsavel/medico");
    return { success: true };
}

export async function registarMedidaCondicaoFisicaEducando(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const minorUserId = await getMinorUserId();
    if (!minorUserId)
        return { error: "Não autenticado ou sem menor vinculado." };

    const alturaStr = formData.get("altura")?.toString().trim();
    const pesoStr = formData.get("peso")?.toString().trim();
    const dataRegisto = formData.get("data_registo")?.toString().trim() || null;

    const altura = alturaStr ? parseFloat(alturaStr) : NaN;
    const peso = pesoStr ? parseFloat(pesoStr) : NaN;

    if (isNaN(altura) || altura <= 0) return { error: "Altura inválida." };
    if (isNaN(peso) || peso <= 0) return { error: "Peso inválido." };
    if (dataRegisto && dataRegisto > new Date().toISOString().split("T")[0])
        return { error: "A data do registo não pode ser futura." };

    try {
        await sql`
            INSERT INTO condicao_fisica (user_id, altura, peso, data_registo)
            VALUES (${minorUserId}, ${altura}, ${peso}, ${dataRegisto ?? "CURRENT_DATE"}::date)
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao guardar medida." };
    }

    revalidatePath("/dashboard/responsavel/condicao-fisica");
    return { success: true };
}
