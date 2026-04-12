// Queries de dados do admin: utilizadores, pedidos, logs e newsletter.
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    onnotice: () => {},
});

export type AdminUserRow = {
    id: string;
    name: string;
    email: string;
    image_url: string | null;
    organization_id: string | null;
    organization_name: string | null;
    clerk_user_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    iban: string | null;
    data_nascimento: string | null;
    telefone: string | null;
    sobrenome: string | null;
    morada: string | null;
    peso_kg: number | null;
    altura_cm: number | null;
    nif: string | null;
    codigo_postal: string | null;
    cidade: string | null;
    pais: string | null;
    account_type: string | null;
};

export type AdminAtletaRow = {
    id: string;
    posicao: string | null;
    numero_camisola: number | null;
    equipa_id: string | null;
    equipa_nome: string | null;
    estado: string | null;
    federado: boolean | null;
    numero_federado: string | null;
    mao_dominante: string | null;
};

export type AdminStaffRow = {
    id: string;
    funcao: string | null;
    equipa_id: string | null;
    equipa_nome: string | null;
};

export type AdminEquipaOption = {
    id: string;
    nome: string;
};

export type UserActionLogRow = {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    interaction_type: string;
    path: string;
    metadata: unknown;
    affected_user_name: string | null;
    affected_user_email: string | null;
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
            affected_user_name TEXT NULL,
            affected_user_email TEXT NULL,
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
                u.image_url,
                u.organization_id,
                o.name AS organization_name,
                u.clerk_user_id,
                u.created_at,
                u.updated_at,
                u.account_type
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
            u.image_url,
            u.organization_id,
            o.name AS organization_name,
            u.clerk_user_id,
            u.created_at,
            u.updated_at,
            u.account_type
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE
            u.name ILIKE ${`%${term}%`}
            OR u.email ILIKE ${`%${term}%`}
            OR COALESCE(u.account_type, '') ILIKE ${`%${term}%`}
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
    const optionalCols = await sql<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name IN (
              'data_nascimento', 'telefone',
              'sobrenome', 'morada',
              'nif', 'codigo_postal', 'cidade', 'pais'
          )
    `;

    const has = (col: string) =>
        optionalCols.some((c) => c.column_name === col);

    const data = await sql<AdminUserRow[]>`
        SELECT
            u.id,
            u.name,
            u.email,
            u.image_url,
            u.organization_id,
            o.name AS organization_name,
            u.clerk_user_id,
            u.created_at,
            u.updated_at,
            c.iban,
            ${has("data_nascimento") ? sql`u.data_nascimento::text` : sql`NULL`} AS data_nascimento,
            ${has("telefone") ? sql`u.telefone` : sql`NULL`} AS telefone,
            ${has("sobrenome") ? sql`u.sobrenome` : sql`NULL`} AS sobrenome,
            ${has("morada") ? sql`u.morada` : sql`NULL`} AS morada,
            a.peso_kg,
            a.altura_cm,
            ${has("nif") ? sql`u.nif` : sql`NULL`} AS nif,
            ${has("codigo_postal") ? sql`u.codigo_postal` : sql`NULL`} AS codigo_postal,
            ${has("cidade") ? sql`u.cidade` : sql`NULL`} AS cidade,
            ${has("pais") ? sql`u.pais` : sql`NULL`} AS pais,
            u.account_type
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        LEFT JOIN clubes c ON c.organization_id = u.organization_id
        LEFT JOIN atletas a ON a.user_id = u.id
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
                affected_user_name,
                affected_user_email,
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

    const [
        usersCount,
        actionLogsCount,
        viewLogsCount,
        unreadAvisos,
        pendingPlans,
        pendingProfileChanges,
    ] = await Promise.all([
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
        sql<{ count: number }[]>`
            SELECT COUNT(*)::int AS count
            FROM pedidos_plano
            WHERE status = 'pendente'
        `.catch(() => [{ count: 0 }]),
        sql<{ count: number }[]>`
            SELECT COUNT(*)::int AS count
            FROM pedidos_alteracao_perfil
            WHERE status = 'pendente'
        `.catch(() => [{ count: 0 }]),
    ]);

    return {
        users: usersCount[0]?.count ?? 0,
        actionLogs: actionLogsCount[0]?.count ?? 0,
        viewLogs: viewLogsCount[0]?.count ?? 0,
        avisosNaoLidos: unreadAvisos[0]?.count ?? 0,
        pendingPlans: pendingPlans[0]?.count ?? 0,
        pendingProfileChanges: pendingProfileChanges[0]?.count ?? 0,
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

export type AccountTypeMonthlySeries = {
    accountType: string;
    label: string;
    data: MonthlyCountPoint[];
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    presidente: "Presidente",
    treinador: "Treinador",
    atleta: "Atleta",
    responsavel: "Responsável",
};

export async function fetchAdminUsersAccountTypeMonthlySeries(): Promise<
    AccountTypeMonthlySeries[]
> {
    const rows = await sql<
        { account_type: string; month_start: string; count: number }[]
    >`
        SELECT
            account_type,
            DATE_TRUNC('month', created_at)::date::text AS month_start,
            COUNT(*)::int AS count
        FROM users
        WHERE
            created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
            AND account_type IS NOT NULL
        GROUP BY 1, 2
        ORDER BY 1 ASC, 2 ASC
    `;

    const grouped = new Map<
        string,
        Array<{ month_start: string; count: number }>
    >();

    for (const row of rows) {
        const key = row.account_type;
        const current = grouped.get(key) ?? [];
        current.push({ month_start: row.month_start, count: row.count });
        grouped.set(key, current);
    }

    const order = ["presidente", "treinador", "atleta", "responsavel"];
    const series: AccountTypeMonthlySeries[] = [];

    for (const accountType of order) {
        const dataRows = grouped.get(accountType);
        if (dataRows) {
            series.push({
                accountType,
                label: ACCOUNT_TYPE_LABELS[accountType] ?? accountType,
                data: buildLast12MonthsSeries(dataRows),
            });
        }
    }

    return series;
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

export async function fetchAdminAtletaByUserId(
    userId: string,
): Promise<AdminAtletaRow | null> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'atletas'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return null;

    const hasUserIdCol = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'atletas' AND column_name = 'user_id'
        ) AS exists
    `;
    if (!hasUserIdCol[0]?.exists) return null;

    const data = await sql<AdminAtletaRow[]>`
        SELECT
            a.id,
            a.posicao,
            a.numero_camisola,
            a.equipa_id,
            e.nome AS equipa_nome,
            a.estado,
            a.federado,
            a.numero_federado,
            a.mao_dominante
        FROM atletas a
        LEFT JOIN equipas e ON e.id = a.equipa_id
        WHERE a.user_id = ${userId}
        LIMIT 1
    `;
    return data[0] ?? null;
}

export async function fetchAdminStaffByUserId(
    userId: string,
): Promise<AdminStaffRow | null> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'staff'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return null;

    const hasUserIdCol = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'user_id'
        ) AS exists
    `;
    if (!hasUserIdCol[0]?.exists) return null;

    const data = await sql<AdminStaffRow[]>`
        SELECT
            s.id,
            s.funcao,
            s.equipa_id,
            e.nome AS equipa_nome
        FROM staff s
        LEFT JOIN equipas e ON e.id = s.equipa_id
        WHERE s.user_id = ${userId}
        LIMIT 1
    `;
    return data[0] ?? null;
}

export async function fetchAdminEquipasByOrg(
    organizationId: string,
): Promise<AdminEquipaOption[]> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'equipas'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return [];

    return sql<AdminEquipaOption[]>`
        SELECT id, nome
        FROM equipas
        WHERE organization_id = ${organizationId}
        ORDER BY nome ASC
    `;
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

// ========================================
// Pedidos de Plano
// ========================================

export type AdminPedidoPlanoRow = {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    organization_id: string;
    organization_name: string | null;
    plano_atual: string | null;
    plano_solicitado: string;
    status: string;
    created_at: string;
};

export async function fetchAdminPedidosPlano(
    statusFilter: string = "pendente",
): Promise<AdminPedidoPlanoRow[]> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'pedidos_plano'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return [];

    if (statusFilter === "todos") {
        return sql<AdminPedidoPlanoRow[]>`
            SELECT
                pp.id,
                pp.user_id,
                u.name AS user_name,
                u.email AS user_email,
                pp.organization_id,
                o.name AS organization_name,
                o.plano AS plano_atual,
                pp.plano_solicitado,
                pp.status,
                pp.created_at
            FROM pedidos_plano pp
            JOIN users u ON u.id = pp.user_id
            LEFT JOIN organizations o ON o.id = pp.organization_id
            ORDER BY pp.created_at DESC
            LIMIT 200
        `;
    }

    return sql<AdminPedidoPlanoRow[]>`
        SELECT
            pp.id,
            pp.user_id,
            u.name AS user_name,
            u.email AS user_email,
            pp.organization_id,
            o.name AS organization_name,
            o.plano AS plano_atual,
            pp.plano_solicitado,
            pp.status,
            pp.created_at
        FROM pedidos_plano pp
        JOIN users u ON u.id = pp.user_id
        LEFT JOIN organizations o ON o.id = pp.organization_id
        WHERE pp.status = ${statusFilter}
        ORDER BY pp.created_at DESC
        LIMIT 200
    `;
}

// ========================================
// Pedidos de Alteração de Perfil
// ========================================

export type AdminPedidoPerfilRow = {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    organization_name: string | null;
    campo: string;
    valor_atual: string | null;
    valor_novo: string;
    status: string;
    created_at: string;
};

export async function fetchAdminPedidosPerfil(
    statusFilter: string = "pendente",
): Promise<AdminPedidoPerfilRow[]> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'pedidos_alteracao_perfil'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return [];

    if (statusFilter === "todos") {
        return sql<AdminPedidoPerfilRow[]>`
            SELECT
                pap.id,
                pap.user_id,
                u.name AS user_name,
                u.email AS user_email,
                o.name AS organization_name,
                pap.campo,
                pap.valor_atual,
                pap.valor_novo,
                pap.status,
                pap.created_at
            FROM pedidos_alteracao_perfil pap
            JOIN users u ON u.id = pap.user_id
            LEFT JOIN organizations o ON o.id = pap.organization_id
            ORDER BY pap.created_at DESC
            LIMIT 200
        `;
    }

    return sql<AdminPedidoPerfilRow[]>`
        SELECT
            pap.id,
            pap.user_id,
            u.name AS user_name,
            u.email AS user_email,
            o.name AS organization_name,
            pap.campo,
            pap.valor_atual,
            pap.valor_novo,
            pap.status,
            pap.created_at
        FROM pedidos_alteracao_perfil pap
        JOIN users u ON u.id = pap.user_id
        LEFT JOIN organizations o ON o.id = pap.organization_id
        WHERE pap.status = ${statusFilter}
        ORDER BY pap.created_at DESC
        LIMIT 200
    `;
}

// ========================================
// Convites Pendentes (clube + equipa)
// ========================================

export type AdminConviteRow = {
    id: string;
    tipo_convite: string;
    convidado_nome: string;
    convidado_email: string;
    clube_nome: string | null;
    equipa_nome: string | null;
    convidado_por_nome: string | null;
    estado: string;
    created_at: string;
};

export async function fetchAdminConvitesClubeAll(): Promise<AdminConviteRow[]> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'convites_clube'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return [];

    return sql<AdminConviteRow[]>`
        SELECT
            cc.id,
            cc.tipo AS tipo_convite,
            uc.name AS convidado_nome,
            uc.email AS convidado_email,
            o.name AS clube_nome,
            e.nome AS equipa_nome,
            up.name AS convidado_por_nome,
            cc.estado,
            cc.created_at
        FROM convites_clube cc
        JOIN users uc ON uc.id = cc.convidado_user_id
        LEFT JOIN organizations o ON o.id = cc.clube_org_id
        LEFT JOIN equipas e ON e.id = cc.equipa_id
        LEFT JOIN users up ON up.id = cc.convidado_por
        ORDER BY cc.created_at DESC
        LIMIT 200
    `;
}

export async function fetchAdminConvitesEquipaAll(): Promise<
    AdminConviteRow[]
> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'convites_equipa'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return [];

    return sql<AdminConviteRow[]>`
        SELECT
            ce.id,
            'equipa' AS tipo_convite,
            COALESCE(a_user.name, CONCAT('Atleta #', ce.atleta_id)) AS convidado_nome,
            COALESCE(a_user.email, '') AS convidado_email,
            o.name AS clube_nome,
            ce.equipa_nome,
            ut.name AS convidado_por_nome,
            ce.estado,
            ce.created_at
        FROM convites_equipa ce
        LEFT JOIN atletas a ON a.id = ce.atleta_id
        LEFT JOIN users a_user ON a_user.id = a.user_id
        LEFT JOIN organizations o ON o.id = ce.organization_id
        LEFT JOIN users ut ON ut.id = ce.treinador_id
        ORDER BY ce.created_at DESC
        LIMIT 200
    `;
}

// ========================================
// Relações Pendentes (atleta_relacoes_pendentes)
// ========================================

export type AdminRelacaoPendenteRow = {
    id: string;
    atleta_user_id: string;
    atleta_nome: string;
    atleta_email: string;
    alvo_nome: string | null;
    alvo_email: string | null;
    alvo_clube_nome: string | null;
    relation_kind: string;
    status: string;
    created_at: string;
    responsavel_registado: boolean;
};

export async function fetchAdminRelacoesPendentes(): Promise<
    AdminRelacaoPendenteRow[]
> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'atleta_relacoes_pendentes'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return [];

    return sql<AdminRelacaoPendenteRow[]>`
        SELECT
            arp.id,
            arp.atleta_user_id,
            ua.name AS atleta_nome,
            ua.email AS atleta_email,
            arp.alvo_email,
            COALESCE(o.name, '') AS alvo_clube_nome,
            arp.relation_kind,
            arp.status,
            arp.created_at,
            (arp.alvo_responsavel_user_id IS NOT NULL) AS responsavel_registado
        FROM atleta_relacoes_pendentes arp
        LEFT JOIN users ua ON ua.id = arp.atleta_user_id
        LEFT JOIN organizations o ON o.id = arp.alvo_clube_id
        ORDER BY arp.created_at DESC
        LIMIT 200
    `;
}

// ========================================
// Clube & Equipas (for admin management)
// ========================================

export type AdminClubeRow = {
    id: string;
    organization_id: string;
    nome: string;
    modalidade: string | null;
    nipc: string | null;
    website: string | null;
    telefone: string | null;
    morada: string | null;
    codigo_postal: string | null;
    cidade: string | null;
    pais: string | null;
};

export async function fetchAdminClubeByOrgId(
    organizationId: string,
): Promise<AdminClubeRow | null> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'clubes'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return null;

    const data = await sql<AdminClubeRow[]>`
        SELECT
            c.id,
            c.organization_id,
            c.nome,
            c.modalidade,
            c.nipc,
            c.website,
            c.telefone,
            c.morada,
            c.codigo_postal,
            c.cidade,
            c.pais
        FROM clubes c
        WHERE c.organization_id = ${organizationId}
        LIMIT 1
    `;
    return data[0] ?? null;
}

export type AdminEquipaFullRow = {
    id: string;
    nome: string;
    escalao: string | null;
    estado: string | null;
    desporto: string | null;
    treinador_id: string | null;
    treinador_nome: string | null;
    total_atletas: number;
    total_staff: number;
};

export async function fetchAdminEquipasByOrgFull(
    organizationId: string,
): Promise<AdminEquipaFullRow[]> {
    const hasTable = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'equipas'
        ) AS exists
    `;
    if (!hasTable[0]?.exists) return [];

    return sql<AdminEquipaFullRow[]>`
        SELECT
            e.id,
            e.nome,
            e.escalao,
            e.estado,
            e.desporto,
            e.treinador_id,
            u.name AS treinador_nome,
            (SELECT COUNT(*)::int FROM atletas a WHERE a.equipa_id = e.id) AS total_atletas,
            (SELECT COUNT(*)::int FROM staff s WHERE s.equipa_id = e.id) AS total_staff
        FROM equipas e
        LEFT JOIN users u ON u.id = e.treinador_id
        WHERE e.organization_id = ${organizationId}
        ORDER BY e.nome ASC
    `;
}

/* ─────────────── Newsletter Subscribers ─────────────── */

export type AdminNewsletterRow = {
    id: number;
    nome: string;
    email: string;
    subscribed_at: string;
    thanked_at: string | null;
};

export async function fetchAdminNewsletterSubscribers(): Promise<
    AdminNewsletterRow[]
> {
    return sql<AdminNewsletterRow[]>`
        SELECT id, nome, email, subscribed_at, thanked_at
        FROM newsletter_subscribers
        ORDER BY subscribed_at DESC
    `;
}
