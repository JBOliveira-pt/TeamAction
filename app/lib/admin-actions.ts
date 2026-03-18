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

    const role = accountType === "presidente" ? "admin" : "user";

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
