import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const metadata = (sessionClaims?.metadata || {}) as Record<string, unknown>;
    const unsafeMeta = (sessionClaims as Record<string, unknown>)?.unsafe_metadata;

    const dbRows = await sql`SELECT account_type FROM users WHERE clerk_user_id = ${userId} LIMIT 1`;

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    return NextResponse.json({
        clerkUserId: userId,
        jwt_sessionClaims_metadata: metadata,
        jwt_unsafe_metadata: unsafeMeta ?? null,
        db_account_type: dbRows[0]?.account_type ?? null,
        clerk_publicMetadata: clerkUser.publicMetadata,
        clerk_unsafeMetadata: clerkUser.unsafeMetadata,
        all_session_claim_keys: Object.keys(sessionClaims || {}),
    });
}
