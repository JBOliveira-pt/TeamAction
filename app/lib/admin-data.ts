import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    onnotice: () => {},
});

export type AdminUserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    image_url: string | null;
    organization_id: string | null;
    organization_name: string | null;
    clerk_user_id: string | null;
    created_at: string | null;
    updated_at: string | null;
};

export type UserActionLogRow = {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    interaction_type: string;
    path: string;
    metadata: unknown;
    created_at: string;
};

export type UserActionLogFilters = {
    userId?: string;
    interactionType?: string;
    date?: string;
};

export type MonthlyCountPoint = {
    month: string;
    count: number;
};

export type ActionTypeMonthlySeries = {
    interactionType: string;
    data: MonthlyCountPoint[];
};

const VIEW_INTERACTION_TYPE = "page_view";

function buildLast12MonthsSeries(
    rows: Array<{ month_start: string; count: number }>,
): MonthlyCountPoint[] {
    const formatMonth = new Intl.DateTimeFormat("pt-PT", {
        month: "short",
    });
    const now = new Date();
    const map = new Map<string, number>();

    for (const row of rows) {
        const rowDate = new Date(row.month_start);
        if (Number.isNaN(rowDate.getTime())) {
            continue;
        }

        const key = `${rowDate.getUTCFullYear()}-${rowDate.getUTCMonth()}`;
        map.set(key, Number(row.count) || 0);
    }

    const points: MonthlyCountPoint[] = [];

    for (let offset = 11; offset >= 0; offset -= 1) {
        const monthDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
        );
        const key = `${monthDate.getUTCFullYear()}-${monthDate.getUTCMonth()}`;
        const monthLabel = formatMonth
            .format(monthDate)
            .replace(".", "")
            .slice(0, 3);

        points.push({
            month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            count: map.get(key) ?? 0,
        });
    }

    return points;
}

export async function ensureAdminTables() {
    await sql`
        CREATE TABLE IF NOT EXISTS user_action_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NULL,
            user_name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            interaction_type TEXT NOT NULL,
            path TEXT NOT NULL,
            metadata JSONB NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE INDEX IF NOT EXISTS idx_user_action_logs_created_at
        ON user_action_logs (created_at DESC)
    `;

    await sql`
        CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_id
        ON user_action_logs (user_id)
    `;

    await sql`
        CREATE INDEX IF NOT EXISTS idx_user_action_logs_interaction_type
        ON user_action_logs (interaction_type)
    `;
}

export async function fetchAdminUsers(query: string) {
    const term = query.trim();

    if (!term) {
        return sql<AdminUserRow[]>`
            SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                u.image_url,
                u.organization_id,
                o.name AS organization_name,
                u.clerk_user_id,
                u.created_at,
                u.updated_at
            FROM users u
            LEFT JOIN organizations o ON o.id = u.organization_id
            ORDER BY u.created_at DESC NULLS LAST, u.name ASC
            LIMIT 200
        `;
    }

    return sql<AdminUserRow[]>`
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.image_url,
            u.organization_id,
            o.name AS organization_name,
            u.clerk_user_id,
            u.created_at,
            u.updated_at
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE
            u.name ILIKE ${`%${term}%`}
            OR u.email ILIKE ${`%${term}%`}
            OR u.role ILIKE ${`%${term}%`}
            OR COALESCE(o.name, '') ILIKE ${`%${term}%`}
        ORDER BY u.created_at DESC NULLS LAST, u.name ASC
        LIMIT 200
    `;
}

export async function fetchAdminUsersForSelect() {
    return sql<{ id: string; name: string; email: string }[]>`
        SELECT id, name, email
        FROM users
        ORDER BY name ASC
        LIMIT 300
    `;
}

export async function fetchAdminUserById(id: string) {
    const data = await sql<AdminUserRow[]>`
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.image_url,
            u.organization_id,
            o.name AS organization_name,
            u.clerk_user_id,
            u.created_at,
            u.updated_at
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE u.id = ${id}
        LIMIT 1
    `;

    return data[0] ?? null;
}

export async function fetchUserActionLogs(filters: UserActionLogFilters) {
    await ensureAdminTables();

    const params: Array<string> = [];
    const conditions: string[] = [];

    if (filters.userId) {
        params.push(filters.userId);
        conditions.push(`user_id = $${params.length}`);
    }

    if (filters.interactionType) {
        params.push(filters.interactionType);
        conditions.push(`interaction_type = $${params.length}`);
    }

    if (filters.date) {
        params.push(filters.date);
        conditions.push(`DATE(created_at) = $${params.length}`);
    }

    const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    return sql.unsafe<UserActionLogRow[]>(
        `
            SELECT
                id,
                user_id,
                user_name,
                user_email,
                interaction_type,
                path,
                metadata,
                created_at
            FROM user_action_logs
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT 500
        `,
        params,
    );
}

export async function fetchAdminOverviewStats() {
    await ensureAdminTables();

    const [usersCount, actionLogsCount, viewLogsCount, unreadAvisos] =
        await Promise.all([
            sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM users`,
            sql<
                { count: number }[]
            >`SELECT COUNT(*)::int AS count FROM user_action_logs WHERE LOWER(interaction_type) <> ${VIEW_INTERACTION_TYPE}`,
            sql<
                { count: number }[]
            >`SELECT COUNT(*)::int AS count FROM user_action_logs WHERE LOWER(interaction_type) = ${VIEW_INTERACTION_TYPE}`,
            sql<{ count: number }[]>`
            SELECT COUNT(*)::int AS count
            FROM notificacoes
            WHERE tipo = 'Aviso' AND lida = false
        `,
        ]);

    return {
        users: usersCount[0]?.count ?? 0,
        actionLogs: actionLogsCount[0]?.count ?? 0,
        viewLogs: viewLogsCount[0]?.count ?? 0,
        avisosNaoLidos: unreadAvisos[0]?.count ?? 0,
    };
}

export async function fetchInteractionTypes() {
    await ensureAdminTables();

    return sql<{ interaction_type: string }[]>`
        SELECT DISTINCT interaction_type
        FROM user_action_logs
        ORDER BY interaction_type ASC
    `;
}

export async function fetchAdminUsersMonthlySeries() {
    const rows = await sql<{ month_start: string; count: number }[]>`
        SELECT
            DATE_TRUNC('month', created_at)::date::text AS month_start,
            COUNT(*)::int AS count
        FROM users
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return buildLast12MonthsSeries(rows);
}

export async function fetchAdminLogsMonthlySeries() {
    await ensureAdminTables();

    const rows = await sql<{ month_start: string; count: number }[]>`
        SELECT
            DATE_TRUNC('month', created_at)::date::text AS month_start,
            COUNT(*)::int AS count
        FROM user_action_logs
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return buildLast12MonthsSeries(rows);
}

export async function fetchAdminActionLogsMonthlySeries() {
    await ensureAdminTables();

    const rows = await sql<{ month_start: string; count: number }[]>`
        SELECT
            DATE_TRUNC('month', created_at)::date::text AS month_start,
            COUNT(*)::int AS count
        FROM user_action_logs
        WHERE
            created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
            AND LOWER(interaction_type) <> ${VIEW_INTERACTION_TYPE}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return buildLast12MonthsSeries(rows);
}

export async function fetchAdminViewLogsMonthlySeries() {
    await ensureAdminTables();

    const rows = await sql<{ month_start: string; count: number }[]>`
        SELECT
            DATE_TRUNC('month', created_at)::date::text AS month_start,
            COUNT(*)::int AS count
        FROM user_action_logs
        WHERE
            created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
            AND LOWER(interaction_type) = ${VIEW_INTERACTION_TYPE}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return buildLast12MonthsSeries(rows);
}

export async function fetchAdminActionTypeMonthlySeries(): Promise<
    ActionTypeMonthlySeries[]
> {
    await ensureAdminTables();

    const rows = await sql<
        { interaction_type: string; month_start: string; count: number }[]
    >`
        SELECT
            interaction_type,
            DATE_TRUNC('month', created_at)::date::text AS month_start,
            COUNT(*)::int AS count
        FROM user_action_logs
        WHERE
            created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
            AND LOWER(interaction_type) <> ${VIEW_INTERACTION_TYPE}
        GROUP BY 1, 2
        ORDER BY 1 ASC, 2 ASC
    `;

    const grouped = new Map<
        string,
        Array<{ month_start: string; count: number }>
    >();

    for (const row of rows) {
        const key = row.interaction_type;
        const current = grouped.get(key) ?? [];
        current.push({ month_start: row.month_start, count: row.count });
        grouped.set(key, current);
    }

    const series: ActionTypeMonthlySeries[] = [];
    for (const [interactionType, dataRows] of grouped.entries()) {
        series.push({
            interactionType,
            data: buildLast12MonthsSeries(dataRows),
        });
    }

    return series;
}

export async function fetchUserByClerkId(clerkUserId: string) {
    const data = await sql<
        {
            id: string;
            name: string;
            email: string;
            organization_id: string | null;
        }[]
    >`
        SELECT id, name, email, organization_id
        FROM users
        WHERE clerk_user_id = ${clerkUserId}
        LIMIT 1
    `;

    return data[0] ?? null;
}
