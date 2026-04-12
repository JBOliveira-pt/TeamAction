// Utilitários partilhados de data: conexão BD, org helpers e guards de acesso.
import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import crypto from "node:crypto";
import postgres, { type Sql } from "postgres";

export const isDev = process.env.NODE_ENV !== "production";

export type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

export const MIN_ADULT_SIGNUP_AGE = 18;

export const MINOR_ATHLETE_TEMP_PROFILE_TYPE = "Aviso";

export const MINOR_ATHLETE_TEMP_PROFILE_TITLE = "Mensagem do Administrador";

export function normalizeAccountType(value: unknown): AccountType | null {
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

export function isValidEmailFormat(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function createDeterministicUuid(seed: string): string {
    const hex = crypto.createHash("sha256").update(seed).digest("hex");
    const normalized = hex.slice(0, 32);

    return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;
}

export async function maybeCreateMinorAthleteTemporaryProfileNotice(params: {
    organizationId: string;
    clerkUserId: string;
    dbUserId: string;
    sessionId: string;
}) {
    // Usar BD em vez de Clerk API para evitar rate-limit (429)
    const userRows = await sql<
        { account_type: string | null; data_nascimento: string | null }[]
    >`SELECT account_type, data_nascimento FROM users WHERE id = ${params.dbUserId} LIMIT 1`;

    const accountType = normalizeAccountType(userRows[0]?.account_type);

    if (accountType !== "atleta") {
        return;
    }

    const birthDate = userRows[0]?.data_nascimento;
    if (!birthDate) {
        return;
    }

    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
    }

    if (!Number.isFinite(age) || age >= MIN_ADULT_SIGNUP_AGE) {
        return;
    }

    // Se já tem vinculação aceite, não mostrar aviso
    const acceptedRows = await sql<{ id: string }[]>`
        SELECT id FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${params.dbUserId}
          AND relation_kind = 'responsavel'
          AND status = 'aceite'
        LIMIT 1
    `;
    if (acceptedRows.length > 0) {
        return;
    }

    // Buscar email do responsável na tabela de relações pendentes
    const relRows = await sql<{ alvo_email: string | null }[]>`
        SELECT alvo_email FROM atleta_relacoes_pendentes
        WHERE atleta_user_id = ${params.dbUserId}
          AND relation_kind = 'responsavel'
          AND status = 'pendente'
        ORDER BY created_at DESC
        LIMIT 1
    `;
    const responsibleEmail = relRows[0]?.alvo_email?.trim() ?? "";

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

export async function maybeCreateResponsavelWelcomeNotice(params: {
    organizationId: string;
    dbUserId: string;
}) {
    const userRows = await sql<{ account_type: string | null }[]>`
        SELECT account_type FROM users WHERE id = ${params.dbUserId} LIMIT 1
    `;

    if (normalizeAccountType(userRows[0]?.account_type) !== "responsavel") {
        return;
    }

    const notificationId = createDeterministicUuid(
        `responsavel-welcome:${params.dbUserId}`,
    );

    const message =
        "Bem-vindo(a) à plataforma! Para uma experiência completa, preencha as suas informações pessoais em:\n" +
        "\n" +
        "• O seu perfil: Painel do Responsável → Perfil (/dashboard/responsavel/perfil)\n" +
        "• Dados do seu educando: Painel do Responsável → Dados do Educando (/dashboard/responsavel/dados-educando)\n" +
        "\n" +
        "Mantenha os dados sempre atualizados.";

    await sql`
        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
        VALUES (
            ${notificationId},
            ${params.organizationId},
            ${params.dbUserId},
            'Mensagem do Administrador',
            ${message},
            'Aviso',
            false,
            NOW()
        )
        ON CONFLICT (id) DO NOTHING
    `;
}

// Cache por request: evita repetir a mesma query quando várias
// funções de dados chamam getOrganizationId() em paralelo.
const _cachedOrgLookup = cache(
    async (clerkUserId: string): Promise<string | null> => {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${clerkUserId}`;
        return user[0]?.organization_id ?? null;
    },
);

// Obter organization_id da sessão do utilizador
export async function getOrganizationId(options?: {
    allowAutoProvision?: boolean;
}): Promise<string> {
    const allowAutoProvision = options?.allowAutoProvision ?? true;
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not authenticated");
    }

    // Buscar organization_id da BD usando clerk_user_id.
    // Se não encontrado, fallback por email e reparar clerk_user_id.
    try {
        let orgId = await _cachedOrgLookup(userId);

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
                                SET clerk_user_id = ${userId}, updated_at = NOW()
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

                        // User existe (ex: do webhook) mas não tem org — atualizar em vez de inserir
                        const existingUser =
                            existingByClerkId[0] || existingByEmail[0];
                        if (existingUser) {
                            await txSql`
                                UPDATE users
                                SET clerk_user_id = ${userId}, organization_id = ${newOrg[0].id},
                                    name = ${fullName}, image_url = ${clerkUser.imageUrl || null}, updated_at = NOW()
                                WHERE id = ${existingUser.id}
                            `;
                        } else {
                            const placeholderPassword = `clerk_managed_${crypto.randomUUID()}`;
                            await txSql`
                                INSERT INTO users (id, name, email, password, clerk_user_id, organization_id, image_url, created_at, updated_at)
                                VALUES (gen_random_uuid(), ${fullName}, ${email}, ${placeholderPassword}, ${userId}, ${newOrg[0].id}, ${clerkUser.imageUrl || null}, NOW(), NOW())
                            `;
                        }

                        // Auto-criar equipa mirror para esta organização (1:1)
                        await txSql`
                            INSERT INTO equipas (id, organization_id, nome, escalao, desporto, estado, created_at, updated_at)
                            VALUES (
                                gen_random_uuid(),
                                ${newOrg[0].id},
                                ${orgName},
                                'Geral',
                                'Não definido',
                                'ativa',
                                NOW(),
                                NOW()
                            )
                            ON CONFLICT (organization_id) DO NOTHING
                        `;

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

        // Manter logs silenciosos; apenas re-links explícitos são registados.

        if (!orgId) {
            if (isDev) {
                console.error(`[AUTH] No orgId found for clerk user ${userId}`);
            }
            throw new Error("No organization found for user");
        }

        return orgId;
    } catch (error) {
        console.error("Failed to fetch organization:", error);
        throw new Error("Failed to fetch user organization");
    }
}

export const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
});

/**
 * Retorna { organizationId, userId } apenas se o user autenticado
 * tiver o account_type exigido. Lança erro caso contrário.
 */
export async function requireAccountType(
    ...allowed: AccountType[]
): Promise<{ organizationId: string; dbUserId: string }> {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Not authenticated");

    const rows = await sql<
        { id: string; organization_id: string; account_type: string | null }[]
    >`SELECT id, organization_id, account_type FROM users WHERE clerk_user_id = ${clerkId} LIMIT 1`;

    const user = rows[0];
    if (!user?.organization_id) throw new Error("No organization found");
    if (
        !user.account_type ||
        !allowed.includes(user.account_type as AccountType)
    ) {
        throw new Error("Forbidden: account type not allowed");
    }

    return { organizationId: user.organization_id, dbUserId: user.id };
}
