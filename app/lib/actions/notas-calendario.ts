"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const NOTAS_PATHS = [
    "/dashboard/atleta/notas",
    "/dashboard/treinador/notas",
    "/dashboard/presidente/notas",
    "/dashboard/responsavel/notas",
];

function revalidateNotas() {
    for (const p of NOTAS_PATHS) revalidatePath(p);
}

async function getDbUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function criarNotaCalendario(
    prevState: { error?: string } | null,
    formData: FormData,
): Promise<{ error?: string } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const data = formData.get("data")?.toString().trim();
    const nota = formData.get("nota")?.toString().trim();

    if (!data) return { error: "Data é obrigatória." };
    if (!nota) return { error: "Texto da nota é obrigatório." };

    try {
        const user = await getDbUser(clerkUserId);
        if (!user) return { error: "Utilizador não encontrado." };

        await sql`
            INSERT INTO calendar_notes (user_id, organization_id, data, nota)
            VALUES (${user.id}, ${user.organization_id}, ${data}, ${nota})
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao criar nota." };
    }

    revalidateNotas();
    return null;
}

export async function editarNotaCalendario(
    prevState: { error?: string } | null,
    formData: FormData,
): Promise<{ error?: string } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const id = formData.get("id")?.toString().trim();
    const data = formData.get("data")?.toString().trim();
    const nota = formData.get("nota")?.toString().trim();

    if (!id) return { error: "ID inválido." };
    if (!data) return { error: "Data é obrigatória." };
    if (!nota) return { error: "Texto da nota é obrigatório." };

    try {
        const user = await getDbUser(clerkUserId);
        if (!user) return { error: "Utilizador não encontrado." };

        const updated = await sql`
            UPDATE calendar_notes
            SET data = ${data}, nota = ${nota}, updated_at = NOW()
            WHERE id = ${id}
              AND user_id = ${user.id}
              AND organization_id = ${user.organization_id}
            RETURNING id
        `;
        if (updated.length === 0) return { error: "Nota não encontrada." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao editar nota." };
    }

    revalidateNotas();
    return null;
}

export async function apagarNotaCalendario(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    try {
        const user = await getDbUser(clerkUserId);
        if (!user) return { error: "Utilizador não encontrado." };

        const deleted = await sql`
            DELETE FROM calendar_notes
            WHERE id = ${id}
              AND user_id = ${user.id}
              AND organization_id = ${user.organization_id}
            RETURNING id
        `;
        if (deleted.length === 0) return { error: "Nota não encontrada." };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao apagar nota." };
    }

    revalidateNotas();
    return { success: true };
}
