import { auth } from "@clerk/nextjs/server";
import { ensureRecipientUserIdColumn } from "@/app/lib/notification-schema";
import { requireApiAccountType } from "@/app/lib/api-guards";
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function PATCH(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const access = await requireApiAccountType();
    if (!access.ok) {
        return NextResponse.json(
            { error: access.error },
            { status: access.status },
        );
    }

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await sql<{ organization_id: string }[]>`
        SELECT organization_id
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;

    const organizationId = organization[0]?.organization_id;
    if (!organizationId) {
        return NextResponse.json({ error: "No organization" }, { status: 404 });
    }

    const { id } = await params;

    const dbUser = await sql<{ id: string }[]>`
        SELECT id
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;

    const dbUserId = dbUser[0]?.id;
    if (!dbUserId) {
        return NextResponse.json(
            { error: "User not found in DB" },
            { status: 404 },
        );
    }

    await ensureRecipientUserIdColumn(sql);

    await sql`
        UPDATE notificacoes
        SET lida = true
        WHERE id = ${id}
          AND organization_id = ${organizationId}
          AND (recipient_user_id IS NULL OR recipient_user_id = ${dbUserId})
    `;

    return NextResponse.json({ ok: true });
}
