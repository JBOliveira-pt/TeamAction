"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

export async function searchClubes(
    query: string,
): Promise<{ id: string; nome: string }[]> {
    if (!query || query.trim().length < 2) return [];
    try {
        const results = await sql<{ id: string; nome: string }[]>`
            SELECT id, nome
            FROM organizations
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

export async function searchUsuarios(
    query: string,
): Promise<
    { id: string; name: string; email: string; image_url: string | null }[]
> {
    if (!query || query.trim().length < 2) return [];
    try {
        const organizationId = await getOrganizationId();
        return await sql<
            {
                id: string;
                name: string;
                email: string;
                image_url: string | null;
            }[]
        >`
            SELECT u.id, u.name, u.email, u.image_url
            FROM users u
            WHERE (
                u.name  ILIKE ${"%" + query.trim() + "%"} OR
                u.email ILIKE ${"%" + query.trim() + "%"}
            )
            AND u.organization_id != ${organizationId}
            AND u.id NOT IN (
                SELECT arp.atleta_user_id
                FROM atleta_relacoes_pendentes arp
                WHERE arp.alvo_clube_id = ${organizationId}
                AND arp.status = 'pendente'
            )
            LIMIT 6
        `;
    } catch (error) {
        console.error("Erro ao pesquisar utilizadores", error);
        return [];
    }
}

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

    if (!atletaUserId) return { error: "Seleciona um atleta." };

    // Verificar se já existe convite pendente
    const existing = await sql<{ id: string }[]>`
        SELECT id FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${atletaUserId}
        AND alvo_clube_id    = ${organizationId}
        AND status           = 'pendente'
    `;
    if (existing.length > 0)
        return { error: "Já existe um convite pendente para este atleta." };

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

    // Buscar info do clube
    const org = await sql<{ name: string; email: string }[]>`
        SELECT name, email FROM organizations WHERE id = ${organizationId}
    `;
    const orgName = org[0]?.name ?? "Clube";
    const orgEmail = org[0]?.email ?? "";

    // Criar convite
    try {
        await sql`
            INSERT INTO atleta_relacoes_pendentes (
                id, atleta_user_id, alvo_clube_id, alvo_equipa_id,
                relation_kind, status, alvo_nome, alvo_email,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), ${atletaUserId}, ${organizationId}, ${equipaId},
                'clube', 'pendente', ${orgName}, ${orgEmail},
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
        const result = await sql<{ escalao: string }[]>`
      SELECT DISTINCT e.nome AS escalao
      FROM user_cursos uc
      INNER JOIN cursos c ON uc.curso_id = c.id
      INNER JOIN escaloes e ON c.level_id = e.id
      WHERE uc.user_id = ${userId}
    `;
        return result.map((r: { escalao: string }) => r.escalao);
    } catch {
        return [];
    }
}
