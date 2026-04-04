"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ========================================
// Staff Actions (Modal)
// ========================================

export async function adicionarMembro(
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
    const funcao = formData.get("funcao")?.toString() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;

    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!funcao) return { error: "FunÃ§Ã£o Ã© obrigatÃ³ria." };

    try {
        await sql`
            INSERT INTO staff (id, nome, funcao, equipa_id, organization_id)
            VALUES (gen_random_uuid(), ${nome}, ${funcao}, ${equipaId}, ${organizationId})
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
                'Novo membro de staff adicionado',
                ${`${nome} foi adicionado como ${funcao}${equipaId ? ` na equipa ${equipaNome}` : ""}.`},
                'Info',
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

    if (!id) return { error: "ID do membro em falta." };
    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!funcao) return { error: "FunÃ§Ã£o Ã© obrigatÃ³ria." };

    try {
        await sql`
            UPDATE staff SET
                nome      = ${nome},
                funcao    = ${funcao},
                equipa_id = ${equipaId}
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
        await sql`DELETE FROM staff WHERE id = ${id} AND organization_id = ${organizationId}`;
    } catch (error) {
        console.error(error);
        throw new Error("Erro ao remover membro.");
    }

    revalidatePath("/dashboard/presidente/staff");
}
