// Actions de épocas e organização: criar/editar época e atualizar dados do clube.
"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

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
                'Nova época criada',
                ${`${nome} criada${ativa ? " e definida como ativa" : ""}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao criar época." };
    }

    await logAction(clerkId, "epoca_create", "/dashboard/presidente/epoca", {
        nome,
        ativa,
    });
    revalidatePath("/dashboard/presidente/epoca");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

export async function editarEpoca(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkId } = await auth();
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    const epocaId = formData.get("epoca_id")?.toString();
    const dataInicio = formData.get("data_inicio")?.toString();
    const dataFim = formData.get("data_fim")?.toString();

    if (!epocaId) return { error: "Época não identificada." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };
    if (!dataFim) return { error: "Data de fim é obrigatória." };
    if (dataFim <= dataInicio)
        return { error: "A data de fim deve ser posterior à data de início." };

    try {
        // Verificar que a época pertence à organização
        const [epoca] = await sql<
            {
                id: string;
                nome: string;
                data_inicio: string;
                data_fim: string;
            }[]
        >`
            SELECT id, nome, data_inicio, data_fim FROM epocas
            WHERE id = ${epocaId} AND organization_id = ${organizationId}
            LIMIT 1
        `;
        if (!epoca) return { error: "Época não encontrada." };

        const oldInicio = epoca.data_inicio.toString().slice(0, 10);
        const oldFim = epoca.data_fim.toString().slice(0, 10);

        // Nada mudou
        if (oldInicio === dataInicio && oldFim === dataFim) {
            return { success: true };
        }

        await sql`
            UPDATE epocas
            SET data_inicio = ${dataInicio}, data_fim = ${dataFim}, updated_at = NOW()
            WHERE id = ${epocaId} AND organization_id = ${organizationId}
        `;

        // Notificar treinadores e atletas federados ao clube
        const destinatarios = await sql<{ id: string }[]>`
            SELECT DISTINCT u.id FROM users u
            WHERE u.organization_id = ${organizationId}
              AND u.account_type IN ('treinador', 'atleta')
        `;

        const formatPT = (d: string) => {
            const [y, m, day] = d.split("-");
            return `${day}/${m}/${y}`;
        };

        const desc = `As datas da época "${epoca.nome}" foram alteradas: ${formatPT(dataInicio)} – ${formatPT(dataFim)}.`;

        if (destinatarios.length > 0) {
            await Promise.all(
                destinatarios.map(
                    (u) =>
                        sql`
                        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                        VALUES (gen_random_uuid(), ${organizationId}, ${u.id}, 'Datas da época alteradas', ${desc}, 'Info', false, NOW())
                    `,
                ),
            );
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao editar época." };
    }

    await logAction(clerkId, "epoca_edit", "/dashboard/presidente/epoca", {
        epocaId,
        dataInicio,
        dataFim,
    });
    revalidatePath("/dashboard/presidente/epoca");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

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
        // Update organization name (multi-tenancy label)
        await sql`
            UPDATE organizations
            SET name = ${name}, updated_at = NOW()
            WHERE id = ${organizationId}
        `;

        // Update all club-specific data in clubes
        await sql`
            UPDATE clubes
            SET
                nome          = ${name},
                modalidade    = ${desporto},
                nipc          = ${nif},
                website       = ${website},
                telefone      = ${telefone},
                morada        = ${morada},
                codigo_postal = ${codigoPostal},
                cidade        = ${cidade},
                pais          = ${pais},
                updated_at    = NOW()
            WHERE organization_id = ${organizationId}
        `;

        // Sync equipa mirror name + sport
        await sql`
            UPDATE equipas
            SET nome = ${name}, desporto = ${desporto}, updated_at = NOW()
            WHERE organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar definiÃ§Ãµes." };
    }

    revalidatePath("/dashboard/presidente/clube");
    return { success: true };
}
