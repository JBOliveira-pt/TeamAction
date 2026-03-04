import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return Response.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        // Buscar usuário no banco pelo clerk_user_id
        const user = await sql`
            SELECT id, name, email, clerk_user_id, role, organization_id, image_url
            FROM users 
            WHERE clerk_user_id = ${userId}
        `;

        if (user.length === 0) {
            return Response.json(
                {
                    error: "User not found in database",
                    clerkUserId: userId,
                    suggestion:
                        "O webhook pode não ter sido configurado ou executado. Configure o webhook no Clerk Dashboard.",
                },
                { status: 404 },
            );
        }

        const userData = user[0];

        if (!userData.organization_id) {
            return Response.json(
                {
                    error: "User exists but has no organization_id",
                    user: userData,
                    suggestion:
                        "Execute o SQL para adicionar organization_id: UPDATE users SET organization_id = '00000000-0000-0000-0000-000000000000' WHERE clerk_user_id = '" +
                        userId +
                        "';",
                },
                { status: 200 },
            );
        }

        return Response.json({
            success: true,
            user: userData,
            message: "Usuário configurado corretamente",
        });
    } catch (error) {
        console.error("Debug error:", error);
        return Response.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
