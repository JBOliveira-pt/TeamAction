import { sql, getOrganizationId } from "./_shared";

// ---------- Ã‰POCA ----------

export async function fetchEpocaAtiva() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                data_inicio: string;
                data_fim: string;
                ativa: boolean;
            }[]
        >`
            SELECT id, nome, data_inicio, data_fim, ativa
            FROM epocas
            WHERE organization_id = ${organizationId}
            ORDER BY ativa DESC, data_inicio DESC
            LIMIT 1
        `;

        return data[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch epoca ativa.");
    }
}

// ---------- PERFIL ----------

export async function fetchPerfilPresidente() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                iban: string | null;
                org_name: string;
                org_slug: string;
                org_created_at: string;
            }[]
        >`
            SELECT
                u.iban,
                o.name   AS org_name,
                o.slug   AS org_slug,
                o.created_at AS org_created_at
            FROM users u
            JOIN organizations o ON o.id = u.organization_id
            WHERE u.organization_id = ${organizationId}
              AND u.role = 'admin'
            LIMIT 1
        `;

        return data[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch perfil presidente.");
    }
}

export async function fetchOrganizacao() {
    try {
        const organizationId = await getOrganizationId();
        const data = await sql<
            {
                id: string;
                name: string;
                slug: string;
                desporto: string | null;
                cidade: string | null;
                pais: string | null;
                website: string | null;
                logo_url: string | null;
                plano: string | null;
                nif: string | null;
                telefone: string | null;
                morada: string | null;
                codigo_postal: string | null;
            }[]
        >`
            SELECT id, name, slug, desporto, cidade, pais, website, logo_url, plano,
                   nif, telefone, morada, codigo_postal
            FROM organizations
            WHERE id = ${organizationId}
            LIMIT 1
        `;
        return data[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch organization.");
    }
}

export async function fetchEscaloes(): Promise<{ id: number; nome: string }[]> {
    try {
        return await sql<{ id: number; nome: string }[]>`
            SELECT id, nome FROM escaloes ORDER BY id ASC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch escaloes.");
    }
}

export async function fetchDesportoOrg(): Promise<string> {
    try {
        const organizationId = await getOrganizationId();
        const result = await sql<{ desporto: string }[]>`
            SELECT desporto FROM organizations WHERE id = ${organizationId}
        `;
        return result[0]?.desporto ?? "";
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch desporto.");
    }
}

export async function fetchEscaloesByUser(userId: string): Promise<string[]> {
    const result = await sql<{ escalao: string }[]>`
    SELECT DISTINCT e.nome AS escalao
    FROM user_cursos uc
    INNER JOIN cursos c ON uc.curso_id = c.id
    INNER JOIN escaloes e ON c.level_id = e.id
    WHERE uc.user_id = ${userId}
  `;
    return result.map((r: { escalao: string }) => r.escalao);
}
