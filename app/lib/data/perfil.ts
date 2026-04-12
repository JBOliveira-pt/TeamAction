import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";

export type PerfilUtilizador = {
    id: string;
    name: string;
    email: string;
    image_url: string | null;
    account_type: string | null;
    data_nascimento: string | null;
    telefone: string | null;
    morada: string | null;
    cidade: string | null;
    codigo_postal: string | null;
    pais: string | null;
    nif: string | null;
    nipc: string | null;
    iban: string | null;
    org_name: string | null;
    created_at: string;
};

export async function fetchMeuPerfil(): Promise<PerfilUtilizador | null> {
    const { userId } = await auth();
    if (!userId) return null;

    try {
        const rows = await sql<PerfilUtilizador[]>`
            SELECT
                u.id,
                u.name,
                u.email,
                u.image_url,
                u.account_type,
                u.data_nascimento,
                u.telefone,
                u.morada,
                u.cidade,
                u.codigo_postal,
                u.pais,
                u.nif,
                c.nipc,
                c.iban,
                o.name AS org_name,
                u.created_at
            FROM users u
            LEFT JOIN organizations o ON o.id = u.organization_id
            LEFT JOIN clubes c ON c.organization_id = u.organization_id
            WHERE u.clerk_user_id = ${userId}
            LIMIT 1
        `;
        return rows[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch perfil.");
    }
}

export type CursoTreinador = {
    curso_id: string;
    modality_id: number;
    modality_name: string;
    level_id: number;
    level_code: string;
    level_name: string;
    level_description: string;
};

export async function fetchCursoTreinador(): Promise<CursoTreinador | null> {
    const { userId } = await auth();
    if (!userId) return null;

    try {
        const rows = await sql<CursoTreinador[]>`
            SELECT
                uc.curso_id,
                m.id   AS modality_id,
                m.name AS modality_name,
                g.id   AS level_id,
                g.code AS level_code,
                g.name AS level_name,
                g.description AS level_description
            FROM user_cursos uc
            INNER JOIN cursos c ON c.id = uc.curso_id
            INNER JOIN modalidades m ON m.id = c.modality_id
            INNER JOIN graus_tecnicos g ON g.id = c.level_id
            INNER JOIN users u ON u.id = uc.user_id
            WHERE u.clerk_user_id = ${userId}
            ORDER BY g.id DESC
            LIMIT 1
        `;
        return rows[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        return null;
    }
}
