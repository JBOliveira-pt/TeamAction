import { clerkClient } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(req: Request) {
    // Verify request is local or has auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Get all users from Clerk
        const clerk = await clerkClient();
        const clerkUsers = await clerk.users.getUserList();

        let syncedCount = 0;
        let skippedCount = 0;

        for (const clerkUser of clerkUsers.data) {
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            const name =
                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
            const imageUrl = clerkUser.imageUrl;
            const clerkId = clerkUser.id;

            if (!email) {
                console.log(`Skipping user without email: ${clerkId}`);
                skippedCount++;
                continue;
            }

            // Check if user exists in database
            const existingUser = await sql`
        SELECT id, clerk_user_id FROM users WHERE email = ${email}
      `;

            if (existingUser.length > 0) {
                // Update existing user with Clerk ID
                if (!existingUser[0].clerk_user_id) {
                    await sql`
            UPDATE users
            SET clerk_user_id = ${clerkId}
            WHERE email = ${email}
          `;
                    console.log(`Updated user ${email} with Clerk ID`);
                    syncedCount++;
                } else {
                    console.log(`User ${email} already synced`);
                    skippedCount++;
                }
            } else {
                // Create new user (only if they have an email in Neon)
                console.log(
                    `New Clerk user not in database: ${email} - skipping creation`,
                );
                skippedCount++;
            }
        }

        return new Response(
            JSON.stringify({
                message: "Sync completed",
                syncedCount,
                skippedCount,
                totalClerkUsers: clerkUsers.data.length,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("Sync error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
