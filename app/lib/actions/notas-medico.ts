// Actions médicas: criar, editar e resolver registos médicos de atletas.
"use server";

import { getAthleteMinorPendingBlockError, sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function criarNotaAtleta(
    prevState: { error?: string } | null,
    formData: FormData,
): Promise<{ error?: string } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    const titulo = formData.get("titulo")?.toString().trim();
    const conteudo = formData.get("conteudo")?.toString().trim();

    if (!titulo) return { error: "Título é obrigatório." };
    if (!conteudo) return { error: "Conteúdo é obrigatório." };

    try {
        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        await sql`
            INSERT INTO notas_atleta (user_id, titulo, conteudo)
            VALUES (${user.id}, ${titulo}, ${conteudo})
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao criar nota." };
    }

    revalidatePath("/dashboard/atleta/notas");
    return null;
}

export async function editarNotaAtleta(
    prevState: { error?: string } | null,
    formData: FormData,
): Promise<{ error?: string } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    const id = formData.get("id")?.toString().trim();
    const titulo = formData.get("titulo")?.toString().trim();
    const conteudo = formData.get("conteudo")?.toString().trim();

    if (!id) return { error: "ID inválido." };
    if (!titulo) return { error: "Título é obrigatório." };
    if (!conteudo) return { error: "Conteúdo é obrigatório." };

    try {
        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        const updated = await sql`
            UPDATE notas_atleta
            SET titulo = ${titulo}, conteudo = ${conteudo}
            WHERE id = ${id} AND user_id = ${user.id}
            RETURNING id
        `;
        if (updated.length === 0) return { error: "Nota não encontrada." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao editar nota." };
    }

    revalidatePath("/dashboard/atleta/notas");
    return null;
}

export async function registarMedidaCondicaoFisica(
    prevState: { error?: string } | null,
    formData: FormData,
): Promise<{ error?: string } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    const alturaStr = formData.get("altura")?.toString().trim();
    const pesoStr = formData.get("peso")?.toString().trim();
    const dataRegisto = formData.get("data_registo")?.toString().trim() || null;

    const altura = alturaStr ? parseFloat(alturaStr) : NaN;
    const peso = pesoStr ? parseFloat(pesoStr) : NaN;

    if (isNaN(altura) || altura <= 0) return { error: "Altura inválida." };
    if (isNaN(peso) || peso <= 0) return { error: "Peso inválido." };
    if (dataRegisto && dataRegisto > new Date().toISOString().split("T")[0])
        return { error: "A data do registo não pode ser futura." };

    try {
        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        await sql`
            INSERT INTO condicao_fisica (user_id, altura, peso, data_registo)
            VALUES (${user.id}, ${altura}, ${peso}, ${dataRegisto ?? "CURRENT_DATE"}::date)
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao guardar medida." };
    }

    revalidatePath("/dashboard/atleta/condicao-fisica");
    return null;
}

export async function apagarNotaAtleta(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    try {
        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        const deleted = await sql`
            DELETE FROM notas_atleta WHERE id = ${id} AND user_id = ${user.id} RETURNING id
        `;
        if (deleted.length === 0) return { error: "Nota não encontrada." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao apagar nota." };
    }

    revalidatePath("/dashboard/atleta/notas");
    return { success: true };
}

export async function adicionarLesaoAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    const descricao = formData.get("descricao")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString().trim();
    const dataPrevistaRetorno =
        formData.get("data_prevista_retorno")?.toString().trim() || null;
    const observacoes = formData.get("observacoes")?.toString().trim() || null;
    const gravidade = formData.get("gravidade")?.toString().trim() || "leve";

    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };
    if (!["leve", "media", "grave"].includes(gravidade))
        return { error: "Gravidade inválida." };

    const hoje = new Date(new Date().toISOString().slice(0, 10));
    const estadoFinal =
        dataPrevistaRetorno && new Date(dataPrevistaRetorno) <= hoje
            ? "resolvido"
            : "ativo";

    try {
        const [user] = await sql<{ id: string; email: string; name: string }[]>`
            SELECT id, email, name FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        await sql`
            INSERT INTO medico (email, tipo, descricao, gravidade, data_inicio, data_prevista_retorno, observacoes, estado)
            VALUES (${user.email}, 'lesao', ${descricao}, ${gravidade}, ${dataInicio}, ${dataPrevistaRetorno}, ${observacoes}, ${estadoFinal})
        `;

        // Alterar estado do atleta se gravidade média ou grave e registo ativo
        if (
            estadoFinal === "ativo" &&
            (gravidade === "media" || gravidade === "grave")
        ) {
            await sql`
                UPDATE atletas SET estado = 'Lesionado' WHERE user_id = ${user.id}
            `;
        }

        // Notificar treinador
        await notificarTreinadorMedico(
            user.id,
            user.name,
            "lesao",
            gravidade,
            descricao,
            dataPrevistaRetorno,
        );
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar lesão." };
    }

    revalidatePath("/dashboard/atleta/medico");
    return { success: true };
}

export async function adicionarDoencaAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    const descricao = formData.get("descricao")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString().trim();
    const dataPrevistaRetorno =
        formData.get("data_prevista_retorno")?.toString().trim() || null;
    const observacoes = formData.get("observacoes")?.toString().trim() || null;
    const gravidade = formData.get("gravidade")?.toString().trim() || "leve";

    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };
    if (!["leve", "media", "grave"].includes(gravidade))
        return { error: "Gravidade inválida." };

    const hoje = new Date(new Date().toISOString().slice(0, 10));
    const estadoFinal =
        dataPrevistaRetorno && new Date(dataPrevistaRetorno) <= hoje
            ? "resolvido"
            : "ativo";

    try {
        const [user] = await sql<{ id: string; email: string; name: string }[]>`
            SELECT id, email, name FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        await sql`
            INSERT INTO medico (email, tipo, descricao, gravidade, data_inicio, data_prevista_retorno, observacoes, estado)
            VALUES (${user.email}, 'doenca', ${descricao}, ${gravidade}, ${dataInicio}, ${dataPrevistaRetorno}, ${observacoes}, ${estadoFinal})
        `;

        // Alterar estado do atleta se gravidade média ou grave e registo ativo
        if (
            estadoFinal === "ativo" &&
            (gravidade === "media" || gravidade === "grave")
        ) {
            await sql`
                UPDATE atletas SET estado = 'Lesionado' WHERE user_id = ${user.id}
            `;
        }

        // Notificar treinador
        await notificarTreinadorMedico(
            user.id,
            user.name,
            "doenca",
            gravidade,
            descricao,
            dataPrevistaRetorno,
        );
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar doença." };
    }

    revalidatePath("/dashboard/atleta/medico");
    return { success: true };
}

export async function editarRegistoMedico(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    const id = formData.get("id")?.toString().trim();
    const descricao = formData.get("descricao")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString().trim();
    const dataPrevistaRetorno =
        formData.get("data_prevista_retorno")?.toString().trim() || null;
    const observacoes = formData.get("observacoes")?.toString().trim() || null;
    const gravidade = formData.get("gravidade")?.toString().trim();

    if (!id) return { error: "ID inválido." };
    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };
    if (gravidade && !["leve", "media", "grave"].includes(gravidade))
        return { error: "Gravidade inválida." };

    // Determinar estado automaticamente a partir de data_prevista_retorno
    const hoje = new Date(new Date().toISOString().slice(0, 10));
    const estadoFinal =
        dataPrevistaRetorno && new Date(dataPrevistaRetorno) <= hoje
            ? "resolvido"
            : "ativo";

    try {
        const [user] = await sql<{ id: string; email: string }[]>`
            SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        const updated = await sql`
            UPDATE medico
            SET descricao             = ${descricao},
                data_inicio           = ${dataInicio},
                data_prevista_retorno = ${dataPrevistaRetorno},
                observacoes           = ${observacoes},
                estado                = ${estadoFinal},
                gravidade             = COALESCE(${gravidade ?? null}, gravidade)
            WHERE id    = ${id}
              AND email = ${user.email}
            RETURNING id
        `;
        if (updated.length === 0) return { error: "Registo não encontrado." };

        // Se resolvido (explicitamente ou auto), verificar se pode voltar a Ativo
        if (estadoFinal === "resolvido") {
            const ativos = await sql<{ id: string }[]>`
                SELECT m.id FROM medico m
                JOIN users u ON u.email = m.email
                WHERE u.id = ${user.id}
                  AND m.estado = 'ativo'
                  AND m.gravidade IN ('media', 'grave')
                  AND m.id != ${id}
            `;
            if (ativos.length === 0) {
                await sql`
                    UPDATE atletas SET estado = 'Ativo' WHERE user_id = ${user.id} AND estado = 'Lesionado'
                `;
            }
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar registo." };
    }

    revalidatePath("/dashboard/atleta/medico");
    return { success: true };
}

export async function apagarRegistoMedico(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const blockedReason = await getAthleteMinorPendingBlockError(clerkUserId);
    if (blockedReason) return { error: blockedReason };

    try {
        const [user] = await sql<{ id: string; email: string }[]>`
            SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        const deleted = await sql<{ gravidade: string }[]>`
            DELETE FROM medico
            WHERE id    = ${id}
              AND email = ${user.email}
            RETURNING gravidade
        `;
        if (deleted.length === 0) return { error: "Registo não encontrado." };

        // Se removeu registo com gravidade média/grave, verificar se pode voltar a Ativo
        if (
            deleted[0].gravidade === "media" ||
            deleted[0].gravidade === "grave"
        ) {
            const ativos = await sql<{ id: string }[]>`
                SELECT m.id FROM medico m
                JOIN users u ON u.email = m.email
                WHERE u.id = ${user.id}
                  AND m.estado = 'ativo'
                  AND m.gravidade IN ('media', 'grave')
            `;
            if (ativos.length === 0) {
                await sql`
                    UPDATE atletas SET estado = 'Ativo' WHERE user_id = ${user.id} AND estado = 'Lesionado'
                `;
            }
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao apagar registo." };
    }

    revalidatePath("/dashboard/atleta/medico");
    return { success: true };
}

// ── Helper: notificar treinador sobre registo médico ──────────────────────
async function notificarTreinadorMedico(
    atletaUserId: string,
    atletaNome: string,
    tipo: "lesao" | "doenca",
    gravidade: string,
    descricao: string,
    dataPrevistaRetorno: string | null,
) {
    try {
        const [info] = await sql<
            { treinador_id: string; organization_id: string }[]
        >`
            SELECT e.treinador_id, a.organization_id
            FROM atletas a
            JOIN equipas e ON e.id = a.equipa_id
            WHERE a.user_id = ${atletaUserId}
              AND e.treinador_id IS NOT NULL
            LIMIT 1
        `;
        if (!info) return; // atleta sem equipa/treinador

        const tipoLabel = tipo === "lesao" ? "lesão" : "doença";
        const gravLabel =
            gravidade === "leve"
                ? "Leve"
                : gravidade === "media"
                  ? "Média"
                  : "Grave";
        const lesionado = gravidade === "media" || gravidade === "grave";

        let titulo: string;
        let descNotif: string;

        if (lesionado) {
            const ausencia = dataPrevistaRetorno
                ? `Retorno previsto: ${new Date(dataPrevistaRetorno).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}`
                : "Sem data prevista de retorno";
            titulo = `⚠️ ${atletaNome} — ${tipoLabel} ${gravLabel}`;
            descNotif = `${descricao}. O atleta fica INDISPONÍVEL para jogos. ${ausencia}.`;
        } else {
            titulo = `ℹ️ ${atletaNome} — ${tipoLabel} ${gravLabel}`;
            descNotif = `${descricao}. O atleta continua disponível para jogos.`;
        }

        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (gen_random_uuid(), ${info.organization_id}, ${info.treinador_id}, ${titulo}, ${descNotif}, ${lesionado ? "Alerta" : "Info"}, false, NOW())
        `;
    } catch (error) {
        // Não bloquear a action se a notificação falhar
        console.error("Erro ao notificar treinador:", error);
    }
}
