import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS calendar_notes (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            treinador_id UUID       NOT NULL,
            organization_id UUID   NOT NULL,
            data        DATE        NOT NULL,
            nota        TEXT        NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
}

async function getUser(clerkUserId: string) {
    const rows = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const date = req.nextUrl.searchParams.get("data");
    if (!date) return new Response("Missing date", { status: 400 });

    await ensureTable();

    const rows = await sql<{ id: string; nota: string; created_at: string }[]>`
        SELECT id, nota, created_at
        FROM calendar_notes
        WHERE treinador_id = ${user.id}
          AND organization_id = ${user.organization_id}
          AND data = ${date}
        ORDER BY created_at ASC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const body = await req.json();
    const { data, nota } = body as { data?: string; nota?: string };
    if (!data || !nota?.trim()) return new Response("Missing fields", { status: 400 });

    await ensureTable();

    const rows = await sql<{ id: string; nota: string; created_at: string }[]>`
        INSERT INTO calendar_notes (treinador_id, organization_id, data, nota)
        VALUES (${user.id}, ${user.organization_id}, ${data}, ${nota.trim()})
        RETURNING id, nota, created_at
    `;

    return Response.json(rows[0], { status: 201 });
}
