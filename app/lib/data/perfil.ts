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
                c.nipc AS nif,
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
