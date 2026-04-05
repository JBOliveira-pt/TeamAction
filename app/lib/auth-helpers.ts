import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/**
 * Check if the current user has elevated privileges.
 * Regular Neon users are never treated as elevated users.
 * @returns boolean - always false
 */
export async function isUserAdmin(): Promise<boolean> {
    return false;
}

/**
 * Get current user's organization ID
 * @returns string | null - organization ID or null if not found
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
        console.error("Error fetching organization ID:", error);
        return null;
    }
}

/**
 * Get current user's data from database
 * @returns User object or null if not found
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
        console.error("Error fetching current user:", error);
        return null;
    }
}

/**
 * Check if current user can edit/delete a resource
 * @param createdBy - UUID of the user who created the resource
 * @returns boolean - true if user is privileged or creator, false otherwise
 */
export async function canEditResource(
    createdBy: string | null | undefined,
): Promise<boolean> {
    try {
        // Check if current user is privileged
        const isAdmin = await isUserAdmin();

        console.log("[DEBUG] canEditResource - isAdmin:", isAdmin);
        console.log("[DEBUG] canEditResource - createdBy:", createdBy);

        // Privileged users can edit anything
        if (isAdmin) {
            console.log(
                "[DEBUG] canEditResource - Privileged access detected, allowing edit",
            );
            return true;
        }

        // For non-privileged users, check if current user is creator
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            console.log("[DEBUG] canEditResource - No current user");
            return false;
        }

        // Users can only edit what they created
        // If createdBy is null (old resource), only privileged users can edit
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
