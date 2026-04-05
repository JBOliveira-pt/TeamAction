"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId, requireAccountType } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

// ========================================
// Mensalidades Actions (Modal)
// ========================================

export async function registarPagamento(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        ({ organizationId } = await requireAccountType("presidente"));
    } catch {
        return { error: "Acesso restrito ao presidente." };
    }

    const atletaId = formData.get("atleta_id")?.toString();
    const mes = formData.get("mes")?.toString();
    const ano = formData.get("ano")?.toString();
    const valor = formData.get("valor")?.toString();
    const estado = formData.get("estado")?.toString() || "pago";
    const dataPagamento = formData.get("data_pagamento")?.toString() || null;

    if (!atletaId) return { error: "Atleta nÃ£o identificado." };
    if (!mes) return { error: "MÃªs Ã© obrigatÃ³rio." };
    if (!ano) return { error: "Ano Ã© obrigatÃ³rio." };
    if (!valor) return { error: "Valor Ã© obrigatÃ³rio." };

    try {
        const { userId: clerkId } = await auth();
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        // Buscar nome do atleta para a notificaÃ§Ã£o
        const atletaResult = await sql<{ nome: string }[]>`
            SELECT nome FROM atletas WHERE id = ${atletaId}
        `;
        const atletaNome = atletaResult[0]?.nome ?? "Atleta desconhecido";

        // Upsert mensalidade
        const mensalidadeResult = await sql<{ id: string }[]>`
            INSERT INTO mensalidades (id, atleta_id, mes, ano, valor, estado, data_pagamento, updated_by, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${atletaId}, ${mes}, ${ano}, ${valor}, ${estado}, ${dataPagamento}, ${dbUserId}, ${organizationId}, NOW(), NOW())
            ON CONFLICT (atleta_id, mes, ano)
            DO UPDATE SET
                valor = EXCLUDED.valor,
                estado = EXCLUDED.estado,
                data_pagamento = EXCLUDED.data_pagamento,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING id
        `;

        const mensalidadeId = mensalidadeResult[0]?.id;

        // Criar recibo automaticamente quando mensalidade marcada como paga
        if (estado === "pago" && mensalidadeId && dbUserId) {
            try {
                const { createReciboForPaidMensalidade } =
                    await import("../receipt-service");
                await createReciboForPaidMensalidade(
                    mensalidadeId,
                    atletaId,
                    organizationId,
                    parseFloat(valor),
                    mes,
                    ano,
                    dataPagamento,
                    dbUserId,
                );
            } catch (reciboError) {
                console.error(
                    "Erro ao criar recibo automaticamente:",
                    reciboError,
                );
                // Nao falhar o pagamento por causa do recibo
            }
        }

        // NotificaÃ§Ã£o automÃ¡tica se em atraso
        if (estado === "em_atraso") {
            const mesesNomes: Record<string, string> = {
                "1": "Janeiro",
                "2": "Fevereiro",
                "3": "MarÃ§o",
                "4": "Abril",
                "5": "Maio",
                "6": "Junho",
                "7": "Julho",
                "8": "Agosto",
                "9": "Setembro",
                "10": "Outubro",
                "11": "Novembro",
                "12": "Dezembro",
            };
            await sql`
                INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${organizationId},
                    'Mensalidade em atraso',
                    ${`${atletaNome} tem mensalidade de ${mesesNomes[mes] ?? mes} ${ano} em atraso.`},
                    'Alerta',
                    NOW()
                )
            `;
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar pagamento." };
    }

    revalidatePath(`/dashboard/presidente/atletas/${atletaId}`);
    revalidatePath("/dashboard/presidente/mensalidades");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// Suspender Atleta
// ========================================

export async function suspenderAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        ({ organizationId } = await requireAccountType("presidente"));
    } catch {
        return { error: "Acesso restrito ao presidente." };
    }

    const atletaId = formData.get("atleta_id")?.toString();
    if (!atletaId) return { error: "Atleta nÃ£o identificado." };

    try {
        // Buscar nome do atleta para a notificaÃ§Ã£o
        const atletaResult = await sql<{ nome: string }[]>`
            SELECT nome FROM atletas WHERE id = ${atletaId}
        `;
        const atletaNome = atletaResult[0]?.nome ?? "Atleta desconhecido";

        await sql`
            UPDATE atletas SET estado = 'suspenso', updated_at = NOW()
            WHERE id = ${atletaId} AND organization_id = ${organizationId}
        `;

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Atleta suspenso',
                ${`${atletaNome} foi suspenso por mensalidade em atraso.`},
                'Aviso',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao suspender atleta." };
    }

    revalidatePath("/dashboard/presidente/mensalidades");
    revalidatePath(`/dashboard/presidente/atletas/${atletaId}`);
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}
