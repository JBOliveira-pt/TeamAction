import { auth, clerkClient } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return Response.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        // Buscar informações do usuário no Clerk
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
            return Response.json(
                { error: "No email found in Clerk user" },
                { status: 400 },
            );
        }

        // Verificar se usuário existe no Neon
        const existingUser = await sql`
            SELECT id, name, email, clerk_user_id, organization_id, role
            FROM users 
            WHERE email = ${email}
        `;

        if (existingUser.length === 0) {
            // Criar novo usuário no banco
            const defaultOrgId = "00000000-0000-0000-0000-000000000000";

            // Verificar se já existe admin
            const existingAdmin = await sql`
                SELECT id FROM users 
                WHERE organization_id = ${defaultOrgId} AND role = 'admin'
            `;

            const role = existingAdmin.length === 0 ? "admin" : "user";

            const name =
                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
                clerkUser.username ||
                "User";

            await sql`
                INSERT INTO users (id, name, email, clerk_user_id, role, organization_id, image_url, password)
                VALUES (
                    gen_random_uuid(),
                    ${name},
                    ${email},
                    ${userId},
                    ${role},
                    ${defaultOrgId},
                    ${clerkUser.imageUrl || null},
                    'clerk-auth'
                )
            `;

            return Response.json({
                success: true,
                action: "created",
                message: `Usuário criado com role: ${role}`,
                user: {
                    email,
                    name,
                    clerk_user_id: userId,
                    role,
                    organization_id: defaultOrgId,
                },
            });
        } else {
            // Atualizar usuário existente com clerk_user_id
            const user = existingUser[0];

            if (user.clerk_user_id === userId) {
                return Response.json({
                    success: true,
                    action: "already_synced",
                    message: "Usuário já está sincronizado",
                    user,
                });
            }

            // Atualizar organization_id se estiver NULL
            const orgId =
                user.organization_id || "00000000-0000-0000-0000-000000000000";

            await sql`
                UPDATE users 
                SET clerk_user_id = ${userId},
                    organization_id = ${orgId}
                WHERE email = ${email}
            `;

            return Response.json({
                success: true,
                action: "updated",
                message: "Usuário sincronizado com sucesso",
                user: {
                    ...user,
                    clerk_user_id: userId,
                    organization_id: orgId,
                },
            });
        }
    } catch (error) {
        console.error("Sync error:", error);
        return Response.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
