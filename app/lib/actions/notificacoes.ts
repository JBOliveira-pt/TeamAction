"use server";

import { sql } from "./_shared";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

// ========================================
// Notificações Actions
// ========================================

function revalidateNotificacoes() {
    revalidatePath("/dashboard/presidente/notificacoes");
    revalidatePath("/dashboard/treinador/notificacoes");
    revalidatePath("/dashboard/atleta/notificacoes");
    revalidatePath("/dashboard/responsavel/notificacoes");
}

export async function marcarTodasComoLidas(
    prevState: { error?: string; success?: boolean } | null,
    _formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    try {
        await sql`
            UPDATE notificacoes SET lida = true
            WHERE organization_id = ${organizationId} AND lida = false
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao marcar notificações." };
    }

    revalidateNotificacoes();
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

    revalidateNotificacoes();
}

export async function toggleNotificacaoLida(
    id: string,
    atualmenteLida: boolean,
): Promise<void> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return;
    }

    try {
        await sql`
            UPDATE notificacoes SET lida = ${!atualmenteLida}
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
    }

    revalidateNotificacoes();
}
