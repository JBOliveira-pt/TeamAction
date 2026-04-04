"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ========================================
// Atleta Actions (Modal)
// ========================================

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
    const federado = formData.get("federado") === "on";
    const numFederado =
        formData.get("numero_federado")?.toString().trim() || null;
    const maoDominante = formData.get("mao_dominante")?.toString() || null;

    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };

    try {
        await sql`
            INSERT INTO atletas (
                id, nome, posicao, numero_camisola,
                equipa_id, estado, federado, numero_federado,
                mao_dominante, organization_id
            ) VALUES (
                gen_random_uuid(), ${nome}, ${posicao},
                ${numCamisola ? parseInt(numCamisola) : null},
                ${equipaId}, ${estado}, ${federado}, ${numFederado},
                ${maoDominante}, ${organizationId}
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
    const federado = formData.get("federado") === "on";
    const numFederado =
        formData.get("numero_federado")?.toString().trim() || null;
    const maoDominante = formData.get("mao_dominante")?.toString() || null;

    if (!id) return { error: "ID do atleta em falta." };
    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };

    try {
        await sql`
            UPDATE atletas SET
                nome             = ${nome},
                posicao          = ${posicao},
                numero_camisola  = ${numCamisola ? parseInt(numCamisola) : null},
                equipa_id        = ${equipaId},
                estado           = ${estado},
                federado         = ${federado},
                numero_federado  = ${numFederado},
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
