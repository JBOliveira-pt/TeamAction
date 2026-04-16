// Actions de notificações: marcar como lida e eliminar.
"use server";

import { sql } from "./_shared";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

function revalidateNotificacoes() {
    revalidatePath("/dashboard/presidente/notificacoes");
    revalidatePath("/dashboard/treinador/notificacoes");
    revalidatePath("/dashboard/atleta/notificacoes");
    revalidatePath("/dashboard/responsavel/notificacoes");
}

async function getDbUserId(): Promise<string | null> {
    const { userId } = await auth();
    if (!userId) return null;
    const [row] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    return row?.id ?? null;
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

    const dbUserId = await getDbUserId();

    try {
        await sql`
            UPDATE notificacoes SET lida = true
            WHERE lida = false
              AND (
                (organization_id = ${organizationId} AND recipient_user_id IS NULL)
                ${dbUserId ? sql`OR recipient_user_id = ${dbUserId}` : sql``}
              )
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

    const dbUserId = await getDbUserId();

    try {
        await sql`
            UPDATE notificacoes SET lida = true
            WHERE id = ${id}
              AND (
                organization_id = ${organizationId}
                ${dbUserId ? sql`OR recipient_user_id = ${dbUserId}` : sql``}
              )
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

    const dbUserId = await getDbUserId();

    try {
        await sql`
            UPDATE notificacoes SET lida = ${!atualmenteLida}
            WHERE id = ${id}
              AND (
                organization_id = ${organizationId}
                ${dbUserId ? sql`OR recipient_user_id = ${dbUserId}` : sql``}
              )
        `;
    } catch (error) {
        console.error(error);
    }

    revalidateNotificacoes();
}
