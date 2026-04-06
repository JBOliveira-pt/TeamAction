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

export async function fetchTreinadoresOrg(): Promise<
    { id: string; name: string; email: string }[]
> {
    try {
        const organizationId = await getOrganizationId();
        return await sql<{ id: string; name: string; email: string }[]>`
            SELECT id, name, email
            FROM users
            WHERE organization_id = ${organizationId}
              AND account_type = 'treinador'
            ORDER BY name ASC
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
