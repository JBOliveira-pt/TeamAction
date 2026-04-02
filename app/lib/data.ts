import { auth, clerkClient } from "@clerk/nextjs/server";
import crypto from "node:crypto";
import postgres, { type Sql } from "postgres";
import { User } from "./definitions";
import { ensureRecipientUserIdColumn } from "./notification-schema";

const isDev = process.env.NODE_ENV !== "production";
type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MIN_ADULT_SIGNUP_AGE = 18;
const MINOR_ATHLETE_TEMP_PROFILE_TYPE = "Aviso";
const MINOR_ATHLETE_TEMP_PROFILE_TITLE = "Mensagem do Administrador";

function normalizeAccountType(value: unknown): AccountType | null {
    if (typeof value !== "string") return null;

    const normalized = value.toLowerCase();
    if (
        normalized === "presidente" ||
        normalized === "treinador" ||
        normalized === "atleta" ||
        normalized === "responsavel"
    ) {
        return normalized;
    }

    return null;
}

function isValidEmailFormat(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function createDeterministicUuid(seed: string): string {
    const hex = crypto.createHash("sha256").update(seed).digest("hex");
    const normalized = hex.slice(0, 32);

    return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;
}

async function maybeCreateMinorAthleteTemporaryProfileNotice(params: {
    organizationId: string;
    clerkUserId: string;
    dbUserId: string;
    sessionId: string;
}) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(params.clerkUserId);

    const accountType = normalizeAccountType(
        clerkUser.unsafeMetadata?.accountType ??
            clerkUser.publicMetadata?.accountType,
    );

    if (accountType !== "atleta") {
        return;
    }

    const ageRaw =
        clerkUser.unsafeMetadata?.age ?? clerkUser.publicMetadata?.age;
    const age = typeof ageRaw === "number" ? ageRaw : Number(ageRaw);

    if (!Number.isFinite(age) || age >= MIN_ADULT_SIGNUP_AGE) {
        return;
    }

    const athleteProfileMetadata = clerkUser.unsafeMetadata?.athleteProfile as
        | { responsibleEmail?: unknown }
        | undefined;
    const responsibleEmailRaw = athleteProfileMetadata?.responsibleEmail;
    const responsibleEmail =
        typeof responsibleEmailRaw === "string"
            ? responsibleEmailRaw.trim()
            : "";

    if (!responsibleEmail || !isValidEmailFormat(responsibleEmail)) {
        return;
    }

    const notificationId = createDeterministicUuid(
        `minor-athlete-temp-profile:${params.dbUserId}:${params.sessionId}`,
    );
    const message = `Este é um perfil temporário, precisas da validação de seu responsável (e-mail: ${responsibleEmail}) para acesso integral à plataforma`;

    await sql`
        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
        VALUES (
            ${notificationId},
            ${params.organizationId},
            ${params.dbUserId},
            ${MINOR_ATHLETE_TEMP_PROFILE_TITLE},
            ${message},
            ${MINOR_ATHLETE_TEMP_PROFILE_TYPE},
            false,
            NOW()
        )
        ON CONFLICT (id) DO NOTHING
    `;
}

export async function fetchUsers() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<User[]>`
            SELECT 
                id,
                name,
                email,
                image_url,
                role
            FROM users
            WHERE organization_id = ${organizationId}
            ORDER BY name ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch users.");
    }
}

export async function fetchFilteredUsers(query: string) {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<User[]>`
            SELECT 
                id,
                name,
                email,
                image_url,
                role
            FROM users
            WHERE
                organization_id = ${organizationId}
                AND (
                    name ILIKE ${`%${query}%`} OR
                    email ILIKE ${`%${query}%`} OR
                    role ILIKE ${`%${query}%`}
                )
            ORDER BY name ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch users.");
    }
}

// Helper para pegar organization_id da sessÃ£o
export async function getOrganizationId(options?: {
    allowAutoProvision?: boolean;
}): Promise<string> {
    const allowAutoProvision = options?.allowAutoProvision ?? true;
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not authenticated");
    }

    // Fetch organization_id from database using clerk_user_id.
    // If not found (e.g. user recreated in Clerk), fallback by email and repair clerk_user_id.
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        const foundByClerkId = user.length > 0;
        let orgId = user[0]?.organization_id;

        if (!orgId) {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(userId);
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            const fullName =
                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
                email ||
                `user_${userId}`;
            const accountType = normalizeAccountType(
                clerkUser.unsafeMetadata?.accountType ??
                    clerkUser.publicMetadata?.accountType,
            );
            const role = "user";

            if (email) {
                const fallbackUser = await sql<
                    { id: string; organization_id: string }[]
                >`SELECT id, organization_id FROM users WHERE email = ${email} LIMIT 1`;

                if (fallbackUser[0]?.organization_id) {
                    await sql`
                        UPDATE users
                        SET clerk_user_id = ${userId}
                        WHERE id = ${fallbackUser[0].id}
                    `;

                    orgId = fallbackUser[0].organization_id;
                    if (isDev) {
                        console.log(
                            `[AUTH] Re-linked user by email (${email}) to clerk_user_id ${userId}`,
                        );
                    }
                }

                if (!orgId && allowAutoProvision) {
                    const created = await sql.begin(async (tx) => {
                        const txSql = tx as unknown as Sql;

                        const existingByClerkId = await txSql<
                            { id: string; organization_id: string }[]
                        >`
                            SELECT id, organization_id
                            FROM users
                            WHERE clerk_user_id = ${userId}
                            LIMIT 1
                        `;

                        if (existingByClerkId[0]?.organization_id) {
                            return existingByClerkId[0].organization_id;
                        }

                        const existingByEmail = await txSql<
                            { id: string; organization_id: string }[]
                        >`
                            SELECT id, organization_id
                            FROM users
                            WHERE email = ${email}
                            LIMIT 1
                        `;

                        if (existingByEmail[0]?.organization_id) {
                            await txSql`
                                UPDATE users
                                SET clerk_user_id = ${userId}, role = ${role}, updated_at = NOW()
                                WHERE id = ${existingByEmail[0].id}
                            `;
                            return existingByEmail[0].organization_id;
                        }

                        const orgSlug = `${fullName
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
                        const orgName = `${fullName}'s Organization`;

                        const newOrg = await txSql<{ id: string }[]>`
                            INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
                            VALUES (${orgName}, ${orgSlug}, ${userId}, NOW(), NOW())
                            RETURNING id
                        `;

                        // User exists (e.g. from webhook) but has no org — update instead of insert
                        const existingUser =
                            existingByClerkId[0] || existingByEmail[0];
                        if (existingUser) {
                            await txSql`
                                UPDATE users
                                SET clerk_user_id = ${userId}, role = ${role}, organization_id = ${newOrg[0].id},
                                    name = ${fullName}, image_url = ${clerkUser.imageUrl || null}, updated_at = NOW()
                                WHERE id = ${existingUser.id}
                            `;
                        } else {
                            const placeholderPassword = `clerk_managed_${crypto.randomUUID()}`;
                            await txSql`
                                INSERT INTO users (id, name, email, password, clerk_user_id, role, organization_id, image_url, created_at, updated_at)
                                VALUES (gen_random_uuid(), ${fullName}, ${email}, ${placeholderPassword}, ${userId}, ${role}, ${newOrg[0].id}, ${clerkUser.imageUrl || null}, NOW(), NOW())
                            `;
                        }

                        return newOrg[0].id;
                    });

                    orgId = created;

                    if (isDev) {
                        console.log(
                            `[AUTH] Auto-provisioned organization (${orgId}) for ${email}`,
                        );
                    }
                }
            }
        }

        // Keep request logs quiet; only explicit re-link events are logged.

        if (!orgId) {
            if (isDev) {
                console.error(
                    `[AUTH] No orgId found. Direct match user:`,
                    user[0],
                );
            }
            throw new Error("No organization found for user");
        }

        return orgId;
    } catch (error) {
        console.error("Failed to fetch organization:", error);
        throw new Error("Failed to fetch user organization");
    }
}

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function fetchUserById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<User[]>`
            SELECT id, name, email, password, role, image_url, iban, account_type
      FROM users
      WHERE id = ${id} AND organization_id = ${organizationId}
    `;

        return data[0] || undefined;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch user.");
    }
}

// ============================================
// PRESIDENTE QUERIES
// ============================================

// ---------- EQUIPAS ----------

export async function fetchEquipas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                escalao: string;
                estado: string;
                desporto: string;
                total_atletas: number;
                nome_treinador: string | null;
            }[]
        >`
            SELECT
                equipas.id,
                equipas.nome,
                equipas.escalao,
                equipas.estado,
                equipas.desporto,
                COUNT(atletas.id) AS total_atletas,
                MAX(staff.nome) AS nome_treinador
            FROM equipas
            LEFT JOIN atletas ON atletas.equipa_id = equipas.id
            LEFT JOIN staff ON staff.equipa_id = equipas.id AND staff.funcao = 'treinador'
            WHERE equipas.organization_id = ${organizationId}
            GROUP BY equipas.id, equipas.nome, equipas.escalao, equipas.estado, equipas.desporto
            ORDER BY equipas.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch equipas.");
    }
}

export async function fetchEquipaById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const equipa = await sql<
            {
                id: string;
                nome: string;
                escalao: string;
                estado: string;
                desporto: string;
            }[]
        >`
            SELECT id, nome, escalao, estado, desporto
            FROM equipas
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;

        const atletas = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
            }[]
        >`
            SELECT id, nome, posicao, numero_camisola, estado
            FROM atletas
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY nome ASC
        `;

        const staff = await sql<
            {
                id: string;
                nome: string;
                funcao: string;
            }[]
        >`
            SELECT id, nome, funcao
            FROM staff
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY funcao ASC
        `;

        const jogos = await sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
            }[]
        >`
            SELECT id, adversario, data, casa_fora, resultado_nos, resultado_adv, estado
            FROM jogos
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY data DESC
            LIMIT 10
        `;

        return { equipa: equipa[0], atletas, staff, jogos };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch equipa.");
    }
}

// ---------- ATLETAS ----------

export async function fetchAtletas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                equipa_nome: string | null;
                equipa_id: string | null;
                mensalidade_estado: string | null;
                federado: boolean;
                numero_federado: string | null;
                mao_dominante: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.federado,
                atletas.numero_federado,
                atletas.mao_dominante,
                equipas.nome AS equipa_nome,
                equipas.id   AS equipa_id,
                mensalidades.estado AS mensalidade_estado
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN mensalidades ON mensalidades.atleta_id = atletas.id
                AND mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
                AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
            WHERE atletas.organization_id = ${organizationId}
            ORDER BY atletas.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch atletas.");
    }
}

export async function fetchAtletaById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const atleta = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                federado: boolean;
                numero_federado: string | null;
                mao_dominante: string | null;
                equipa_id: string | null;
                equipa_nome: string | null;
                user_email: string | null;
                user_telefone: string | null;
                user_data_nascimento: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.federado,
                atletas.numero_federado,
                atletas.mao_dominante,
                atletas.equipa_id,
                equipas.nome AS equipa_nome,
                users.email AS user_email,
                users.telefone AS user_telefone,
                users.data_nascimento AS user_data_nascimento
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN users ON atletas.user_id = users.id
            WHERE atletas.id = ${id} AND atletas.organization_id = ${organizationId}
        `;

        const mensalidades = await sql<
            {
                id: string;
                mes: number;
                ano: number;
                valor: number | null;
                estado: string;
                data_pagamento: string | null;
            }[]
        >`
            SELECT id, mes, ano, valor, estado, data_pagamento
            FROM mensalidades
            WHERE atleta_id = ${id}
            ORDER BY ano DESC, mes DESC
            LIMIT 12
        `;

        const estatisticas = await sql<
            {
                total_jogos: number;
                total_golos: number;
                total_assistencias: number;
                total_exclusoes: number;
                total_cartoes_amarelos: number;
                total_cartoes_vermelhos: number;
                total_minutos: number;
            }[]
        >`
            SELECT
                COUNT(estatisticas_jogo.id) AS total_jogos,
                COALESCE(SUM(golos), 0) AS total_golos,
                COALESCE(SUM(assistencias), 0) AS total_assistencias,
                COALESCE(SUM(exclusoes), 0) AS total_exclusoes,
                COUNT(CASE WHEN cartao_amarelo THEN 1 END) AS total_cartoes_amarelos,
                COUNT(CASE WHEN cartao_vermelho THEN 1 END) AS total_cartoes_vermelhos,
                COALESCE(SUM(minutos_jogados), 0) AS total_minutos
            FROM estatisticas_jogo
            WHERE atleta_id = ${id}
        `;

        const assiduidade = await sql<
            {
                total_treinos: number;
                presencas: number;
            }[]
        >`
            SELECT
                COUNT(assiduidade.id) AS total_treinos,
                COUNT(CASE WHEN presente THEN 1 END) AS presencas
            FROM assiduidade
            WHERE atleta_id = ${id}
        `;

        return {
            atleta: atleta[0],
            mensalidades,
            estatisticas: estatisticas[0],
            assiduidade: assiduidade[0],
        };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch atleta.");
    }
}

// ---------- JOGOS ----------

export async function fetchJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
                equipa_id: string;
                equipa_nome: string;
            }[]
        >`
            SELECT
                jogos.id,
                jogos.adversario,
                jogos.data,
                jogos.casa_fora,
                jogos.resultado_nos,
                jogos.resultado_adv,
                jogos.estado,
                jogos.equipa_id,
                equipas.nome AS equipa_nome
            FROM jogos
            LEFT JOIN equipas ON jogos.equipa_id = equipas.id
            WHERE jogos.organization_id = ${organizationId}
            ORDER BY jogos.data DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch jogos.");
    }
}

// ---------- MENSALIDADES ----------

export async function fetchMensalidades() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                mes: number;
                ano: number;
                valor: number | null;
                estado: string;
                data_pagamento: string | null;
                atleta_id: string;
                atleta_nome: string;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                mensalidades.id,
                mensalidades.mes,
                mensalidades.ano,
                mensalidades.valor,
                mensalidades.estado,
                mensalidades.data_pagamento,
                atletas.id AS atleta_id,
                atletas.nome AS atleta_nome,
                equipas.nome AS equipa_nome
            FROM mensalidades
            JOIN atletas ON mensalidades.atleta_id = atletas.id
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            WHERE mensalidades.organization_id = ${organizationId}
            ORDER BY mensalidades.ano DESC, mensalidades.mes DESC, atletas.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch mensalidades.");
    }
}

// ---------- DASHBOARD (resumo) ----------

export async function fetchPresidenteDashboard() {
    try {
        const organizationId = await getOrganizationId();

        const [equipas, atletas, jogos, mensalidades, epoca] =
            await Promise.all([
                sql`SELECT COUNT(*) FROM equipas WHERE organization_id = ${organizationId}`,
                sql`SELECT COUNT(*) FROM atletas WHERE organization_id = ${organizationId}`,
                sql`SELECT COUNT(*) FROM jogos WHERE organization_id = ${organizationId} AND estado = 'agendado'`,
                sql`SELECT COUNT(*) FROM mensalidades WHERE organization_id = ${organizationId} AND estado = 'em_atraso'`,
                sql<{ nome: string }[]>`
    SELECT nome FROM epocas
    WHERE organization_id = ${organizationId} AND ativa = true
    LIMIT 1
`,
            ]);

        return {
            totalEquipas: Number(equipas[0].count),
            totalAtletas: Number(atletas[0].count),
            jogosAgendados: Number(jogos[0].count),
            mensalidadesEmAtraso: Number(mensalidades[0].count),
            epocaNome: epoca[0]?.nome ?? null,
        };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch presidente dashboard.");
    }
}

export async function fetchUltimosJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                data: string;
                adversario: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                casa_fora: string;
            }[]
        >`
            SELECT id, data, adversario, resultado_nos, resultado_adv, casa_fora
            FROM jogos
            WHERE organization_id = ${organizationId}
              AND estado = 'realizado'
            ORDER BY data DESC
            LIMIT 4
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch Ãºltimos jogos.");
    }
}

export async function fetchProximosJogos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                data: string;
                adversario: string;
                casa_fora: string;
                local: string | null;
            }[]
        >`
            SELECT id, data, adversario, casa_fora, local
            FROM jogos
            WHERE organization_id = ${organizationId}
              AND estado = 'agendado'
              AND data >= CURRENT_DATE
            ORDER BY data ASC
            LIMIT 3
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch prÃ³ximos jogos.");
    }
}

// ---------- STAFF ----------

export async function fetchStaff() {
    const organizationId = await getOrganizationId();
    const result = await sql<
        {
            id: string;
            nome: string;
            funcao: string;
            equipa_id: string | null;
            equipa_nome: string | null;
            equipa_escalao: string | null;
            user_id: string | null;
            user_email: string | null;
            created_at: string;
        }[]
    >`
    SELECT
      s.id, s.nome, s.funcao,
      s.equipa_id, e.nome AS equipa_nome, e.escalao AS equipa_escalao,
      s.user_id, u.email AS user_email,
      s.created_at
    FROM staff s
    LEFT JOIN equipas e ON s.equipa_id = e.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.organization_id = ${organizationId}
    ORDER BY s.created_at DESC
  `;
    return result;
}

// ---------- ESTATÃSTICAS ----------

export async function fetchEstatisticasPorEquipa() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                equipa_id: string;
                equipa: string;
                jogos: number;
                vitorias: number;
                empates: number;
                derrotas: number;
                golos_marcados: number;
                golos_sofridos: number;
            }[]
        >`
            SELECT
                equipas.id AS equipa_id,
                equipas.nome AS equipa,
                COUNT(jogos.id) AS jogos,
                COUNT(CASE WHEN jogos.resultado_nos > jogos.resultado_adv THEN 1 END) AS vitorias,
                COUNT(CASE WHEN jogos.resultado_nos = jogos.resultado_adv THEN 1 END) AS empates,
                COUNT(CASE WHEN jogos.resultado_nos < jogos.resultado_adv THEN 1 END) AS derrotas,
                COALESCE(SUM(jogos.resultado_nos), 0) AS golos_marcados,
                COALESCE(SUM(jogos.resultado_adv), 0) AS golos_sofridos
            FROM equipas
            LEFT JOIN jogos ON jogos.equipa_id = equipas.id
                AND jogos.estado = 'realizado'
                AND jogos.resultado_nos IS NOT NULL
            WHERE equipas.organization_id = ${organizationId}
            GROUP BY equipas.id, equipas.nome
            ORDER BY vitorias DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch estatisticas por equipa.");
    }
}

export async function fetchTopAtletas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                atleta_id: string;
                nome: string;
                equipa_nome: string | null;
                golos: number;
                assistencias: number;
                total_treinos: number;
                presencas: number;
            }[]
        >`
            SELECT
                atletas.id AS atleta_id,
                atletas.nome,
                equipas.nome AS equipa_nome,
                COALESCE(SUM(estatisticas_jogo.golos), 0) AS golos,
                COALESCE(SUM(estatisticas_jogo.assistencias), 0) AS assistencias,
                COUNT(DISTINCT assiduidade.sessao_id) AS total_treinos,
                COUNT(DISTINCT CASE WHEN assiduidade.presente THEN assiduidade.sessao_id END) AS presencas
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            LEFT JOIN estatisticas_jogo ON estatisticas_jogo.atleta_id = atletas.id
            LEFT JOIN assiduidade ON assiduidade.atleta_id = atletas.id
            WHERE atletas.organization_id = ${organizationId}
            GROUP BY atletas.id, atletas.nome, equipas.nome
            ORDER BY golos DESC
            LIMIT 5
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch top atletas.");
    }
}

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

// ---------- COMUNICADOS ----------

export async function fetchComunicados() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                titulo: string;
                conteudo: string;
                destinatarios: string;
                criado_por: string;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, conteudo, destinatarios, criado_por, created_at
            FROM comunicados
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch comunicados.");
    }
}

// ---------- AUTORIZAÃ‡Ã•ES ----------

export async function fetchAutorizacoes() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                autorizado_a: string;
                autorizado_por: string;
                tipo_acao: string;
                notas: string | null;
                created_at: string;
            }[]
        >`
            SELECT id, autorizado_a, autorizado_por, tipo_acao, notas, created_at
            FROM autorizacoes_log
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch autorizacoes.");
    }
}

// ---------- DOCUMENTOS ----------

export async function fetchDocumentos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                tipo: string;
                url_r2: string;
                created_at: string;
            }[]
        >`
            SELECT id, nome, tipo, url_r2, created_at
            FROM documentos
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch documentos.");
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

export async function fetchNotificacoes() {
    try {
        const organizationId = await getOrganizationId({
            allowAutoProvision: false,
        });
        const { userId, sessionId } = await auth();

        if (!userId) {
            return [];
        }

        await ensureRecipientUserIdColumn(sql);

        const currentDbUser = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
        `;

        const dbUserId = currentDbUser[0]?.id;

        if (!dbUserId) {
            return [];
        }

        if (sessionId) {
            try {
                await maybeCreateMinorAthleteTemporaryProfileNotice({
                    organizationId,
                    clerkUserId: userId,
                    dbUserId,
                    sessionId,
                });
            } catch (error) {
                console.error(
                    "Failed to create temporary-profile notice for minor athlete:",
                    error,
                );
            }
        }

        const data = await sql<
            {
                id: string;
                titulo: string;
                descricao: string;
                tipo: string;
                lida: boolean;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, descricao, tipo, lida, created_at
            FROM notificacoes
            WHERE organization_id = ${organizationId}
              AND (recipient_user_id IS NULL OR recipient_user_id = ${dbUserId})
            ORDER BY created_at DESC
            LIMIT 50
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch notificacoes.");
    }
}

export async function fetchAtletaAtual() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return null;

        const [user] = await sql<{ id: string; name: string }[]>`
            SELECT id, name FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return null;

        const [atleta] = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                mao_dominante: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.mao_dominante,
                equipas.nome AS equipa_nome
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            WHERE atletas.user_id = ${user.id}
            LIMIT 1
        `;

        if (!atleta)
            return {
                nome: user.name,
                posicao: null,
                numero_camisola: null,
                estado: null,
                mao_dominante: null,
                equipa_nome: null,
                estatisticas: null,
                assiduidade: null,
            };

        const [estatisticas] = await sql<
            {
                total_jogos: number;
                total_golos: number;
                total_assistencias: number;
                total_minutos: number;
            }[]
        >`
            SELECT
                COUNT(estatisticas_jogo.id) AS total_jogos,
                COALESCE(SUM(golos), 0) AS total_golos,
                COALESCE(SUM(assistencias), 0) AS total_assistencias,
                COALESCE(SUM(minutos_jogados), 0) AS total_minutos
            FROM estatisticas_jogo
            WHERE atleta_id = ${atleta.id}
        `;

        const [assiduidade] = await sql<
            {
                total_treinos: number;
                presencas: number;
            }[]
        >`
            SELECT
                COUNT(assiduidade.id) AS total_treinos,
                COUNT(CASE WHEN presente THEN 1 END) AS presencas
            FROM assiduidade
            WHERE atleta_id = ${atleta.id}
        `;

        return {
            ...atleta,
            estatisticas: estatisticas ?? null,
            assiduidade: assiduidade ?? null,
        };
    } catch (error) {
        console.error("Database Error:", error);
        return null;
    }
}

export async function fetchNotasAtleta(): Promise<
    {
        id: string;
        titulo: string;
        conteudo: string;
        created_at: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            {
                id: string;
                titulo: string;
                conteudo: string;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, conteudo, created_at
            FROM notas_atleta
            WHERE user_id = ${user.id}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchRegistosMedicos(): Promise<
    {
        id: string;
        tipo: string;
        descricao: string;
        data_inicio: string;
        data_prevista_retorno: string | null;
        observacoes: string | null;
        estado: string;
        created_at: string;
    }[]
> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return [];

        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return [];

        return await sql<
            {
                id: string;
                tipo: string;
                descricao: string;
                data_inicio: string;
                data_prevista_retorno: string | null;
                observacoes: string | null;
                estado: string;
                created_at: string;
            }[]
        >`
            SELECT id, tipo, descricao, data_inicio, data_prevista_retorno, observacoes, estado, created_at
            FROM registos_medicos
            WHERE user_id = ${user.id}
            ORDER BY created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchPerfilAtletaGeral() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return null;

        const [user] = await sql<
            {
                id: string;
                name: string;
                email: string;
                telefone: string | null;
                data_nascimento: string | null;
                morada: string | null;
                cidade: string | null;
                codigo_postal: string | null;
                pais: string | null;
                menor_idade: boolean | null;
                encarregado_edu: string | null;
                status: boolean | null;
            }[]
        >`
            SELECT
                id, name, email, telefone, data_nascimento,
                morada, cidade, codigo_postal, pais,
                "Menor_idade" AS menor_idade,
                "Encarregado_Edu" AS encarregado_edu,
                CASE
                    WHEN status::text = 'true'  THEN true
                    WHEN status::text = 'false' THEN false
                    ELSE NULL
                END AS status
            FROM users
            WHERE clerk_user_id = ${clerkUserId}
            LIMIT 1
        `;
        if (!user) return null;

        const [atleta] = await sql<
            {
                mao_dominante: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT atletas.mao_dominante, equipas.nome AS equipa_nome
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            WHERE atletas.user_id = ${user.id}
            LIMIT 1
        `;

        let guardian: { name: string; email: string } | null = null;
        if (user.menor_idade && user.encarregado_edu) {
            const [g] = await sql<{ name: string; email: string }[]>`
                SELECT name, email FROM users
                WHERE email = ${user.encarregado_edu}
                LIMIT 1
            `;
            guardian = g ?? null;
        }

        return { user, atleta: atleta ?? null, guardian };
    } catch (error) {
        console.error("Database Error:", error);
        return null;
    }
}

export async function fetchAtletaDoResponsavel() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) return null;

        // Get the guardian's own user record (need their email to find the minor)
        const [guardian] = await sql<
            { id: string; name: string; email: string }[]
        >`
            SELECT id, name, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!guardian) return null;

        // Find the minor whose Encarregado_Edu matches the guardian's email
        const [minorUser] = await sql<
            {
                id: string;
                name: string;
                email: string;
                telefone: string | null;
                data_nascimento: string | null;
                morada: string | null;
                cidade: string | null;
                codigo_postal: string | null;
                pais: string | null;
                status: boolean | null;
            }[]
        >`
            SELECT
                id, name, email, telefone, data_nascimento, morada, cidade, codigo_postal, pais,
                CASE
                    WHEN status::text = 'true'  THEN true
                    WHEN status::text = 'false' THEN false
                    ELSE NULL
                END AS status
            FROM users
            WHERE "Encarregado_Edu" = ${guardian.email}
            AND "Menor_idade" = true
            LIMIT 1
        `;
        if (!minorUser) return null;

        // Get the athlete profile for the minor
        const [atleta] = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                mao_dominante: string | null;
                equipa_nome: string | null;
            }[]
        >`
            SELECT
                atletas.id,
                atletas.nome,
                atletas.posicao,
                atletas.numero_camisola,
                atletas.estado,
                atletas.mao_dominante,
                equipas.nome AS equipa_nome
            FROM atletas
            LEFT JOIN equipas ON atletas.equipa_id = equipas.id
            WHERE atletas.user_id = ${minorUser.id}
            LIMIT 1
        `;

        let estatisticas = null;
        let assiduidade = null;

        if (atleta) {
            const [stats] = await sql<
                {
                    total_jogos: number;
                    total_golos: number;
                    total_assistencias: number;
                    total_minutos: number;
                }[]
            >`
                SELECT
                    COUNT(estatisticas_jogo.id) AS total_jogos,
                    COALESCE(SUM(golos), 0) AS total_golos,
                    COALESCE(SUM(assistencias), 0) AS total_assistencias,
                    COALESCE(SUM(minutos_jogados), 0) AS total_minutos
                FROM estatisticas_jogo
                WHERE atleta_id = ${atleta.id}
            `;
            estatisticas = stats ?? null;

            const [assid] = await sql<
                {
                    total_treinos: number;
                    presencas: number;
                }[]
            >`
                SELECT
                    COUNT(assiduidade.id) AS total_treinos,
                    COUNT(CASE WHEN presente THEN 1 END) AS presencas
                FROM assiduidade
                WHERE atleta_id = ${atleta.id}
            `;
            assiduidade = assid ?? null;
        }

        return {
            guardian,
            minorUser,
            atleta: atleta ?? null,
            estatisticas,
            assiduidade,
        };
    } catch (error) {
        console.error("Database Error:", error);
        return null;
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

export async function fetchConvitesPendentes() {
    try {
        const organizationId = await getOrganizationId();
        return await sql<
            {
                id: string;
                atleta_user_id: string;
                user_name: string;
                user_email: string;
                user_image: string | null;
                status: string;
                created_at: string;
            }[]
        >`
            SELECT
                arp.id,
                arp.atleta_user_id,
                u.name  AS user_name,
                u.email AS user_email,
                u.image_url AS user_image,
                arp.status,
                arp.created_at::text
            FROM atleta_relacoes_pendentes arp
            JOIN users u ON u.id = arp.atleta_user_id
            WHERE arp.alvo_clube_id = ${organizationId}
            AND arp.relation_kind = 'clube'
            ORDER BY arp.created_at DESC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
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

export async function fetchUsersForStaff() {
    const organizationId = await getOrganizationId();
    const result = await sql<
        {
            id: string;
            name: string;
            email: string;
            image_url: string | null;
        }[]
    >`
    SELECT id, name, email, image_url
    FROM users
    WHERE organization_id = ${organizationId}
    ORDER BY name ASC
  `;
    return result;
}
