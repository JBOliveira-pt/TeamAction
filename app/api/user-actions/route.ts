import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { ensureAdminTables, fetchUserByClerkId } from "@/app/lib/admin-data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(request: Request) {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await fetchUserByClerkId(clerkUserId);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payload = (await request.json()) as {
        interactionType?: string;
        path?: string;
        metadata?: Record<string, unknown>;
    };

    const interactionType = payload.interactionType?.trim();
    const path = payload.path?.trim();
    const metadata = payload.metadata
        ? JSON.parse(JSON.stringify(payload.metadata))
        : null;

    if (!interactionType || !path) {
        return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    await ensureAdminTables();

    await sql`
        INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
        VALUES (
            ${user.id},
            ${user.name},
            ${user.email},
            ${interactionType},
            ${path},
            ${sql.json(metadata)}
        )
    `;

    return NextResponse.json({ ok: true });
}
