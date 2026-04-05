"use server";

import { auth } from "@clerk/nextjs/server";
import { sql, logAction } from "./_shared";
import { revalidatePath } from "next/cache";

export type PlanoPedido = {
    id: string;
    plano_solicitado: string;
    status: "pendente" | "aprovado" | "rejeitado";
    created_at: string;
};

async function ensurePedidosPlanoTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS pedidos_plano (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            organization_id UUID NOT NULL,
            plano_solicitado TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
}

export async function fetchPedidoPlano(): Promise<PlanoPedido | null> {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    await ensurePedidosPlanoTable();

    const rows = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!rows.length) return null;
    const dbUserId = rows[0].id;

    const pedidos = await sql<PlanoPedido[]>`
        SELECT id, plano_solicitado, status, created_at
        FROM pedidos_plano
        WHERE user_id = ${dbUserId}
          AND status = 'pendente'
        ORDER BY created_at DESC
        LIMIT 1
    `;

    return pedidos[0] ?? null;
}

export async function fetchPlanoAtual(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    const rows = await sql<{ plano: string | null }[]>`
        SELECT o.plano
        FROM users u
        JOIN organizations o ON o.id = u.organization_id
        WHERE u.clerk_user_id = ${userId}
        LIMIT 1
    `;

    return rows[0]?.plano ?? "rookie";
}

export async function solicitarTrocaPlano(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const plano = String(formData.get("plano") || "").trim();
    const planosValidos = ["team", "club_pro", "legend"];
    if (!planosValidos.includes(plano)) {
        return { error: "Plano inválido." };
    }

    const userRows = await sql<
        { id: string; organization_id: string; name: string }[]
    >`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!userRows.length) return { error: "Utilizador não encontrado." };

    const {
        id: dbUserId,
        organization_id: orgId,
        name: userName,
    } = userRows[0];

    // Check if there's already a pending request
    const existing = await sql<{ id: string }[]>`
        SELECT id FROM pedidos_plano
        WHERE user_id = ${dbUserId} AND status = 'pendente'
        LIMIT 1
    `;
    if (existing.length) {
        return { error: "Já tens um pedido de alteração de plano em análise." };
    }

    // Create the plan request
    await ensurePedidosPlanoTable();

    await sql`
        INSERT INTO pedidos_plano (user_id, organization_id, plano_solicitado, status)
        VALUES (${dbUserId}, ${orgId}, ${plano}, 'pendente')
    `;

    // Create notification for admin (insert into all orgs is admin-wide,
    // but we use a special type so admin can see it)
    const planoLabel: Record<string, string> = {
        team: "Team",
        club_pro: "Club Pro",
        legend: "Legend",
    };

    await sql`
        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
        VALUES (
            gen_random_uuid(),
            ${orgId},
            NULL,
            ${"Pedido de Alteração de Plano"},
            ${`O utilizador ${userName} solicitou a alteração para o plano ${planoLabel[plano] || plano}.`},
            'Aviso',
            false,
            NOW()
        )
    `;

    await logAction(userId, "plan_change_request", "/dashboard/definicoes", {
        plano_solicitado: plano,
    });

    revalidatePath("/dashboard/definicoes");
    return { success: true };
}
