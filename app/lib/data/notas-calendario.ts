// Queries de notas de calendário pessoal do utilizador.
import { auth } from "@clerk/nextjs/server";
import { sql } from "./_shared";

export type NotaCalendario = {
    id: string;
    data: string;
    nota: string;
    created_at: string;
    updated_at: string;
};

export async function fetchNotasCalendario(): Promise<NotaCalendario[]> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string; organization_id: string }[]>`
            SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<NotaCalendario[]>`
            SELECT id, data::text, nota, created_at, updated_at
            FROM calendar_notes
            WHERE user_id = ${user.id}
              AND organization_id = ${user.organization_id}
            ORDER BY data DESC, created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

/** Retorna datas distintas (YYYY-MM-DD) que têm pelo menos uma nota. */
export async function fetchDatasComNotas(): Promise<string[]> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string; organization_id: string }[]>`
            SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        const rows = await sql<{ data: string }[]>`
            SELECT DISTINCT data::text AS data
            FROM calendar_notes
            WHERE user_id = ${user.id}
              AND organization_id = ${user.organization_id}
        `;
        return rows.map((r) => r.data);
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}
