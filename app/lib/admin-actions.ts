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

async function deleteInvoicesAndReceiptsByUser(
    tx: SqlExecutor,
    userId: string,
): Promise<void> {
    const hasInvoices = await tableExists(tx, "invoices");
    if (!hasInvoices) {
        return;
    }

    const hasInvoiceCreator = await columnExists(tx, "invoices", "created_by");
    if (!hasInvoiceCreator) {
        return;
    }

    const hasReceipts = await tableExists(tx, "receipts");
    if (hasReceipts) {
        const [receiptHasCreatedBy, receiptHasInvoiceId] = await Promise.all([
            columnExists(tx, "receipts", "created_by"),
            columnExists(tx, "receipts", "invoice_id"),
        ]);

        if (receiptHasCreatedBy) {
            await tx`
                DELETE FROM receipts
                WHERE created_by = ${userId}
            `;
        }

        if (receiptHasInvoiceId) {
            await tx`
                DELETE FROM receipts
                WHERE invoice_id IN (
                    SELECT id FROM invoices WHERE created_by = ${userId}
                )
            `;
        }
    }

    await tx`
        DELETE FROM invoices
        WHERE created_by = ${userId}
    `;
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
    const accountType = normalizeAccountType(formData.get("accountType"));

    if (!name || !email || !accountType) {
        redirect(`/admin/users/${userId}?error=required`);
    }

    const role = "user";

    try {
        const userData = await sql<{ clerk_user_id: string | null }[]>`
            SELECT clerk_user_id
            FROM users
            WHERE id = ${userId}
            LIMIT 1
        `;

        const clerkUserId = userData[0]?.clerk_user_id;

        if (clerkUserId) {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(clerkUserId);

            await client.users.updateUserMetadata(clerkUserId, {
                unsafeMetadata: {
                    ...clerkUser.unsafeMetadata,
                    accountType,
                },
                publicMetadata: {
                    ...clerkUser.publicMetadata,
                    accountType,
                    role,
                },
            });
        }

        await sql`
            UPDATE users
            SET name = ${name}, email = ${email}, role = ${role}, updated_at = NOW()
            WHERE id = ${userId}
        `;

        await ensureAdminTables();
        const updateMetadata: JSONValue = JSON.parse(
            JSON.stringify({ name, email, role, accountType }),
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
    redirect(`/admin/users/${userId}?success=1`);
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

            await deleteInvoicesAndReceiptsByUser(executor, userId);
            await deleteByColumnIfExists(
                executor,
                "customers",
                "created_by",
                userId,
            );
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
