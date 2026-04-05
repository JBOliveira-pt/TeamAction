"use server";

import { auth } from "@clerk/nextjs/server";
import { sql, logAction } from "./_shared";
import { revalidatePath } from "next/cache";

export type PedidoAlteracaoPerfil = {
    id: string;
    campo: string;
    valor_novo: string;
    status: "pendente" | "aprovado" | "rejeitado";
    created_at: string;
};

async function ensurePedidosAlteracaoPerfilTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS pedidos_alteracao_perfil (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            organization_id UUID,
            campo TEXT NOT NULL,
            valor_atual TEXT,
            valor_novo TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
}

export async function fetchPedidosAlteracaoPerfil(): Promise<
    PedidoAlteracaoPerfil[]
> {
    const { userId } = await auth();
    if (!userId) return [];

    await ensurePedidosAlteracaoPerfilTable();

    const rows = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!rows.length) return [];
    const dbUserId = rows[0].id;

    return sql<PedidoAlteracaoPerfil[]>`
        SELECT id, campo, valor_novo, status, created_at
        FROM pedidos_alteracao_perfil
        WHERE user_id = ${dbUserId}
          AND status = 'pendente'
        ORDER BY created_at DESC
    `;
}

export async function solicitarAlteracaoEmail(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const novoEmail = String(formData.get("novo_email") || "")
        .trim()
        .toLowerCase();
    if (!novoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) {
        return { error: "Email inválido." };
    }

    const userRows = await sql<
        {
            id: string;
            organization_id: string | null;
            name: string;
            email: string;
        }[]
    >`
        SELECT id, organization_id, name, email FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!userRows.length) return { error: "Utilizador não encontrado." };
    const {
        id: dbUserId,
        organization_id: orgId,
        name: userName,
        email: emailAtual,
    } = userRows[0];

    if (novoEmail === emailAtual.toLowerCase()) {
        return { error: "O novo email é igual ao atual." };
    }

    await ensurePedidosAlteracaoPerfilTable();

    const existing = await sql<{ id: string }[]>`
        SELECT id FROM pedidos_alteracao_perfil
        WHERE user_id = ${dbUserId} AND campo = 'email' AND status = 'pendente'
        LIMIT 1
    `;
    if (existing.length) {
        return { error: "Já tens um pedido de alteração de email em análise." };
    }

    await sql`
        INSERT INTO pedidos_alteracao_perfil (user_id, organization_id, campo, valor_atual, valor_novo)
        VALUES (${dbUserId}, ${orgId}, 'email', ${emailAtual}, ${novoEmail})
    `;

    // Notificar admin
    if (orgId) {
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${orgId},
                NULL,
                ${"Pedido de Alteração de Email"},
                ${`O utilizador ${userName} solicitou a alteração do email de ${emailAtual} para ${novoEmail}.`},
                'Aviso',
                false,
                NOW()
            )
        `;
    }

    await logAction(userId, "email_change_request", "/dashboard/perfil", {
        email_atual: emailAtual,
        email_novo: novoEmail,
    });

    revalidatePath("/dashboard/treinador/perfil");
    revalidatePath("/dashboard/atleta/perfil");
    revalidatePath("/dashboard/presidente/perfil");
    revalidatePath("/dashboard/responsavel/perfil");
    return { success: true };
}

export async function solicitarAlteracaoDataNascimento(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const novaData = String(formData.get("nova_data_nascimento") || "").trim();
    if (!novaData) {
        return { error: "Data de nascimento inválida." };
    }

    const userRows = await sql<
        {
            id: string;
            organization_id: string | null;
            name: string;
            data_nascimento: string | null;
        }[]
    >`
        SELECT id, organization_id, name, data_nascimento FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!userRows.length) return { error: "Utilizador não encontrado." };
    const {
        id: dbUserId,
        organization_id: orgId,
        name: userName,
        data_nascimento: dataAtual,
    } = userRows[0];

    // Verificar se a nova data torna o utilizador menor de 18
    const birth = new Date(novaData);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
    }

    // Se a nova data NÃO torna menor de 18, atualizar diretamente
    if (age >= 18) {
        try {
            await sql`
                UPDATE users
                SET data_nascimento = ${novaData}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
            revalidatePath("/dashboard/treinador/perfil");
            revalidatePath("/dashboard/atleta/perfil");
            revalidatePath("/dashboard/presidente/perfil");
            revalidatePath("/dashboard/responsavel/perfil");
            return { success: true };
        } catch {
            return { error: "Erro ao atualizar data de nascimento." };
        }
    }

    // Se torna menor de 18, requer aprovação do admin
    await ensurePedidosAlteracaoPerfilTable();

    const existing = await sql<{ id: string }[]>`
        SELECT id FROM pedidos_alteracao_perfil
        WHERE user_id = ${dbUserId} AND campo = 'data_nascimento' AND status = 'pendente'
        LIMIT 1
    `;
    if (existing.length) {
        return {
            error: "Já tens um pedido de alteração de data de nascimento em análise.",
        };
    }

    const dataAtualStr = dataAtual
        ? new Date(dataAtual).toISOString().slice(0, 10)
        : "não definida";

    await sql`
        INSERT INTO pedidos_alteracao_perfil (user_id, organization_id, campo, valor_atual, valor_novo)
        VALUES (${dbUserId}, ${orgId}, 'data_nascimento', ${dataAtualStr}, ${novaData})
    `;

    if (orgId) {
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${orgId},
                NULL,
                ${"Pedido de Alteração de Data de Nascimento"},
                ${`O utilizador ${userName} solicitou a alteração da data de nascimento para ${new Date(novaData).toLocaleDateString("pt-PT")} (menor de 18 anos).`},
                'Aviso',
                false,
                NOW()
            )
        `;
    }

    await logAction(userId, "dob_change_request", "/dashboard/perfil", {
        data_atual: dataAtualStr,
        data_nova: novaData,
    });

    revalidatePath("/dashboard/treinador/perfil");
    revalidatePath("/dashboard/atleta/perfil");
    revalidatePath("/dashboard/presidente/perfil");
    revalidatePath("/dashboard/responsavel/perfil");
    return { success: true };
}
