"use server";

import { auth } from "@clerk/nextjs/server";
import { sql, logAction } from "./_shared";
import { revalidatePath } from "next/cache";

/**
 * Detect if the authenticated user is a responsável and, if so, return
 * the minor's user_id and organization_id so that plan functions operate
 * on the correct org.
 */
async function resolveOrgContext(clerkUserId: string): Promise<{
    dbUserId: string;
    orgId: string;
    userName: string;
    isResponsavel: boolean;
} | null> {
    const [user] = await sql<
        {
            id: string;
            organization_id: string | null;
            account_type: string | null;
            name: string;
            email: string;
        }[]
    >`
        SELECT id, organization_id, account_type, name, email
        FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!user) return null;

    if (user.account_type === "responsavel") {
        // Get the minor's organization
        const [minorOrg] = await sql<{ organization_id: string }[]>`
            SELECT u.organization_id
            FROM atletas a
            INNER JOIN users u ON u.id = a.user_id
            WHERE a.encarregado_educacao = ${user.email}
              AND a.menor_idade = true
              AND u.organization_id IS NOT NULL
            LIMIT 1
        `;
        if (!minorOrg?.organization_id) return null;
        return {
            dbUserId: user.id,
            orgId: minorOrg.organization_id,
            userName: user.name,
            isResponsavel: true,
        };
    }

    if (!user.organization_id) return null;
    return {
        dbUserId: user.id,
        orgId: user.organization_id,
        userName: user.name,
        isResponsavel: false,
    };
}

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

    const ctx = await resolveOrgContext(userId);
    if (!ctx) return null;

    const pedidos = await sql<PlanoPedido[]>`
        SELECT id, plano_solicitado, status, created_at
        FROM pedidos_plano
        WHERE user_id = ${ctx.dbUserId}
          AND status = 'pendente'
        ORDER BY created_at DESC
        LIMIT 1
    `;

    return pedidos[0] ?? null;
}

export async function fetchPlanoAtual(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    const ctx = await resolveOrgContext(userId);
    if (!ctx) return "rookie";

    const rows = await sql<{ plano: string | null }[]>`
        SELECT plano FROM organizations WHERE id = ${ctx.orgId} LIMIT 1
    `;

    return rows[0]?.plano ?? "rookie";
}

export async function fetchIsMinor(): Promise<boolean> {
    const { userId } = await auth();
    if (!userId) return false;
    const rows = await sql<{ menor_idade: boolean | null }[]>`
        SELECT a.menor_idade
        FROM atletas a
        INNER JOIN users u ON u.id = a.user_id
        WHERE u.clerk_user_id = ${userId}
        LIMIT 1
    `.catch(() => []);

    if (rows.length > 0) {
        return rows[0]?.menor_idade === true;
    }

    // Fallback: atletas record may not exist yet — check age from users table
    const userRows = await sql<
        { idade: number | null; data_nascimento: string | null }[]
    >`
        SELECT idade, data_nascimento FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `.catch(() => []);

    if (userRows[0]?.idade !== null && userRows[0]?.idade !== undefined) {
        return userRows[0].idade < 18;
    }

    if (userRows[0]?.data_nascimento) {
        const birth = new Date(userRows[0].data_nascimento);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
        return age < 18;
    }

    return false;
}

export async function fetchIsResponsavel(): Promise<boolean> {
    const { userId } = await auth();
    if (!userId) return false;
    const rows = await sql<{ account_type: string | null }[]>`
        SELECT account_type FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `.catch(() => []);
    return rows[0]?.account_type === "responsavel";
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

    const ctx = await resolveOrgContext(userId);
    if (!ctx) return { error: "Utilizador não encontrado." };

    const {
        id: dbUserId,
        orgId,
        userName,
    } = {
        id: ctx.dbUserId,
        orgId: ctx.orgId,
        userName: ctx.userName,
    };

    // Verificar se é atleta menor de idade — menores não podem alterar plano
    if (!ctx.isResponsavel) {
        const atletaRows = await sql<
            {
                menor_idade: boolean | null;
                encarregado_educacao: string | null;
            }[]
        >`
            SELECT menor_idade, encarregado_educacao FROM atletas WHERE user_id = ${dbUserId} LIMIT 1
        `.catch(() => []);
        const isMinor = atletaRows[0]?.menor_idade === true;

        if (isMinor) {
            return {
                error: "Como atleta menor de idade, a alteração de plano só pode ser solicitada pelo teu encarregado de educação.",
            };
        }
    }

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

    const statusPedido = "pendente";

    await sql`
        INSERT INTO pedidos_plano (user_id, organization_id, plano_solicitado, status)
        VALUES (${dbUserId}, ${orgId}, ${plano}, ${statusPedido})
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
