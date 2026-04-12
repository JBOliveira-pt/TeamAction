// Helpers de autenticação: org do utilizador, permissões e verificação de autoria.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/**
 * Verifica se o utilizador atual tem privilégios elevados.
 * Utilizadores Neon nunca são tratados como elevados.
 */
export async function isUserAdmin(): Promise<boolean> {
    return false;
}

/**
 * Obtém o organization_id do utilizador atual.
 */
export async function getCurrentUserOrgId(): Promise<string | null> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return null;
        }

        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;

        return user.length > 0 ? user[0].organization_id : null;
    } catch (error) {
        console.error("Erro ao obter organization ID:", error);
        return null;
    }
}

/**
 * Obtém os dados do utilizador atual da base de dados.
 */
export async function getCurrentUser() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return null;
        }

        const user = await sql<
            {
                id: string;
                name: string;
                email: string;
                account_type: string | null;
                organization_id: string;
                image_url: string | null;
            }[]
        >`
                SELECT
                id,
                name,
                email,
                account_type,
                organization_id,
                image_url
            FROM users 
            WHERE clerk_user_id = ${userId}
        `;

        return user.length > 0 ? user[0] : null;
    } catch (error) {
        console.error("Erro ao obter utilizador atual:", error);
        return null;
    }
}

/**
 * Verifica se o utilizador atual pode editar/eliminar um recurso.
 */
export async function canEditResource(
    createdBy: string | null | undefined,
): Promise<boolean> {
    try {
        // Verificar se o utilizador atual tem privilégios
        const isAdmin = await isUserAdmin();

        console.log("[DEBUG] canEditResource - isAdmin:", isAdmin);
        console.log("[DEBUG] canEditResource - createdBy:", createdBy);

        // Utilizadores com privilégios podem editar tudo
        if (isAdmin) {
            console.log(
                "[DEBUG] canEditResource - Privileged access detected, allowing edit",
            );
            return true;
        }

        // Para utilizadores sem privilégios, verificar se é o criador
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            console.log("[DEBUG] canEditResource - No current user");
            return false;
        }

        // Utilizadores só podem editar o que criaram
        // Se createdBy é null (recurso antigo), só privilégios podem editar
        if (!createdBy) {
            console.log(
                "[DEBUG] canEditResource - No creator and no privileged access, denying",
            );
            return false;
        }

        const canEdit = currentUser.id === createdBy;
        console.log("[DEBUG] canEditResource - User check result:", canEdit);
        return canEdit;
    } catch (error) {
        console.error("[DEBUG] canEditResource - Error:", error);
        return false;
    }
}
