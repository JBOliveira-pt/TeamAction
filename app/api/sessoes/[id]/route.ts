import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const { id } = await params;

    const deleted = await sql`
        DELETE FROM sessoes
        WHERE id = ${id}
          AND organization_id = ${user.organization_id}
        RETURNING id
    `;

    if (deleted.length === 0) return new Response("Not found", { status: 404 });

    return new Response(null, { status: 204 });
}
