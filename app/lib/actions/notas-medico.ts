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

    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };

    try {
        const [user] = await sql<{ id: string; email: string }[]>`
            SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        await sql`
            INSERT INTO medico (email, tipo, descricao, data_inicio, data_prevista_retorno, observacoes, estado)
            VALUES (${user.email}, 'lesao', ${descricao}, ${dataInicio}, ${dataPrevistaRetorno}, ${observacoes}, 'ativo')
        `;
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

    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };

    try {
        const [user] = await sql<{ id: string; email: string }[]>`
            SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        await sql`
            INSERT INTO medico (email, tipo, descricao, data_inicio, data_prevista_retorno, observacoes, estado)
            VALUES (${user.email}, 'doenca', ${descricao}, ${dataInicio}, ${dataPrevistaRetorno}, ${observacoes}, 'ativo')
        `;
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
    const estado = formData.get("estado")?.toString().trim();

    if (!id) return { error: "ID inválido." };
    if (!descricao) return { error: "Descrição é obrigatória." };
    if (!dataInicio) return { error: "Data de início é obrigatória." };
    if (estado !== "ativo" && estado !== "resolvido")
        return { error: "Estado inválido." };

    try {
        const [user] = await sql<{ email: string }[]>`
            SELECT email FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        const updated = await sql`
            UPDATE medico
            SET descricao             = ${descricao},
                data_inicio           = ${dataInicio},
                data_prevista_retorno = ${dataPrevistaRetorno},
                observacoes           = ${observacoes},
                estado                = ${estado}
            WHERE id    = ${id}
              AND email = ${user.email}
            RETURNING id
        `;
        if (updated.length === 0) return { error: "Registo não encontrado." };
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
        const [user] = await sql<{ email: string }[]>`
            SELECT email FROM users WHERE clerk_user_id = ${clerkUserId}
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        const deleted = await sql`
            DELETE FROM medico
            WHERE id    = ${id}
              AND email = ${user.email}
            RETURNING id
        `;
        if (deleted.length === 0) return { error: "Registo não encontrado." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao apagar registo." };
    }

    revalidatePath("/dashboard/atleta/medico");
    return { success: true };
}
