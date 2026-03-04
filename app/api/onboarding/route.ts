import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { organizationName } = body;

    if (!organizationName || organizationName.trim().length === 0) {
        return new Response(
            JSON.stringify({ error: "Organization name is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Check if user already has organization
        const existingUser = await sql`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;

        if (existingUser.length > 0 && existingUser[0].organization_id) {
            return new Response(
                JSON.stringify({ error: "User already has an organization" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        if (existingUser.length === 0) {
            return new Response(
                JSON.stringify({ error: "User not found in database" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Create organization
        const orgSlug = `${organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

        const newOrg = await sql`
            INSERT INTO organizations (id, name, slug, owner_id, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                ${organizationName},
                ${orgSlug},
                ${userId},
                NOW(),
                NOW()
            )
            RETURNING id
        `;

        const organizationId = newOrg[0].id;

        // Update user with organization
        await sql`
            UPDATE users
            SET organization_id = ${organizationId}
            WHERE clerk_user_id = ${userId}
        `;

        console.log(`[ONBOARDING] ✅ Created organization: ${organizationName} (${organizationId}) for user ${userId}`);

        return new Response(
            JSON.stringify({ 
                success: true, 
                organizationId,
                redirect: "/dashboard"
            }),
            { 
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        );
    } catch (error) {
        console.error("[ONBOARDING] ❌ Error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to create organization" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
