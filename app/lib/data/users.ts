// Queries de utilizadores: listar e pesquisar.
import { sql, getOrganizationId } from "./_shared";
import { User } from "../definitions";

export async function fetchUsers() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<User[]>`
            SELECT 
                id,
                name,
                email,
                image_url,
                account_type
            FROM users
            WHERE organization_id = ${organizationId}
            ORDER BY name ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch users.");
    }
}

export type TreinadorStaff = {
    staff_id: string;
    user_id: string | null;
    name: string;
    email: string | null;
    funcao: string;
    is_fake: boolean;
    equipa_id: string | null;
};

/**
 * Retorna todos os treinadores ativos da organização.
 * Inclui equipa_id para filtragem no cliente.
 */
export async function fetchTreinadoresOrg(): Promise<TreinadorStaff[]> {
    try {
        const organizationId = await getOrganizationId();
        return await sql<TreinadorStaff[]>`
            SELECT
                s.id AS staff_id,
                s.user_id,
                s.nome AS name,
                u.email,
                s.funcao,
                (s.user_id IS NULL) AS is_fake,
                s.equipa_id
            FROM staff s
            LEFT JOIN users u ON u.id = s.user_id
            WHERE s.organization_id = ${organizationId}
              AND s.funcao IN ('Treinador Principal', 'Treinador Adjunto')
              AND s.estado = 'ativo'
            ORDER BY s.nome ASC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchUsersForStaff() {
    const organizationId = await getOrganizationId();
    const result = await sql<
        {
            id: string;
            name: string;
            email: string;
            image_url: string | null;
        }[]
    >`
    SELECT id, name, email, image_url
    FROM users
    WHERE organization_id = ${organizationId}
    ORDER BY name ASC
  `;
    return result;
}
