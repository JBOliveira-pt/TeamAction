import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";

export async function fetchNotasAtleta(): Promise<
    {
        id: string;
        titulo: string;
        conteudo: string;
        created_at: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            {
                id: string;
                titulo: string;
                conteudo: string;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, conteudo, created_at
            FROM notas_atleta
            WHERE user_id = ${user.id}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchRegistosMedicos(): Promise<
    {
        id: string;
        tipo: string;
        descricao: string;
        data_inicio: string;
        data_prevista_retorno: string | null;
        observacoes: string | null;
        estado: string;
        created_at: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string; email: string }[]>`
            SELECT id, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            {
                id: string;
                tipo: string;
                descricao: string;
                data_inicio: string;
                data_prevista_retorno: string | null;
                observacoes: string | null;
                estado: string;
                created_at: string;
            }[]
        >`
            SELECT id, tipo, descricao, data_inicio::text, data_prevista_retorno::text, observacoes, estado, created_at::text
            FROM medico
            WHERE email = ${user.email}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchCondicaoFisica(): Promise<
    {
        id: string;
        altura: number;
        peso: number;
        data_registo: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            { id: string; altura: number; peso: number; data_registo: string }[]
        >`
            SELECT id, altura::float AS altura, peso::float AS peso, data_registo::text
            FROM condicao_fisica
            WHERE user_id = ${user.id}
            ORDER BY data_registo ASC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}
