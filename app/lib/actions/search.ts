// Actions de pesquisa: buscar e convidar atletas/treinadores.
"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "@/app/lib/data";
import { isIdadePermitidaEscalao } from "@/app/lib/grau-escalao-compat";
import { revalidatePath } from "next/cache";

export async function searchClubes(
    query: string,
): Promise<{ id: string; nome: string }[]> {
    if (!query || query.trim().length < 2) return [];
    try {
        const results = await sql<{ id: string; nome: string }[]>`
            SELECT organization_id AS id, nome
            FROM clubes
            WHERE nome ILIKE ${"%" + query.trim() + "%"}
            LIMIT 6
        `;
        return results;
    } catch (error) {
        console.error("Erro ao pesquisar clubes", error);
        return [];
    }
}

// ── ATLETAS ────────────────────────────────────────────

export async function convidarAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { error: "Não autenticado." };

    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Organização não encontrada." };
    }

    const atletaUserId = formData.get("atleta_user_id")?.toString();
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const numeroFederado =
        formData.get("numero_federado")?.toString().trim() || null;

    if (!atletaUserId) return { error: "Seleciona um atleta." };
    if (!numeroFederado || !/^\d{6}$/.test(numeroFederado)) {
        return {
            error: "O nº de federado é obrigatório e deve ter exatamente 6 dígitos.",
        };
    }

    // Buscar clube
    const clubeRow = await sql<{ id: string; nome: string }[]>`
        SELECT id, nome FROM clubes WHERE organization_id = ${organizationId} LIMIT 1
    `;
    const clubeId = clubeRow[0]?.id;
    if (!clubeId) return { error: "Clube não encontrado." };
    const clubeNome = clubeRow[0].nome;

    // Validar unicidade do nº federado dentro da organização
    const duplicadoFederado = await sql<{ id: string }[]>`
        SELECT id FROM atletas
        WHERE organization_id = ${organizationId}
          AND numero_federado = ${numeroFederado}
        LIMIT 1
    `;
    if (duplicadoFederado.length > 0) {
        return {
            error: `Já existe um atleta com o nº federado ${numeroFederado} neste clube.`,
        };
    }

    // Verificar se já existe convite pendente
    const existing = await sql<{ id: string }[]>`
        SELECT id FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${atletaUserId}
        AND alvo_clube_id    = ${clubeId}
        AND status           = 'pendente'
    `;
    if (existing.length > 0)
        return { error: "Já existe um convite pendente para este atleta." };

    // Validar idade do atleta vs escalão da equipa
    if (equipaId) {
        const equipaRow = await sql<{ escalao: string | null }[]>`
            SELECT escalao FROM equipas WHERE id = ${equipaId} LIMIT 1
        `;
        const escalao = equipaRow[0]?.escalao;
        if (escalao) {
            const atletaRow = await sql<{ data_nascimento: string | null }[]>`
                SELECT data_nascimento FROM users
                WHERE id = ${atletaUserId} LIMIT 1
            `;
            const dataNasc = atletaRow[0]?.data_nascimento;

            if (dataNasc) {
                const birth = new Date(dataNasc);
                const today = new Date();
                let idade = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
                    idade--;
                if (!isIdadePermitidaEscalao(idade, escalao)) {
                    return {
                        error: `O atleta tem ${idade} anos e não pode ser inscrito numa equipa de escalão ${escalao}.`,
                    };
                }
            }
        }
    }

    // Req 4: verificar se atleta já está vinculado a um treinador independente
    // (org sem clube) — se sim, avisar que ao aceitar ficará suspenso
    const atletaOrgInfo = await sql<{ organization_id: string | null }[]>`
        SELECT organization_id FROM users WHERE id = ${atletaUserId} LIMIT 1
    `;
    const atletaOrgAtual = atletaOrgInfo[0]?.organization_id;
    let avisoConflito = false;
    if (atletaOrgAtual && atletaOrgAtual !== organizationId) {
        const clubeNaOrgAtleta = await sql<{ id: string }[]>`
            SELECT id FROM clubes WHERE organization_id = ${atletaOrgAtual} LIMIT 1
        `;
        if (clubeNaOrgAtleta.length === 0) {
            // Atleta está numa org sem clube (treinador independente)
            avisoConflito = true;
        }
    }

    // Buscar nome da org (fallback)
    const org = await sql<{ name: string }[]>`
        SELECT name FROM organizations WHERE id = ${organizationId} LIMIT 1
    `;
    const orgName = clubeNome ?? org[0]?.name ?? "Clube";
    const orgEmail = "";

    // Criar convite
    try {
        await sql`
            INSERT INTO atleta_relacoes_pendentes (
                id, atleta_user_id, alvo_clube_id, alvo_equipa_id,
                relation_kind, status, alvo_nome, alvo_email,
                numero_federado,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), ${atletaUserId}, ${clubeId}, ${equipaId},
                'clube', 'pendente', ${orgName}, ${orgEmail},
                ${numeroFederado},
                NOW(), NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao enviar convite." };
    }

    // Notificação para o atleta (na organização dele)
    try {
        const atletaUser = await sql<{ organization_id: string | null }[]>`
            SELECT organization_id FROM users WHERE id = ${atletaUserId}
        `;
        const atletaOrgId = atletaUser[0]?.organization_id;

        if (atletaOrgId) {
            const tituloNotif = avisoConflito
                ? "Convite de clube — atenção: conflito de vinculação"
                : "Convite de federação";
            const descricaoNotif = avisoConflito
                ? `O clube '${orgName}' convidou-te para integrar os seus quadros. Atenção: já estás vinculado a um treinador independente. Se aceitares, o teu perfil ficará suspenso até o administrador resolver a situação.`
                : `Parabéns! O clube '${orgName}' quer que se junte aos seus quadros como atleta federado! Se concordar, entre em contacto com o responsável do clube '${orgName}' para tratar dos documentos necessários.`;
            const tipoNotif = avisoConflito ? "Aviso" : "Info";
            await sql`
                INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${atletaOrgId},
                    ${tituloNotif},
                    ${descricaoNotif},
                    ${tipoNotif},
                    NOW()
                )
            `;
        }
    } catch (error) {
        console.error("Erro ao criar notificação:", error);
        // Não bloqueamos o convite por causa da notificação
    }

    revalidatePath("/dashboard/presidente/atletas");
    return { success: true };
}

export async function getEscaloesByUserAction(
    userId: string,
): Promise<string[]> {
    try {
        const { getEscaloesPermitidos } =
            await import("@/app/lib/grau-escalao-compat");
        const result = await sql<{ grau_id: number }[]>`
            SELECT DISTINCT g.id AS grau_id
            FROM user_cursos uc
            INNER JOIN cursos c ON uc.curso_id = c.id
            INNER JOIN graus_tecnicos g ON c.level_id = g.id
            WHERE uc.user_id = ${userId}
        `;
        const maxGrau = Math.max(0, ...result.map((r) => r.grau_id));
        if (maxGrau === 0) return [];
        return getEscaloesPermitidos(maxGrau);
    } catch {
        return [];
    }
}
