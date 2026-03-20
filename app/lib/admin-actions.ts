"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import postgres, { type JSONValue } from "postgres";
import { clerkClient } from "@clerk/nextjs/server";
import {
    clearAdminSessionCookie,
    createAdminSessionToken,
    requireAdminSession,
    setAdminSessionCookie,
} from "@/app/lib/admin-auth";
import { ensureAdminTables } from "@/app/lib/admin-data";
import { ensureRecipientUserIdColumn } from "@/app/lib/notification-schema";

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    onnotice: () => {},
});

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

function normalizeAccountType(value: unknown): AccountType | null {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim().toLowerCase();
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

function getAdminPasswordHash(): string {
    const hash = process.env.ADMIN_LOGIN_PASSWORD_HASH;
    if (!hash) {
        throw new Error(
            "Missing ADMIN_LOGIN_PASSWORD_HASH environment variable.",
        );
    }
    return hash;
}

function isClerkNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
        return false;
    }

    const maybeStatus = (error as { status?: unknown }).status;
    return typeof maybeStatus === "number" && maybeStatus === 404;
}

const ADMIN_DELETE_CONFIRM_TEXT = "deletarconta";

type SqlExecutor = typeof sql;

async function tableExists(
    tx: SqlExecutor,
    tableName: string,
): Promise<boolean> {
    const data = await tx<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = ${tableName}
        ) AS exists
    `;

    return Boolean(data[0]?.exists);
}

async function columnExists(
    tx: SqlExecutor,
    tableName: string,
    columnName: string,
): Promise<boolean> {
    const data = await tx<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ${tableName}
              AND column_name = ${columnName}
        ) AS exists
    `;

    return Boolean(data[0]?.exists);
}

async function deleteByColumnIfExists(
    tx: SqlExecutor,
    tableName: string,
    columnName: string,
    userId: string,
): Promise<void> {
    const [hasTable, hasColumn] = await Promise.all([
        tableExists(tx, tableName),
        columnExists(tx, tableName, columnName),
    ]);

    if (!hasTable || !hasColumn) {
        return;
    }

    await tx`
        DELETE FROM ${tx(tableName)}
        WHERE ${tx(columnName)} = ${userId}
    `;
}

async function deleteRecibosByUser(
    tx: SqlExecutor,
    userId: string,
): Promise<void> {
    const hasRecibos = await tableExists(tx, "recibos");
    if (!hasRecibos) {
        return;
    }

    const hasCreatedBy = await columnExists(tx, "recibos", "created_by");
    if (hasCreatedBy) {
        await tx`
            DELETE FROM recibos
            WHERE created_by = ${userId}
        `;
    }
}

export async function adminLoginAction(formData: FormData): Promise<void> {
    const password = String(formData.get("password") || "").trim();

    if (!password) {
        redirect("/admin-login?error=1");
    }

    let isValid = false;
    try {
        isValid = await bcrypt.compare(password, getAdminPasswordHash());
    } catch {
        redirect("/admin-login?error=config");
    }

    if (!isValid) {
        redirect("/admin-login?error=1");
    }

    try {
        await sql`
            UPDATE users
            SET role = 'user', updated_at = NOW()
            WHERE role = 'admin'
        `;
    } catch (error) {
        console.error("Falha ao normalizar papeis de usuários:", error);
    }

    const token = createAdminSessionToken();
    await setAdminSessionCookie(token);
    redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
    await clearAdminSessionCookie();
    redirect("/admin-login");
}

export async function adminUpdateUserAction(
    userId: string,
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const organizationName = String(
        formData.get("organizationName") || "",
    ).trim();
    const profilePhoto = formData.get("profilePhoto");
    const iban = String(formData.get("iban") || "").trim() || null;
    const dataNascimento =
        String(formData.get("dataNascimento") || "").trim() || null;
    const telefone = String(formData.get("telefone") || "").trim() || null;
    const rawPassword = String(formData.get("password") || "").trim();

    // Extended personal fields
    const sobrenome = String(formData.get("sobrenome") || "").trim() || null;
    const morada = String(formData.get("morada") || "").trim() || null;
    const pesoKg = String(formData.get("pesoKg") || "").trim() || null;
    const alturaCm = String(formData.get("alturaCm") || "").trim() || null;
    const nif = String(formData.get("nif") || "").trim() || null;
    const codigoPostal =
        String(formData.get("codigoPostal") || "").trim() || null;
    const cidade = String(formData.get("cidade") || "").trim() || null;
    const pais = String(formData.get("pais") || "").trim() || null;

    // Athlete-specific fields
    const atletaId = String(formData.get("atletaId") || "").trim() || null;
    const posicao = String(formData.get("posicao") || "").trim() || null;
    const numeroCamisola =
        String(formData.get("numeroCamisola") || "").trim() || null;
    const equipaId = String(formData.get("equipaId") || "").trim() || null;
    const estadoAtleta =
        String(formData.get("estadoAtleta") || "").trim() || null;
    const maoDominante =
        String(formData.get("maoDominante") || "").trim() || null;
    const federado = formData.get("federado") === "on";
    const numeroFederado =
        String(formData.get("numeroFederado") || "").trim() || null;

    // Staff-specific fields
    const staffId = String(formData.get("staffId") || "").trim() || null;
    const funcaoStaff =
        String(formData.get("funcaoStaff") || "").trim() || null;
    const equipaIdStaff =
        String(formData.get("equipaIdStaff") || "").trim() || null;

    if (!name || !email) {
        redirect(`/admin/users/${userId}?error=required`);
    }

    let emailChanged = false;

    try {
        const userData = await sql<
            {
                clerk_user_id: string | null;
                email: string;
                organization_id: string | null;
            }[]
        >`
            SELECT clerk_user_id, email, organization_id
            FROM users
            WHERE id = ${userId}
            LIMIT 1
        `;

        const currentUser = userData[0];
        if (!currentUser) {
            redirect(`/admin/users/${userId}?error=update`);
        }

        const clerkUserId = currentUser.clerk_user_id;

        // --- Photo upload via R2 ---
        let imageUrl: string | null = null;
        if (profilePhoto instanceof File && profilePhoto.size > 0) {
            const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
            const ALLOWED_PHOTO_TYPES = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ];
            if (
                !ALLOWED_PHOTO_TYPES.includes(profilePhoto.type) ||
                profilePhoto.size > MAX_PHOTO_SIZE
            ) {
                redirect(`/admin/users/${userId}?error=update`);
            }
            const { uploadImageToR2 } = await import("@/app/lib/r2-storage");
            imageUrl = await uploadImageToR2(profilePhoto, "user", userId);
        }

        // --- Clerk updates (name, email, password) ---
        if (clerkUserId) {
            const client = await clerkClient();

            // Split name for Clerk first/last
            const nameParts = name.split(/\s+/);
            const firstName = nameParts[0] || name;
            const lastName =
                nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

            await client.users.updateUser(clerkUserId, {
                firstName,
                lastName,
            });

            // Handle email change via Clerk — creates an unverified email address
            const previousEmail = currentUser.email.toLowerCase();
            const newEmail = email.toLowerCase();
            if (newEmail !== previousEmail) {
                emailChanged = true;
                await client.emailAddresses.createEmailAddress({
                    userId: clerkUserId,
                    emailAddress: email,
                });
            }

            // Handle password change via Clerk
            if (rawPassword.length > 0) {
                await client.users.updateUser(clerkUserId, {
                    password: rawPassword,
                });
            }
        }

        // --- Database: update users table ---
        const hashedPassword =
            rawPassword.length > 0 ? await bcrypt.hash(rawPassword, 12) : null;

        // Discover optional columns
        const optionalCols = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name IN (
                  'iban', 'data_nascimento', 'telefone',
                  'sobrenome', 'morada', 'peso_kg', 'altura_cm',
                  'nif', 'codigo_postal', 'cidade', 'pais'
              )
        `;
        const hasCol = (col: string) =>
            optionalCols.some((c) => c.column_name === col);

        // Core fields always present
        if (hashedPassword && imageUrl) {
            await sql`
                UPDATE users
                SET name = ${name}, email = ${email}, image_url = ${imageUrl},
                    password = ${hashedPassword}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        } else if (hashedPassword) {
            await sql`
                UPDATE users
                SET name = ${name}, email = ${email},
                    password = ${hashedPassword}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        } else if (imageUrl) {
            await sql`
                UPDATE users
                SET name = ${name}, email = ${email}, image_url = ${imageUrl},
                    updated_at = NOW()
                WHERE id = ${userId}
            `;
        } else {
            await sql`
                UPDATE users
                SET name = ${name}, email = ${email},
                    updated_at = NOW()
                WHERE id = ${userId}
            `;
        }

        // Update optional columns individually
        if (hasCol("iban")) {
            await sql`
                UPDATE users SET iban = ${iban}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("data_nascimento") && dataNascimento) {
            await sql`
                UPDATE users SET data_nascimento = ${dataNascimento}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("telefone")) {
            await sql`
                UPDATE users SET telefone = ${telefone}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("sobrenome")) {
            await sql`
                UPDATE users SET sobrenome = ${sobrenome}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("morada")) {
            await sql`
                UPDATE users SET morada = ${morada}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("peso_kg") && pesoKg !== null) {
            await sql`
                UPDATE users SET peso_kg = ${Number(pesoKg)}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("altura_cm") && alturaCm !== null) {
            await sql`
                UPDATE users SET altura_cm = ${Number(alturaCm)}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("nif")) {
            await sql`
                UPDATE users SET nif = ${nif}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("codigo_postal")) {
            await sql`
                UPDATE users SET codigo_postal = ${codigoPostal}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("cidade")) {
            await sql`
                UPDATE users SET cidade = ${cidade}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (hasCol("pais")) {
            await sql`
                UPDATE users SET pais = ${pais}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }

        // --- Database: update atletas table ---
        if (atletaId) {
            const hasAtletas = await tableExists(sql, "atletas");
            if (hasAtletas) {
                await sql`
                    UPDATE atletas
                    SET posicao = ${posicao},
                        numero_camisola = ${numeroCamisola ? Number(numeroCamisola) : null},
                        equipa_id = ${equipaId || null},
                        estado = ${estadoAtleta || "ativo"},
                        federado = ${federado},
                        numero_federado = ${federado ? numeroFederado : null},
                        mao_dominante = ${maoDominante}
                    WHERE id = ${atletaId}
                `;
            }
        }

        // --- Database: update staff table ---
        if (staffId) {
            const hasStaff = await tableExists(sql, "staff");
            if (hasStaff) {
                await sql`
                    UPDATE staff
                    SET funcao = ${funcaoStaff},
                        equipa_id = ${equipaIdStaff || null}
                    WHERE id = ${staffId}
                `;
            }
        }

        // --- Database: update organization name ---
        if (organizationName && currentUser.organization_id) {
            await sql`
                UPDATE organizations
                SET name = ${organizationName}, updated_at = NOW()
                WHERE id = ${currentUser.organization_id}
            `;
        }

        // --- Audit log ---
        await ensureAdminTables();
        const updateMetadata: JSONValue = JSON.parse(
            JSON.stringify({
                name,
                email,
                organizationName: organizationName || null,
                imageUrl: imageUrl || null,
                photoUploaded: imageUrl !== null,
                iban,
                dataNascimento,
                telefone,
                sobrenome,
                morada,
                pesoKg,
                alturaCm,
                nif,
                codigoPostal,
                cidade,
                pais,
                atletaId,
                staffId,
                passwordChanged: rawPassword.length > 0,
                emailChanged,
            }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                ${userId},
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_user_update"},
                ${`/admin/users/${userId}`},
                ${sql.json(updateMetadata)}
            )
        `;
    } catch (error) {
        console.error(error);
        redirect(`/admin/users/${userId}?error=update`);
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    redirect(
        `/admin/users/${userId}?success=${emailChanged ? "email_pending" : "1"}`,
    );
}

export async function adminDeleteUserAction(
    userId: string,
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    const confirmation = String(
        formData.get("deleteConfirmation") || "",
    ).trim();
    if (confirmation !== ADMIN_DELETE_CONFIRM_TEXT) {
        redirect(`/admin/users/${userId}?error=delete_confirmation`);
    }

    let targetUser:
        | {
              id: string;
              name: string;
              email: string;
              clerk_user_id: string | null;
          }
        | undefined;

    try {
        const rows = await sql<
            {
                id: string;
                name: string;
                email: string;
                clerk_user_id: string | null;
            }[]
        >`
            SELECT id, name, email, clerk_user_id
            FROM users
            WHERE id = ${userId}
            LIMIT 1
        `;

        targetUser = rows[0];
    } catch (error) {
        console.error(error);
        redirect(`/admin/users/${userId}?error=delete`);
    }

    if (!targetUser) {
        redirect("/admin/users?error=user_not_found");
    }

    try {
        await sql.begin(async (tx) => {
            const executor = tx as unknown as SqlExecutor;

            await deleteRecibosByUser(executor, userId);
            await deleteByColumnIfExists(
                executor,
                "atletas",
                "user_id",
                userId,
            );
            await deleteByColumnIfExists(executor, "staff", "user_id", userId);
            await deleteByColumnIfExists(
                executor,
                "notificacoes",
                "recipient_user_id",
                userId,
            );
            await deleteByColumnIfExists(
                executor,
                "user_action_logs",
                "user_id",
                userId,
            );

            await executor`
                DELETE FROM users
                WHERE id = ${userId}
            `;
        });
    } catch (error) {
        console.error(error);
        redirect(`/admin/users/${userId}?error=delete`);
    }

    let clerkDeletionWarning = false;

    if (targetUser.clerk_user_id) {
        try {
            const client = await clerkClient();
            await client.users.deleteUser(targetUser.clerk_user_id);
        } catch (error) {
            if (isClerkNotFoundError(error)) {
                console.info(
                    "Usuário ja nao existia no Clerk durante exclusao:",
                    targetUser.clerk_user_id,
                );
            } else {
                console.error("Falha ao remover usuário no Clerk:", error);
                clerkDeletionWarning = true;
            }
        }
    }

    try {
        await ensureAdminTables();
        const deleteMetadata: JSONValue = JSON.parse(
            JSON.stringify({
                deletedUserId: targetUser.id,
                deletedUserEmail: targetUser.email,
                deletedUserName: targetUser.name,
            }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_user_delete"},
                ${`/admin/users/${userId}`},
                ${sql.json(deleteMetadata)}
            )
        `;
    } catch (error) {
        console.error("Falha ao registar log de exclusao de usuário:", error);
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    if (clerkDeletionWarning) {
        redirect("/admin/users?success=deleted&warning=clerk");
    }

    redirect("/admin/users?success=deleted");
}

export async function adminCreateAvisoAction(
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    await ensureRecipientUserIdColumn(sql);

    const titulo = String(formData.get("titulo") || "").trim();
    const descricao = String(formData.get("descricao") || "").trim();
    const scope = String(formData.get("scope") || "all");
    const userId = String(formData.get("userId") || "").trim();

    if (!titulo || !descricao) {
        redirect("/admin/avisos?error=required");
    }

    try {
        if (scope === "user") {
            if (!userId) {
                redirect("/admin/avisos?error=user");
            }

            const targetUser = await sql<
                { organization_id: string | null }[]
            >`SELECT organization_id FROM users WHERE id = ${userId} LIMIT 1`;

            const targetOrgId = targetUser[0]?.organization_id;
            if (!targetOrgId) {
                redirect("/admin/avisos?error=org");
            }

            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (gen_random_uuid(), ${targetOrgId}, ${userId}, ${titulo}, ${descricao}, 'Aviso', false, NOW())
            `;
        } else {
            const organizations = await sql<{ id: string }[]>`
                SELECT id FROM organizations
            `;

            if (organizations.length === 0) {
                redirect("/admin/avisos?error=no_org");
            }

            await Promise.all(
                organizations.map(
                    (org) =>
                        sql`
                        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                        VALUES (gen_random_uuid(), ${org.id}, NULL, ${titulo}, ${descricao}, 'Aviso', false, NOW())
                    `,
                ),
            );
        }

        await ensureAdminTables();
        const warningMetadata: JSONValue = JSON.parse(
            JSON.stringify({ titulo, scope, userId: userId || null }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_warning_emit"},
                ${"/admin/avisos"},
                ${sql.json(warningMetadata)}
            )
        `;
    } catch (error) {
        console.error(error);
        redirect("/admin/avisos?error=emit");
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/avisos");
    redirect("/admin/avisos?success=1");
}
