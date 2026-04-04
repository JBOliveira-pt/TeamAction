"use server";

import { sql } from "./_shared";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

// ========================================
// NotificaÃ§Ãµes Actions
// ========================================

export async function marcarTodasComoLidas(
    prevState: { error?: string; success?: boolean } | null,
    _formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "NÃ£o foi possÃ­vel identificar a organizaÃ§Ã£o." };
    }

    try {
        await sql`
            UPDATE notificacoes SET lida = true
            WHERE organization_id = ${organizationId} AND lida = false
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao marcar notificaÃ§Ãµes." };
    }

    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

export async function marcarNotificacaoComoLida(id: string): Promise<void> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return;
    }

    try {
        await sql`
            UPDATE notificacoes SET lida = true
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
    }

    revalidatePath("/dashboard/presidente/notificacoes");
}
