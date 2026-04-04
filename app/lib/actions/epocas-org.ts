"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

// ========================================
// Ã‰poca Actions (Modal)
// ========================================

export async function criarEpoca(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkId } = await auth();
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "NÃ£o foi possÃ­vel identificar a organizaÃ§Ã£o." };
    }

    const nome = formData.get("nome")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString();
    const dataFim = formData.get("data_fim")?.toString();
    const ativa = formData.get("ativa") === "on";

    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!dataInicio) return { error: "Data de inÃ­cio Ã© obrigatÃ³ria." };
    if (!dataFim) return { error: "Data de fim Ã© obrigatÃ³ria." };
    if (dataFim <= dataInicio)
        return {
            error: "A data de fim deve ser posterior Ã  data de inÃ­cio.",
        };

    try {
        if (ativa) {
            await sql`
                UPDATE epocas SET ativa = false
                WHERE organization_id = ${organizationId}
            `;
        }

        await sql`
            INSERT INTO epocas (id, nome, data_inicio, data_fim, ativa, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${nome}, ${dataInicio}, ${dataFim}, ${ativa}, ${organizationId}, NOW(), NOW())
        `;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova Ã©poca criada',
                ${`Ã‰poca ${nome} criada${ativa ? " e definida como ativa" : ""}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao criar Ã©poca." };
    }

    await logAction(clerkId, "epoca_create", "/dashboard/presidente/epoca", {
        nome,
        ativa,
    });
    revalidatePath("/dashboard/presidente/epoca");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// OrganizaÃ§Ã£o Actions
// ========================================

export async function atualizarOrganizacao(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };
    }

    const name = formData.get("name")?.toString().trim();
    const desporto = formData.get("desporto")?.toString().trim() || null;
    const cidade = formData.get("cidade")?.toString().trim() || null;
    const pais = formData.get("pais")?.toString().trim() || null;
    const website = formData.get("website")?.toString().trim() || null;
    const nif = formData.get("nif")?.toString().trim() || null;
    const telefone = formData.get("telefone")?.toString().trim() || null;
    const morada = formData.get("morada")?.toString().trim() || null;
    const codigoPostal =
        formData.get("codigo_postal")?.toString().trim() || null;

    if (!name) return { error: "Nome do clube Ã© obrigatÃ³rio." };

    if (nif && !/^\d{9}$/.test(nif)) {
        return { error: "NIF deve ter exatamente 9 dÃ­gitos numÃ©ricos." };
    }

    try {
        await sql`
            UPDATE organizations
            SET
                name          = ${name},
                desporto      = ${desporto},
                cidade        = ${cidade},
                pais          = ${pais},
                website       = ${website},
                nif           = ${nif},
                telefone      = ${telefone},
                morada        = ${morada},
                codigo_postal = ${codigoPostal},
                updated_at    = NOW()
            WHERE id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar definiÃ§Ãµes." };
    }

    revalidatePath("/dashboard/presidente/definicoes");
    return { success: true };
}
