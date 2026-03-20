"use server";

import { auth } from "@clerk/nextjs/server";
import { canEditResource } from "./auth-helpers";
import {
    deleteImageFromR2,
    uploadAtletaPhotoToR2,
    uploadImageToR2,
} from "./r2-storage";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres, { type JSONValue } from "postgres";
import { z } from "zod";
import type { AtletaState } from "./definitions";
import { getOrganizationId } from "@/app/lib/data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/**
 * Regista uma aÃ§Ã£o de usuÃ¡rio em user_action_logs.
 * Nunca lanÃ§a excepÃ§Ã£o â€“ falhas de logging nÃ£o devem bloquear a aÃ§Ã£o principal.
 */
async function logAction(
    clerkUserId: string | null | undefined,
    interactionType: string,
    path: string,
    metadata?: Record<string, unknown>,
): Promise<void> {
    if (!clerkUserId) return;
    try {
        const rows = await sql<{ id: string; name: string; email: string }[]>`
            SELECT id, name, email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!rows.length) return;
        const { id: dbUserId, name, email } = rows[0];
        const serializedMetadata: JSONValue = metadata
            ? JSON.parse(JSON.stringify(metadata))
            : null;
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (${dbUserId}, ${name}, ${email}, ${interactionType}, ${path}, ${sql.json(serializedMetadata)})
        `;
    } catch (err) {
        console.error("[logAction] Failed to log action:", err);
    }
}

// Helper function to check elevated permissions
async function checkAdminPermission() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized: No session");
    }

    throw new Error("Unauthorized: Elevated access required");
}

// Maximum photo size: 5MB
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const SignUpSchema = z.object({
    orgName: z.string().min(1, "Organization name is required"),
    adminName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

async function persistPhotoToR2(
    file: File | null,
    entityType: "customer" | "user",
    entityId: string,
): Promise<string | null> {
    if (!file || file.size === 0) {
        return null;
    }

    if (file.size > MAX_PHOTO_SIZE) {
        throw new Error(
            `Photo size exceeds ${MAX_PHOTO_SIZE / 1024 / 1024}MB limit`,
        );
    }

    const tableName = entityType === "customer" ? "customers" : "users";

    let previousImageUrl: string | null = null;
    try {
        const previous = await sql<{ image_url: string | null }[]>`
            SELECT image_url FROM ${sql(tableName)} WHERE id = ${entityId}
        `;
        previousImageUrl = previous[0]?.image_url ?? null;
    } catch (error) {
        console.error("Failed to fetch previous image URL:", error);
    }

    // Upload to R2
    const imageUrl = await uploadImageToR2(file, entityType, entityId);

    // Update database with R2 URL
    await sql`
    UPDATE ${sql(tableName)}
    SET image_url = ${imageUrl}
    WHERE id = ${entityId}
  `;

    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    if (
        previousImageUrl &&
        r2PublicUrl &&
        previousImageUrl.startsWith(r2PublicUrl)
    ) {
        try {
            await deleteImageFromR2(previousImageUrl);
        } catch (error) {
            console.error("Failed to delete previous image:", error);
        }
    }

    return imageUrl;
}

async function saveUserPhoto(
    file: File | null,
    userId: string,
): Promise<string | null> {
    return persistPhotoToR2(file, "user", userId);
}

// Authentication is now handled by Clerk
// Remove calls to this function and use Clerk's <SignInButton> instead
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    // This function is deprecated with Clerk integration
    throw new Error(
        "Use Clerk's SignInButton instead of server-side authentication",
    );
}

const UserFormSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, { message: "Please enter a first name." }),
    lastName: z
        .string()
        .trim()
        .min(1, { message: "Please enter a last name." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    iban: z
        .string()
        .trim()
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, {
            message: "Please enter a valid IBAN.",
        })
        .optional()
        .or(z.literal("")),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters." })
        .optional()
        .or(z.literal("")),
    role: z
        .enum(["admin", "user"], {
            invalid_type_error: "Please select a valid role.",
        })
        .default("user"),
});

const CreateUser = UserFormSchema.extend({
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters." }),
});

const UpdateUser = UserFormSchema.omit({ role: true });

export type UserState = {
    errors: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        iban?: string[];
        password?: string[];
        role?: string[];
        imageFile?: string[];
    };
    message: string | null;
};

export async function createUser(
    prevState: UserState,
    formData: FormData,
): Promise<UserState> {
    try {
        await checkAdminPermission();
    } catch (error) {
        return {
            errors: {},
            message: "Unauthorized: Only privileged users can create users.",
        };
    }

    const validatedFields = CreateUser.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        iban: formData.get("iban"),
        password: formData.get("password"),
        role: formData.get("role"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing or invalid fields. Failed to create user.",
        };
    }

    const imageFile = formData.get("imageFile");
    const { firstName, lastName, email, iban, password } = validatedFields.data;
    const role = "user";

    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Clerk first
    let clerkUserId: string;
    try {
        const clerkResponse = await fetch("https://api.clerk.com/v1/users", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email_address: [email],
                first_name: firstName,
                last_name: lastName,
                password: password,
                public_metadata: {
                    role: role,
                },
            }),
        });

        if (!clerkResponse.ok) {
            const errorData = await clerkResponse.json();
            console.error("Clerk API Error:", errorData);
            return {
                errors: {},
                message: `Failed to create user in Clerk: ${errorData.errors?.[0]?.message || "Unknown error"}`,
            };
        }

        const clerkUser = await clerkResponse.json();
        clerkUserId = clerkUser.id;
    } catch (error) {
        console.error("Clerk API Error:", error);
        return {
            errors: {},
            message: "Failed to create user authentication account.",
        };
    }

    // Get organization_id from current privileged operator
    const { userId: operatorClerkId } = await auth();
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${operatorClerkId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch operator organization:", error);
        return {
            errors: {},
            message: "Failed to fetch operator organization.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message:
                "Privileged operator not found or no organization assigned.",
        };
    }

    // Now create user in database with clerk_user_id
    let userId: string;
    try {
        const normalizedIban = iban ? iban.replace(/\s+/g, "") : null;
        const result = await sql`
            INSERT INTO users (id, name, email, password, role, clerk_user_id, organization_id, iban)
            VALUES (gen_random_uuid(), ${fullName}, ${email}, ${hashedPassword}, ${role}, ${clerkUserId}, ${organizationId}, ${normalizedIban})
            RETURNING id
        `;
        userId = result[0].id;
    } catch (error) {
        console.error(error);
        // Rollback: delete Clerk user if DB insert fails
        try {
            await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                },
            });
        } catch (rollbackError) {
            console.error("Failed to rollback Clerk user:", rollbackError);
        }
        return {
            errors: {},
            message: "Database Error: Failed to create user.",
        };
    }

    if (imageFile instanceof File && imageFile.size > 0) {
        try {
            await saveUserPhoto(imageFile, userId);
        } catch (error) {
            console.error(error);
            return {
                errors: {},
                message: `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    await logAction(operatorClerkId, "user_create", "/dashboard/users", {
        newUserId: userId,
        email,
        role,
    });
    revalidatePath("/dashboard/users");
    redirect("/dashboard/users");
}

export async function updateUser(
    id: string,
    prevState: UserState,
    formData: FormData,
): Promise<UserState> {
    try {
        await checkAdminPermission();
    } catch (error) {
        return {
            errors: {},
            message: "Unauthorized: Only privileged users can update users.",
        };
    }

    // Get current privileged operator's organization_id
    const { userId: operatorClerkId } = await auth();
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${operatorClerkId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch operator organization:", error);
        return {
            errors: {},
            message: "Failed to fetch operator organization.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message:
                "Privileged operator not found or no organization assigned.",
        };
    }

    // Verify that user belongs to operator's organization
    try {
        const userCheck = await sql<
            { id: string; role: string }[]
        >`SELECT id, role FROM users WHERE id = ${id} AND organization_id = ${organizationId}`;
        if (userCheck.length === 0) {
            return {
                errors: {},
                message:
                    "User not found or does not belong to your organization.",
            };
        }

        // Legacy guard: if role is still admin in DB, keep IBAN validation
        const userRole = userCheck[0].role;
        const iban = formData.get("iban");
        if (
            userRole === "admin" &&
            (!iban || (typeof iban === "string" && iban.trim().length === 0))
        ) {
            return {
                errors: { iban: ["IBAN is required for privileged users."] },
                message: "IBAN is required for privileged users.",
            };
        }
    } catch (error) {
        return {
            errors: {},
            message: "Failed to verify user organization.",
        };
    }

    const validatedFields = UpdateUser.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        iban: formData.get("iban"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing or invalid fields. Failed to update user.",
        };
    }

    const { firstName, lastName, email, iban, password } = validatedFields.data;
    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
    const normalizedIban = iban ? iban.replace(/\s+/g, "") : null;

    try {
        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await sql`
                UPDATE users
                SET name = ${fullName}, email = ${email}, iban = ${normalizedIban}, password = ${hashedPassword}
                WHERE id = ${id}
            `;
        } else {
            await sql`
                UPDATE users
                SET name = ${fullName}, email = ${email}, iban = ${normalizedIban}
                WHERE id = ${id}
            `;
        }
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: "Database Error: Failed to update user.",
        };
    }

    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
        try {
            await saveUserPhoto(imageFile, id);
        } catch (error) {
            console.error(error);
            return {
                errors: {},
                message: `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    await logAction(
        operatorClerkId,
        "user_update",
        `/dashboard/users/${id}/edit`,
        { updatedUserId: id },
    );
    revalidatePath("/dashboard/users");
    redirect("/dashboard/users");
}

export async function deleteUser(id: string) {
    try {
        await checkAdminPermission();
    } catch (error) {
        throw new Error(
            "Unauthorized: Only privileged users can delete users.",
        );
    }

    // Get current privileged operator's organization_id
    const { userId: operatorClerkId } = await auth();
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${operatorClerkId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch operator organization:", error);
        throw new Error("Failed to fetch operator organization.");
    }

    if (!organizationId) {
        throw new Error(
            "Privileged operator not found or no organization assigned.",
        );
    }

    // Verify that user belongs to operator's organization
    try {
        const userCheck = await sql<
            { id: string }[]
        >`SELECT id FROM users WHERE id = ${id} AND organization_id = ${organizationId}`;
        if (userCheck.length === 0) {
            throw new Error(
                "User not found or does not belong to your organization.",
            );
        }
    } catch (error) {
        throw new Error("Failed to verify user organization.");
    }

    try {
        await sql`DELETE FROM users WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
        throw new Error("Database Error: Failed to delete user.");
    }

    await logAction(operatorClerkId, "user_delete", "/dashboard/users", {
        deletedUserId: id,
    });
    revalidatePath("/dashboard/users");
}

export async function createOrganizationAndAdmin(formData: FormData) {
    const validatedFields = SignUpSchema.safeParse({
        orgName: formData.get("orgName"),
        adminName: formData.get("adminName"),
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Invalid input",
        };
    }

    const { orgName, adminName, email, password } = validatedFields.data;

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Create organization
        const orgSlug = orgName.toLowerCase().replace(/\s+/g, "-");

        const orgResult = await sql`
            INSERT INTO organizations (name, slug)
            VALUES (${orgName}, ${orgSlug})
            RETURNING id
        `;

        const organizationId = orgResult[0].id;

        // 3. Create admin user
        const userResult = await sql`
            INSERT INTO users (name, email, password, role, organization_id)
            VALUES (${adminName}, ${email}, ${hashedPassword}, 'admin', ${organizationId})
            RETURNING id
        `;

        const userId = userResult[0].id;

        // 4. Update organization with owner_id
        await sql`
            UPDATE organizations
            SET owner_id = ${userId}
            WHERE id = ${organizationId}
        `;

        return {
            success: true,
            message: "Organization created successfully!",
        };
    } catch (error: any) {
        if (error.code === "23505") {
            // Unique violation
            return {
                success: false,
                message: "Email or organization name already exists",
            };
        }

        console.error("SignUp error:", error);
        return {
            success: false,
            message: "Failed to create organization",
        };
    }
}

// ========================================
// Atleta Actions
// ========================================

const ATHLETE_HEIGHT_MIN_CM = 100;
const ATHLETE_HEIGHT_MAX_CM = 300;
const ATHLETE_WEIGHT_MIN_KG = 10;
const ATHLETE_WEIGHT_MAX_KG = 300;
const ATHLETE_WEIGHT_DECIMALS_REGEX = /^\d+(\.\d{1,2})?$/;

const AtletaFormSchema = z.object({
    nome: z.string().trim().min(1, { message: "Nome Ã© obrigatÃ³rio." }),
    sobrenome: z
        .string()
        .trim()
        .min(1, { message: "Sobrenome Ã© obrigatÃ³rio." }),
    data_nascimento: z
        .string()
        .min(1, { message: "Data de nascimento Ã© obrigatÃ³ria." }),
    morada: z.string().trim().min(1, { message: "Morada Ã© obrigatÃ³ria." }),
    telemovel: z
        .string()
        .trim()
        .min(1, { message: "TelemÃ³vel Ã© obrigatÃ³rio." })
        .regex(/^[\d\s\+\-\(\)]{9,20}$/, { message: "TelemÃ³vel invÃ¡lido." }),
    email: z.string().email({ message: "Email invÃ¡lido." }),
    peso_kg: z
        .string()
        .trim()
        .regex(ATHLETE_WEIGHT_DECIMALS_REGEX, {
            message: "Peso deve ter no mÃ¡ximo 2 casas decimais.",
        })
        .transform((value) => Number(value))
        .refine(
            (value) =>
                !Number.isNaN(value) &&
                value >= ATHLETE_WEIGHT_MIN_KG &&
                value <= ATHLETE_WEIGHT_MAX_KG,
            {
                message: `Peso deve estar entre ${ATHLETE_WEIGHT_MIN_KG} e ${ATHLETE_WEIGHT_MAX_KG} kg.`,
            },
        ),
    altura_cm: z.coerce
        .number({ invalid_type_error: "Altura invÃ¡lida." })
        .min(ATHLETE_HEIGHT_MIN_CM, {
            message: `Altura deve estar entre ${ATHLETE_HEIGHT_MIN_CM} e ${ATHLETE_HEIGHT_MAX_CM} cm.`,
        })
        .max(ATHLETE_HEIGHT_MAX_CM, {
            message: `Altura deve estar entre ${ATHLETE_HEIGHT_MIN_CM} e ${ATHLETE_HEIGHT_MAX_CM} cm.`,
        }),
    nif: z
        .string()
        .trim()
        .regex(/^\d{9}$/, {
            message: "NIF deve ter exatamente 9 dÃ­gitos numÃ©ricos.",
        }),
});

export async function createAtletaProfile(
    prevState: AtletaState,
    formData: FormData,
): Promise<AtletaState> {
    const { userId } = await auth();
    if (!userId) {
        return { errors: {}, message: "NÃ£o autenticado." };
    }

    const validatedFields = AtletaFormSchema.safeParse({
        nome: formData.get("nome"),
        sobrenome: formData.get("sobrenome"),
        data_nascimento: formData.get("data_nascimento"),
        morada: formData.get("morada"),
        telemovel: formData.get("telemovel"),
        email: formData.get("email"),
        peso_kg: formData.get("peso_kg"),
        altura_cm: formData.get("altura_cm"),
        nif: formData.get("nif"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Erro de validaÃ§Ã£o. Verifique os campos.",
        };
    }

    const {
        nome,
        sobrenome,
        data_nascimento,
        morada,
        telemovel,
        email,
        peso_kg,
        altura_cm,
        nif,
    } = validatedFields.data;

    // Handle photo upload
    const fotoFile = formData.get("foto_perfil") as File | null;
    if (!fotoFile || fotoFile.size === 0) {
        return {
            errors: { foto_perfil: ["Foto de perfil Ã© obrigatÃ³ria."] },
            message: "Foto de perfil Ã© obrigatÃ³ria.",
        };
    }
    if (fotoFile.size > MAX_PHOTO_SIZE) {
        return {
            errors: { foto_perfil: ["Foto deve ter menos de 5MB."] },
            message: "Foto muito grande.",
        };
    }

    let foto_perfil_url: string;
    try {
        foto_perfil_url = await uploadAtletaPhotoToR2(
            fotoFile,
            nif,
            nome,
            sobrenome,
        );
    } catch (error) {
        console.error("R2 upload error:", error);
        return {
            errors: {},
            message: "Erro ao fazer upload da foto. Tente novamente.",
        };
    }

    try {
        const usersColumns = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
        `;

        const hasUsersColumn = (column: string) =>
            usersColumns.some((item) => item.column_name === column);

        const fullName = `${nome} ${sobrenome}`.trim();

        if (hasUsersColumn("name")) {
            await sql`
                UPDATE users
                SET name = ${fullName}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("email")) {
            await sql`
                UPDATE users
                SET email = ${email}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("data_nascimento")) {
            await sql`
                UPDATE users
                SET data_nascimento = ${data_nascimento}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("morada")) {
            await sql`
                UPDATE users
                SET morada = ${morada}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("telefone")) {
            await sql`
                UPDATE users
                SET telefone = ${telemovel}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("peso_kg")) {
            await sql`
                UPDATE users
                SET peso_kg = ${peso_kg}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("altura_cm")) {
            await sql`
                UPDATE users
                SET altura_cm = ${altura_cm}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("nif")) {
            await sql`
                UPDATE users
                SET nif = ${nif}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("status")) {
            await sql`
                UPDATE users
                SET status = 'pendente', updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("image_url")) {
            await sql`
                UPDATE users
                SET image_url = ${foto_perfil_url}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }
    } catch (error: any) {
        if (error.code === "23505") {
            return {
                errors: {},
                message: "JÃ¡ existe um perfil com este email ou NIF.",
            };
        }
        console.error("DB insert atleta error:", error);
        return {
            errors: {},
            message: "Erro ao guardar perfil. Tente novamente.",
        };
    }

    await logAction(
        userId,
        "atleta_profile_create",
        "/dashboard/utilizador/perfil",
        { nome, email, nif },
    );
    revalidatePath("/dashboard/utilizador/perfil");
    redirect("/dashboard/utilizador/perfil");
}

export async function updateAtletaProfile(
    prevState: AtletaState,
    formData: FormData,
): Promise<AtletaState> {
    const { userId } = await auth();
    if (!userId) {
        return { errors: {}, message: "NÃ£o autenticado." };
    }

    const validatedFields = AtletaFormSchema.safeParse({
        nome: formData.get("nome"),
        sobrenome: formData.get("sobrenome"),
        data_nascimento: formData.get("data_nascimento"),
        morada: formData.get("morada"),
        telemovel: formData.get("telemovel"),
        email: formData.get("email"),
        peso_kg: formData.get("peso_kg"),
        altura_cm: formData.get("altura_cm"),
        nif: formData.get("nif"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Erro de validaÃ§Ã£o. Verifique os campos.",
        };
    }

    const {
        nome,
        sobrenome,
        data_nascimento,
        morada,
        telemovel,
        email,
        peso_kg,
        altura_cm,
        nif,
    } = validatedFields.data;

    let foto_perfil_url: string | null = null;

    const existingUser = await sql<{ image_url: string | null }[]>`
        SELECT image_url
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;

    if (!existingUser.length) {
        return { errors: {}, message: "Perfil nÃ£o encontrado." };
    }

    foto_perfil_url = existingUser[0].image_url;

    const fotoFile = formData.get("foto_perfil") as File | null;
    if (fotoFile && fotoFile.size > 0) {
        if (fotoFile.size > MAX_PHOTO_SIZE) {
            return {
                errors: { foto_perfil: ["Foto deve ter menos de 5MB."] },
                message: "Foto muito grande.",
            };
        }
        try {
            foto_perfil_url = await uploadAtletaPhotoToR2(
                fotoFile,
                nif,
                nome,
                sobrenome,
            );
        } catch (error) {
            console.error("R2 upload error:", error);
            return {
                errors: {},
                message: "Erro ao fazer upload da foto. Tente novamente.",
            };
        }
    }

    try {
        const usersColumns = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
        `;

        const hasUsersColumn = (column: string) =>
            usersColumns.some((item) => item.column_name === column);
        const fullName = `${nome} ${sobrenome}`.trim();

        if (hasUsersColumn("name")) {
            await sql`
                UPDATE users
                SET name = ${fullName}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("email")) {
            await sql`
                UPDATE users
                SET email = ${email}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("data_nascimento")) {
            await sql`
                UPDATE users
                SET data_nascimento = ${data_nascimento}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("morada")) {
            await sql`
                UPDATE users
                SET morada = ${morada}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("telefone")) {
            await sql`
                UPDATE users
                SET telefone = ${telemovel}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("peso_kg")) {
            await sql`
                UPDATE users
                SET peso_kg = ${peso_kg}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("altura_cm")) {
            await sql`
                UPDATE users
                SET altura_cm = ${altura_cm}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("nif")) {
            await sql`
                UPDATE users
                SET nif = ${nif}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("image_url")) {
            await sql`
                UPDATE users
                SET image_url = ${foto_perfil_url}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }
    } catch (error: any) {
        if (error.code === "23505") {
            return {
                errors: {},
                message: "JÃ¡ existe um perfil com este email ou NIF.",
            };
        }
        console.error("DB update atleta error:", error);
        return {
            errors: {},
            message: "Erro ao guardar perfil. Tente novamente.",
        };
    }

    await logAction(
        userId,
        "atleta_profile_update",
        "/dashboard/utilizador/perfil",
        { email, nif },
    );
    revalidatePath("/dashboard/utilizador/perfil");
    redirect("/dashboard/utilizador/perfil");
}

type ComunicadoState = { error?: string; success?: boolean } | null;

export async function criarComunicado(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const titulo = formData.get("titulo") as string;
    const conteudo = formData.get("conteudo") as string;
    const destinatarios = formData.get("destinatarios") as string;

    if (!titulo?.trim() || !conteudo?.trim() || !destinatarios?.trim()) {
        return { error: "Preenche todos os campos obrigatÃ³rios." };
    }

    try {
        const { userId: clerkId } = await auth();

        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO comunicados (titulo, conteudo, destinatarios, criado_por, organization_id, created_at)
            VALUES (${titulo.trim()}, ${conteudo.trim()}, ${destinatarios.trim()}, ${dbUserId}, ${organizationId}, NOW())
        `;

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo comunicado publicado',
                ${`"${titulo.trim()}" foi enviado para: ${destinatarios.trim()}.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "comunicado_create",
            "/dashboard/presidente/comunicados",
            { titulo: titulo.trim(), destinatarios: destinatarios.trim() },
        );
        revalidatePath("/dashboard/presidente/comunicados");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao enviar comunicado. Tenta novamente." };
    }
}

// ---------- AUTORIZAÃ‡Ã•ES ----------

export async function registarAutorizacao(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const autorizadoA = formData.get("autorizado_a") as string;
    const tipoAcao = formData.get("tipo_acao") as string;
    const notas = formData.get("notas") as string | null;

    if (!autorizadoA?.trim() || !tipoAcao?.trim()) {
        return { error: "Preenche todos os campos obrigatÃ³rios." };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÃ‡ÃƒO: buscar UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO autorizacoes_log (autorizado_a, autorizado_por, tipo_acao, notas, organization_id, created_at)
            VALUES (${autorizadoA.trim()}, ${dbUserId}, ${tipoAcao.trim()}, ${notas?.trim() ?? null}, ${organizationId}, NOW())
        `;

        await logAction(
            clerkId,
            "autorizacao_create",
            "/dashboard/presidente/autorizacoes",
            { autorizado_a: autorizadoA.trim(), tipo_acao: tipoAcao.trim() },
        );
        revalidatePath("/dashboard/presidente/autorizacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao registar autorizaÃ§Ã£o." };
    }
}

// ---------- DOCUMENTOS ----------

export async function uploadDocumento(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const file = formData.get("ficheiro") as File | null;
    const nome = formData.get("nome") as string;

    if (!file || file.size === 0) return { error: "Seleciona um ficheiro." };
    if (!nome?.trim()) return { error: "Indica um nome para o documento." };

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE)
        return { error: "Ficheiro demasiado grande. MÃ¡ximo 10MB." };

    const extensao = file.name.split(".").pop()?.toUpperCase() ?? "PDF";
    const tiposPermitidos = ["PDF", "XLSX", "DOCX"];
    if (!tiposPermitidos.includes(extensao)) {
        return {
            error: "Tipo de ficheiro nÃ£o permitido. Usa PDF, XLSX ou DOCX.",
        };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÃ‡ÃƒO: buscar o UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        const url = await uploadImageToR2(file, "user", crypto.randomUUID());

        await sql`
            INSERT INTO documentos (nome, tipo, url_r2, uploaded_by, organization_id, created_at)
            VALUES (${nome.trim()}, ${extensao}, ${url}, ${dbUserId}, ${organizationId}, NOW())
        `;

        revalidatePath("/dashboard/presidente/documentos");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao carregar documento. Tenta novamente." };
    }
}

export async function criarEquipa(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;

    try {
        organizationId = await getOrganizationId();
    } catch (error) {
        console.error(
            "Failed to resolve organization for creating team:",
            error,
        );
        return {
            error: "NÃ£o foi possÃ­vel identificar a organizaÃ§Ã£o. Tenta novamente.",
        };
    }

    const nome = formData.get("nome") as string;
    const { userId: clerkId } = await auth();
    const escalao = formData.get("escalao") as string;
    const desporto = formData.get("desporto") as string;
    const estado = formData.get("estado") as string;

    if (
        !nome?.trim() ||
        !escalao?.trim() ||
        !desporto?.trim() ||
        !estado?.trim()
    ) {
        return { error: "Preenche todos os campos obrigatÃ³rios." };
    }

    try {
        const epocas = await sql<{ id: string }[]>`
            SELECT id FROM epocas
            WHERE organization_id = ${organizationId} AND ativa = true
            LIMIT 1
        `;
        const epocaId = epocas[0]?.id ?? null;

        await sql`
            INSERT INTO equipas (nome, escalao, desporto, estado, epoca_id, organization_id, created_at, updated_at)
            VALUES (
                ${nome.trim()}, ${escalao.trim()}, ${desporto.trim()},
                ${estado}, ${epocaId}, ${organizationId}, NOW(), NOW()
            )
        `;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova equipa criada',
                ${`Equipa ${nome.trim()} (${escalao.trim()}) foi criada com sucesso.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "equipa_create",
            "/dashboard/presidente/equipas",
            {
                nome: nome.trim(),
                escalao: escalao.trim(),
                desporto: desporto.trim(),
                estado,
            },
        );
        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao criar equipa. Tenta novamente." };
    }
}

// ========================================
// Atleta Actions (Modal)
// ========================================

export async function adicionarAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }

    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const nome = formData.get("nome")?.toString().trim();
    const posicao = formData.get("posicao")?.toString().trim() || null;
    const numCamisola =
        formData.get("numero_camisola")?.toString().trim() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const estado = formData.get("estado")?.toString() || "ativo";
    const federado = formData.get("federado") === "on";
    const numFederado =
        formData.get("numero_federado")?.toString().trim() || null;
    const maoDominante = formData.get("mao_dominante")?.toString() || null;

    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };

    try {
        await sql`
            INSERT INTO atletas (
                id, nome, posicao, numero_camisola,
                equipa_id, estado, federado, numero_federado,
                mao_dominante, organization_id
            ) VALUES (
                gen_random_uuid(), ${nome}, ${posicao},
                ${numCamisola ? parseInt(numCamisola) : null},
                ${equipaId}, ${estado}, ${federado}, ${numFederado},
                ${maoDominante}, ${organizationId}
            )
        `;

        // Buscar nome da equipa para a notificaÃ§Ã£o
        let equipaNome = "sem equipa";
        if (equipaId) {
            const equipaResult = await sql<{ nome: string }[]>`
                SELECT nome FROM equipas WHERE id = ${equipaId}
            `;
            equipaNome = equipaResult[0]?.nome ?? "sem equipa";
        }

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo atleta registado',
                ${`${nome} foi adicionado${equipaId ? ` Ã  equipa ${equipaNome}` : " sem equipa atribuÃ­da"}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao adicionar atleta." };
    }

    await logAction(userId, "atleta_add", "/dashboard/presidente/atletas", {
        nome,
        equipaId,
    });
    revalidatePath("/dashboard/presidente/atletas");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// Staff Actions (Modal)
// ========================================

export async function adicionarMembro(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }

    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const nome = formData.get("nome")?.toString().trim();
    const funcao = formData.get("funcao")?.toString() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;

    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!funcao) return { error: "FunÃ§Ã£o Ã© obrigatÃ³ria." };

    try {
        await sql`
            INSERT INTO staff (id, nome, funcao, equipa_id, organization_id)
            VALUES (gen_random_uuid(), ${nome}, ${funcao}, ${equipaId}, ${organizationId})
        `;

        // Buscar nome da equipa para a notificaÃ§Ã£o
        let equipaNome = "sem equipa";
        if (equipaId) {
            const equipaResult = await sql<{ nome: string }[]>`
                SELECT nome FROM equipas WHERE id = ${equipaId}
            `;
            equipaNome = equipaResult[0]?.nome ?? "sem equipa";
        }

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo membro de staff adicionado',
                ${`${nome} foi adicionado como ${funcao}${equipaId ? ` na equipa ${equipaNome}` : ""}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao adicionar membro de staff." };
    }

    await logAction(userId, "staff_add", "/dashboard/presidente/staff", {
        nome,
        funcao,
        equipaId,
    });
    revalidatePath("/dashboard/presidente/staff");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// Jogos Actions (Modal)
// ========================================

export async function agendarJogo(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }

    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const adversario = formData.get("adversario")?.toString().trim();
    const data = formData.get("data")?.toString();
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const casaFora = formData.get("casa_fora")?.toString() || "casa";
    const local = formData.get("local")?.toString().trim() || null;
    const estado = formData.get("estado")?.toString() || "agendado";
    const visibilidadePublica = formData.get("visibilidade_publica") === "on";

    if (!adversario) return { error: "AdversÃ¡rio Ã© obrigatÃ³rio." };
    if (!data) return { error: "Data Ã© obrigatÃ³ria." };

    try {
        await sql`
            INSERT INTO jogos (
                id, adversario, data, equipa_id, casa_fora,
                local, estado, visibilidade_publica, organization_id
            ) VALUES (
                gen_random_uuid(), ${adversario}, ${data}, ${equipaId},
                ${casaFora}, ${local}, ${estado}, ${visibilidadePublica}, ${organizationId}
            )
        `;

        // Buscar nome da equipa para a notificaÃ§Ã£o
        let equipaNome = "";
        if (equipaId) {
            const equipaResult = await sql<{ nome: string }[]>`
                SELECT nome FROM equipas WHERE id = ${equipaId}
            `;
            equipaNome = equipaResult[0]?.nome ?? "";
        }

        const dataFormatada = new Date(data).toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Jogo agendado',
                ${`Jogo vs ${adversario}${equipaNome ? ` (${equipaNome})` : ""} agendado para ${dataFormatada}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao agendar jogo." };
    }

    await logAction(userId, "jogo_create", "/dashboard/presidente/jogos", {
        adversario,
        data,
        equipaId,
    });
    revalidatePath("/dashboard/presidente/jogos");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// Ã‰poca Actions (Modal)
// ========================================

export async function criarEpoca(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkId } = await auth();
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "NÃ£o foi possÃ­vel identificar a organizaÃ§Ã£o." };
    }

    const nome = formData.get("nome")?.toString().trim();
    const dataInicio = formData.get("data_inicio")?.toString();
    const dataFim = formData.get("data_fim")?.toString();
    const ativa = formData.get("ativa") === "on";

    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!dataInicio) return { error: "Data de inÃ­cio Ã© obrigatÃ³ria." };
    if (!dataFim) return { error: "Data de fim Ã© obrigatÃ³ria." };
    if (dataFim <= dataInicio)
        return {
            error: "A data de fim deve ser posterior Ã  data de inÃ­cio.",
        };

    try {
        if (ativa) {
            await sql`
                UPDATE epocas SET ativa = false
                WHERE organization_id = ${organizationId}
            `;
        }

        await sql`
            INSERT INTO epocas (id, nome, data_inicio, data_fim, ativa, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${nome}, ${dataInicio}, ${dataFim}, ${ativa}, ${organizationId}, NOW(), NOW())
        `;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova Ã©poca criada',
                ${`Ã‰poca ${nome} criada${ativa ? " e definida como ativa" : ""}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao criar Ã©poca." };
    }

    await logAction(clerkId, "epoca_create", "/dashboard/presidente/epoca", {
        nome,
        ativa,
    });
    revalidatePath("/dashboard/presidente/epoca");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// OrganizaÃ§Ã£o Actions
// ========================================

export async function atualizarOrganizacao(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };
    }

    const name = formData.get("name")?.toString().trim();
    const desporto = formData.get("desporto")?.toString().trim() || null;
    const cidade = formData.get("cidade")?.toString().trim() || null;
    const pais = formData.get("pais")?.toString().trim() || null;
    const website = formData.get("website")?.toString().trim() || null;
    const nif = formData.get("nif")?.toString().trim() || null;
    const telefone = formData.get("telefone")?.toString().trim() || null;
    const morada = formData.get("morada")?.toString().trim() || null;
    const codigoPostal =
        formData.get("codigo_postal")?.toString().trim() || null;

    if (!name) return { error: "Nome do clube Ã© obrigatÃ³rio." };

    if (nif && !/^\d{9}$/.test(nif)) {
        return { error: "NIF deve ter exatamente 9 dÃ­gitos numÃ©ricos." };
    }

    try {
        await sql`
            UPDATE organizations
            SET
                name          = ${name},
                desporto      = ${desporto},
                cidade        = ${cidade},
                pais          = ${pais},
                website       = ${website},
                nif           = ${nif},
                telefone      = ${telefone},
                morada        = ${morada},
                codigo_postal = ${codigoPostal},
                updated_at    = NOW()
            WHERE id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar definiÃ§Ãµes." };
    }

    revalidatePath("/dashboard/presidente/definicoes");
    return { success: true };
}

// ========================================
// Mensalidades Actions (Modal)
// ========================================

export async function registarPagamento(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "NÃ£o foi possÃ­vel identificar a organizaÃ§Ã£o." };
    }

    const atletaId = formData.get("atleta_id")?.toString();
    const mes = formData.get("mes")?.toString();
    const ano = formData.get("ano")?.toString();
    const valor = formData.get("valor")?.toString();
    const estado = formData.get("estado")?.toString() || "pago";
    const dataPagamento = formData.get("data_pagamento")?.toString() || null;

    if (!atletaId) return { error: "Atleta nÃ£o identificado." };
    if (!mes) return { error: "MÃªs Ã© obrigatÃ³rio." };
    if (!ano) return { error: "Ano Ã© obrigatÃ³rio." };
    if (!valor) return { error: "Valor Ã© obrigatÃ³rio." };

    try {
        const { userId: clerkId } = await auth();
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        // Buscar nome do atleta para a notificaÃ§Ã£o
        const atletaResult = await sql<{ nome: string }[]>`
            SELECT nome FROM atletas WHERE id = ${atletaId}
        `;
        const atletaNome = atletaResult[0]?.nome ?? "Atleta desconhecido";

        // Upsert mensalidade
        const mensalidadeResult = await sql<{ id: string }[]>`
            INSERT INTO mensalidades (id, atleta_id, mes, ano, valor, estado, data_pagamento, updated_by, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${atletaId}, ${mes}, ${ano}, ${valor}, ${estado}, ${dataPagamento}, ${dbUserId}, ${organizationId}, NOW(), NOW())
            ON CONFLICT (atleta_id, mes, ano)
            DO UPDATE SET
                valor = EXCLUDED.valor,
                estado = EXCLUDED.estado,
                data_pagamento = EXCLUDED.data_pagamento,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING id
        `;

        const mensalidadeId = mensalidadeResult[0]?.id;

        // Criar recibo automaticamente quando mensalidade marcada como paga
        if (estado === "pago" && mensalidadeId && dbUserId) {
            try {
                const { createReciboForPaidMensalidade } =
                    await import("./receipt-service");
                await createReciboForPaidMensalidade(
                    mensalidadeId,
                    atletaId,
                    organizationId,
                    parseFloat(valor),
                    mes,
                    ano,
                    dataPagamento,
                    dbUserId,
                );
            } catch (reciboError) {
                console.error(
                    "Erro ao criar recibo automaticamente:",
                    reciboError,
                );
                // Nao falhar o pagamento por causa do recibo
            }
        }

        // NotificaÃ§Ã£o automÃ¡tica se em atraso
        if (estado === "em_atraso") {
            const mesesNomes: Record<string, string> = {
                "1": "Janeiro",
                "2": "Fevereiro",
                "3": "MarÃ§o",
                "4": "Abril",
                "5": "Maio",
                "6": "Junho",
                "7": "Julho",
                "8": "Agosto",
                "9": "Setembro",
                "10": "Outubro",
                "11": "Novembro",
                "12": "Dezembro",
            };
            await sql`
                INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${organizationId},
                    'Mensalidade em atraso',
                    ${`${atletaNome} tem mensalidade de ${mesesNomes[mes] ?? mes} ${ano} em atraso.`},
                    'Alerta',
                    NOW()
                )
            `;
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar pagamento." };
    }

    revalidatePath(`/dashboard/presidente/atletas/${atletaId}`);
    revalidatePath("/dashboard/presidente/mensalidades");
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// Suspender Atleta
// ========================================

export async function suspenderAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "NÃ£o foi possÃ­vel identificar a organizaÃ§Ã£o." };
    }

    const atletaId = formData.get("atleta_id")?.toString();
    if (!atletaId) return { error: "Atleta nÃ£o identificado." };

    try {
        // Buscar nome do atleta para a notificaÃ§Ã£o
        const atletaResult = await sql<{ nome: string }[]>`
            SELECT nome FROM atletas WHERE id = ${atletaId}
        `;
        const atletaNome = atletaResult[0]?.nome ?? "Atleta desconhecido";

        await sql`
            UPDATE atletas SET estado = 'suspenso', updated_at = NOW()
            WHERE id = ${atletaId} AND organization_id = ${organizationId}
        `;

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Atleta suspenso',
                ${`${atletaNome} foi suspenso por mensalidade em atraso.`},
                'Aviso',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao suspender atleta." };
    }

    revalidatePath("/dashboard/presidente/mensalidades");
    revalidatePath(`/dashboard/presidente/atletas/${atletaId}`);
    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

// ========================================
// NotificaÃ§Ãµes Actions
// ========================================

export async function marcarTodasComoLidas(
    prevState: { error?: string; success?: boolean } | null,
    _formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "NÃ£o foi possÃ­vel identificar a organizaÃ§Ã£o." };
    }

    try {
        await sql`
            UPDATE notificacoes SET lida = true
            WHERE organization_id = ${organizationId} AND lida = false
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao marcar notificaÃ§Ãµes." };
    }

    revalidatePath("/dashboard/presidente/notificacoes");
    return { success: true };
}

export async function atualizarMeuPerfil(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "NÃ£o autenticado." };

    const firstName = formData.get("firstName")?.toString().trim();
    const lastName = formData.get("lastName")?.toString().trim();
    const iban = formData.get("iban")?.toString().trim() || null;

    if (!firstName) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!lastName) return { error: "Apelido Ã© obrigatÃ³rio." };

    const normalizedIban = iban ? iban.replace(/\s/g, "") : null;
    if (normalizedIban && !/^[A-Z]{2}[A-Z0-9]{11,30}$/.test(normalizedIban)) {
        return { error: "IBAN invÃ¡lido." };
    }

    try {
        // Atualiza nome no Clerk
        const clerkRes = await fetch(
            `https://api.clerk.com/v1/users/${clerkUserId}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                }),
            },
        );
        if (!clerkRes.ok) return { error: "Erro ao atualizar nome." };

        // Atualiza DB
        await sql`
            UPDATE users
            SET name = ${`${firstName} ${lastName}`.trim()}, iban = ${normalizedIban}
            WHERE clerk_user_id = ${clerkUserId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar perfil." };
    }

    revalidatePath("/dashboard/presidente/perfil");
    return { success: true };
}

export async function editarAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }
    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const id = formData.get("id")?.toString();
    const nome = formData.get("nome")?.toString().trim();
    const posicao = formData.get("posicao")?.toString().trim() || null;
    const numCamisola =
        formData.get("numero_camisola")?.toString().trim() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;
    const estado = formData.get("estado")?.toString() || "ativo";
    const federado = formData.get("federado") === "on";
    const numFederado =
        formData.get("numero_federado")?.toString().trim() || null;
    const maoDominante = formData.get("mao_dominante")?.toString() || null;

    if (!id) return { error: "ID do atleta em falta." };
    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };

    try {
        await sql`
            UPDATE atletas SET
                nome             = ${nome},
                posicao          = ${posicao},
                numero_camisola  = ${numCamisola ? parseInt(numCamisola) : null},
                equipa_id        = ${equipaId},
                estado           = ${estado},
                federado         = ${federado},
                numero_federado  = ${numFederado},
                mao_dominante    = ${maoDominante}
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao editar atleta." };
    }

    revalidatePath("/dashboard/presidente/atletas");
    return { success: true };
}

// ========================
// RELATÃ“RIOS CSV
// ========================

export async function gerarRelatorioAtletas() {
    const { userId } = await auth();
    if (!userId) throw new Error("NÃ£o autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organizaÃ§Ã£o.");
    }
    if (!organizationId) throw new Error("OrganizaÃ§Ã£o nÃ£o encontrada.");

    const atletas = await sql<
        {
            nome: string;
            posicao: string | null;
            numero_camisola: number | null;
            equipa_nome: string | null;
            estado: string;
            federado: boolean;
            numero_federado: string | null;
            mensalidade_estado: string | null;
        }[]
    >`
        SELECT
            atletas.nome,
            atletas.posicao,
            atletas.numero_camisola,
            equipas.nome AS equipa_nome,
            atletas.estado,
            atletas.federado,
            atletas.numero_federado,
            mensalidades.estado AS mensalidade_estado
        FROM atletas
        LEFT JOIN equipas ON atletas.equipa_id = equipas.id
        LEFT JOIN mensalidades ON mensalidades.atleta_id = atletas.id
            AND mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
            AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
        WHERE atletas.organization_id = ${organizationId}
        ORDER BY atletas.nome ASC
    `;

    // Gerar CSV
    const headers = [
        "Nome",
        "PosiÃ§Ã£o",
        "NÂº",
        "Equipa",
        "Estado",
        "Federado",
        "NÂº Federado",
        "Mensalidade",
    ];
    const rows = atletas.map((a) => [
        a.nome,
        a.posicao ?? "â€”",
        a.numero_camisola != null ? `#${a.numero_camisola}` : "â€”",
        a.equipa_nome ?? "â€”",
        a.estado,
        a.federado ? "Sim" : "NÃ£o",
        a.numero_federado ?? "â€”",
        a.mensalidade_estado ?? "â€”",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}

export async function gerarRelatorioMensalidades() {
    const { userId } = await auth();
    if (!userId) throw new Error("NÃ£o autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organizaÃ§Ã£o.");
    }
    if (!organizationId) throw new Error("OrganizaÃ§Ã£o nÃ£o encontrada.");

    const mensalidades = await sql<
        {
            atleta_nome: string;
            equipa_nome: string | null;
            mes: number;
            ano: number;
            valor: number | null;
            estado: string;
            data_pago: string | null;
        }[]
    >`
    SELECT
        atletas.nome AS atleta_nome,
        equipas.nome AS equipa_nome,
        mensalidades.mes,
        mensalidades.ano,
        mensalidades.valor,
        mensalidades.estado,
        mensalidades.data_pagamento AS data_pago
    FROM mensalidades
    INNER JOIN atletas ON mensalidades.atleta_id = atletas.id
    LEFT JOIN equipas ON atletas.equipa_id = equipas.id
    WHERE mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
      AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
      AND mensalidades.organization_id = ${organizationId}
    ORDER BY mensalidades.estado DESC, atletas.nome ASC
`;

    const mesesNomes: Record<number, string> = {
        1: "Jan",
        2: "Fev",
        3: "Mar",
        4: "Abr",
        5: "Mai",
        6: "Jun",
        7: "Jul",
        8: "Ago",
        9: "Set",
        10: "Out",
        11: "Nov",
        12: "Dez",
    };

    const headers = [
        "Atleta",
        "Equipa",
        "MÃªs",
        "Ano",
        "Valor",
        "Estado",
        "Data Pagamento",
    ];
    const rows = mensalidades.map((m) => [
        m.atleta_nome,
        m.equipa_nome ?? "â€”",
        mesesNomes[m.mes] ?? m.mes,
        m.ano,
        m.valor != null ? `â‚¬${Number(m.valor).toFixed(2)}` : "â€”",
        m.estado,
        m.data_pago ? new Date(m.data_pago).toLocaleDateString("pt-PT") : "â€”",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}

export async function gerarRelatorioAssiduidade() {
    const { userId } = await auth();
    if (!userId) throw new Error("NÃ£o autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organizaÃ§Ã£o.");
    }
    if (!organizationId) throw new Error("OrganizaÃ§Ã£o nÃ£o encontrada.");

    const assiduidade = await sql<
        {
            atleta_nome: string;
            equipa_nome: string | null;
            total_treinos: number;
            presencas: number;
        }[]
    >`
        SELECT
            atletas.nome AS atleta_nome,
            equipas.nome AS equipa_nome,
            COUNT(assiduidade.id) AS total_treinos,
            COUNT(CASE WHEN assiduidade.presente THEN 1 END) AS presencas
        FROM atletas
        LEFT JOIN equipas ON atletas.equipa_id = equipas.id
        LEFT JOIN assiduidade ON assiduidade.atleta_id = atletas.id
        WHERE atletas.organization_id = ${organizationId}
        GROUP BY atletas.id, atletas.nome, equipas.nome
        ORDER BY atletas.nome ASC
    `;

    const headers = [
        "Atleta",
        "Equipa",
        "Total Treinos",
        "PresenÃ§as",
        "Taxa Assiduidade",
    ];
    const rows = assiduidade.map((a) => {
        const total = Number(a.total_treinos);
        const presencas = Number(a.presencas);
        const taxa = total > 0 ? Math.round((presencas / total) * 100) : 0;
        return [
            a.atleta_nome,
            a.equipa_nome ?? "â€”",
            total,
            presencas,
            `${taxa}%`,
        ];
    });

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}

export async function gerarRelatorioStaff() {
    const { userId } = await auth();
    if (!userId) throw new Error("NÃ£o autenticado.");

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error("Erro ao obter organizaÃ§Ã£o.");
    }
    if (!organizationId) throw new Error("OrganizaÃ§Ã£o nÃ£o encontrada.");

    const staff = await sql<
        {
            nome: string;
            funcao: string;
            equipa_nome: string | null;
            email: string | null;
            telefone: string | null;
        }[]
    >`
        SELECT
            staff.nome,
            staff.funcao,
            equipas.nome AS equipa_nome,
            users.email,
            users.telefone
        FROM staff
        LEFT JOIN equipas ON staff.equipa_id = equipas.id
        LEFT JOIN users ON staff.user_id = users.id
        WHERE staff.organization_id = ${organizationId}
        ORDER BY staff.funcao, staff.nome ASC
    `;

    const headers = ["Nome", "FunÃ§Ã£o", "Equipa", "Email", "Telefone"];
    const rows = staff.map((s) => [
        s.nome,
        s.funcao,
        s.equipa_nome ?? "â€”",
        s.email ?? "â€”",
        s.telefone ?? "â€”",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    return csv;
}

export async function registarResultado(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }
    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const id = formData.get("id")?.toString();
    const resultadoNos = formData.get("resultado_nos")?.toString();
    const resultadoAdv = formData.get("resultado_adv")?.toString();

    if (!id) return { error: "ID do jogo em falta." };
    if (resultadoNos === "")
        return { error: "Resultado da equipa Ã© obrigatÃ³rio." };
    if (resultadoAdv === "")
        return { error: "Resultado do adversÃ¡rio Ã© obrigatÃ³rio." };

    const nos = parseInt(resultadoNos ?? "");
    const adv = parseInt(resultadoAdv ?? "");

    if (isNaN(nos) || isNaN(adv))
        return { error: "Resultados tÃªm de ser nÃºmeros." };
    if (nos < 0 || adv < 0)
        return { error: "Resultados nÃ£o podem ser negativos." };

    try {
        await sql`
            UPDATE jogos SET
                resultado_nos = ${nos},
                resultado_adv = ${adv},
                estado        = 'realizado',
                updated_at    = NOW()
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao registar resultado." };
    }

    revalidatePath("/dashboard/presidente/jogos");
    revalidatePath("/dashboard/presidente");
    return { success: true };
}

export async function editarMembro(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }
    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const id = formData.get("id")?.toString();
    const nome = formData.get("nome")?.toString().trim();
    const funcao = formData.get("funcao")?.toString() || null;
    const equipaId = formData.get("equipa_id")?.toString() || null;

    if (!id) return { error: "ID do membro em falta." };
    if (!nome) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!funcao) return { error: "FunÃ§Ã£o Ã© obrigatÃ³ria." };

    try {
        await sql`
            UPDATE staff SET
                nome      = ${nome},
                funcao    = ${funcao},
                equipa_id = ${equipaId}
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao editar membro." };
    }

    revalidatePath("/dashboard/presidente/staff");
    return { success: true };
}

export async function removerMembro(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "NÃ£o autenticado." };

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: "Erro ao obter organizaÃ§Ã£o." };
    }
    if (!organizationId) return { error: "OrganizaÃ§Ã£o nÃ£o encontrada." };

    const id = formData.get("id")?.toString();
    if (!id) return { error: "ID do membro em falta." };

    try {
        await sql`
            DELETE FROM staff
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao remover membro." };
    }

    revalidatePath("/dashboard/presidente/staff");
    return { success: true };
}
