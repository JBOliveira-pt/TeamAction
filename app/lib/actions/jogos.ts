// Actions de jogos: agendar, editar e eliminar jogos.
"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function agendarJogo(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organização." };
    }
    if (!organizationId) return { error: "Organização não encontrada." };

    const adversario = formData.get("adversario")?.toString().trim();
    const adversarioClubeId =
        formData.get("adversario_clube_id")?.toString() || null;
    const data = formData.get("data")?.toString();
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const casaFora = formData.get("casa_fora")?.toString() || "casa";
    const local = formData.get("local")?.toString().trim() || null;
    const estado = formData.get("estado")?.toString() || "agendado";
    const visibilidadePublica = formData.get("visibilidade_publica") === "on";

    if (!adversario) return { error: "Adversário obrigatório." };
    if (!data) return { error: "Data obrigatória." };

    // Validar que a equipa tem treinador para poder agendar jogo
    if (equipaId) {
        const [eq] = await sql<{ treinador_id: string | null }[]>`
            SELECT treinador_id FROM equipas WHERE id = ${equipaId} AND organization_id = ${organizationId} LIMIT 1
        `;
        if (!eq) return { error: "Equipa não encontrada." };
        if (!eq.treinador_id) {
            return {
                error: "Esta equipa não tem treinador associado. Associa um treinador antes de agendar jogos.",
            };
        }
    }

    try {
        await sql`
            INSERT INTO jogos (
                id, adversario, adversario_clube_id, data,
                equipa_id, casa_fora, local, estado,
                visibilidade_publica, organization_id
            )
            VALUES (
                gen_random_uuid(),
                ${adversario},
                ${adversarioClubeId},
                ${data},
                ${equipaId},
                ${casaFora},
                ${local},
                ${estado},
                ${visibilidadePublica},
                ${organizationId}
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao agendar jogo." };
    }

    revalidatePath("/dashboard/presidente/jogos");
    return { success: true };
}

export async function registarResultado(
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
    const resultadoNos = formData.get("resultado_nos")?.toString();
    const resultadoAdv = formData.get("resultado_adv")?.toString();

    if (!id) return { error: "ID do jogo em falta." };
    if (resultadoNos === "")
        return { error: "Resultado da equipa Ã© obrigatÃ³rio." };
    if (resultadoAdv === "")
        return { error: "Resultado do adversÃ¡rio Ã© obrigatÃ³rio." };

    const nos = parseInt(resultadoNos ?? "");
    const adv = parseInt(resultadoAdv ?? "");

    if (isNaN(nos) || isNaN(adv))
        return { error: "Resultados tÃªm de ser nÃºmeros." };
    if (nos < 0 || adv < 0)
        return { error: "Resultados nÃ£o podem ser negativos." };

    try {
        await sql`
            UPDATE jogos SET
                resultado_nos = ${nos},
                resultado_adv = ${adv},
                estado        = 'realizado',
                updated_at    = NOW()
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar resultado." };
    }

    revalidatePath("/dashboard/presidente/jogos");
    revalidatePath("/dashboard/presidente");
    return { success: true };
}
