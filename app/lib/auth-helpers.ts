import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/**
 * Check if the current user is an admin
 * @returns boolean - true if user is admin, false otherwise
 */
export async function isUserAdmin(): Promise<boolean> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return false;
        }

        const user = await sql<{ role: string }[]>`
            SELECT role FROM users WHERE clerk_user_id = ${userId}
        `;

        return user.length > 0 && user[0].role === "admin";
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
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
                role: string;
                organization_id: string;
                image_url: string | null;
                iban: string | null;
            }[]
        >`
                SELECT id, name, email, role, organization_id, image_url, iban
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
 * @returns boolean - true if user is admin or creator, false otherwise
 */
export async function canEditResource(
    createdBy: string | null | undefined,
): Promise<boolean> {
    try {
        // Check if current user is admin
        const isAdmin = await isUserAdmin();

        console.log("[DEBUG] canEditResource - isAdmin:", isAdmin);
        console.log("[DEBUG] canEditResource - createdBy:", createdBy);

        // Admins can edit anything
        if (isAdmin) {
            console.log(
                "[DEBUG] canEditResource - Admin detected, allowing edit",
            );
            return true;
        }

        // For non-admins, get current user to check if creator
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            console.log("[DEBUG] canEditResource - No current user");
            return false;
        }

        // Users can only edit what they created
        // If createdBy is null (old resource), only admins can edit
        if (!createdBy) {
            console.log(
                "[DEBUG] canEditResource - No creator and not admin, denying",
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
