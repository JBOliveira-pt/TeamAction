import { auth, clerkClient } from "@clerk/nextjs/server";
import postgres from "postgres";
import { uploadImageToR2 } from "@/app/lib/r2-storage";
import { hash } from "bcryptjs";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_SIGNUP_AGE = 5;
const MAX_SIGNUP_AGE = 120;

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

function calculateAge(birthDateIso: string): number | null {
    const birthDate = new Date(`${birthDateIso}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age -= 1;
    }

    return age;
}

async function ensureUserExistsWithOrganization(
    userId: string,
    role: "user",
    currentUser: any,
    uploadedImageUrl?: string | null,
) {
    const email = currentUser.emailAddresses[0]?.emailAddress;
    const fullName =
        `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
        email ||
        `user_${userId}`;

    if (!email) return;

    const byClerk = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;

    if (byClerk[0]?.organization_id) {
        await sql`
            UPDATE users
            SET role = ${role}, image_url = ${uploadedImageUrl || currentUser.imageUrl || null}, updated_at = NOW()
            WHERE id = ${byClerk[0].id}
        `;
        return;
    }

    await sql.begin(async (tx: any) => {
        const existingByEmail = await tx<
            { id: string; organization_id: string }[]
        >`
            SELECT id, organization_id
            FROM users
            WHERE email = ${email}
            LIMIT 1
        `;

        if (existingByEmail[0]?.organization_id) {
            await tx`
                UPDATE users
                SET clerk_user_id = ${userId}, role = ${role}, image_url = ${uploadedImageUrl || currentUser.imageUrl || null}, updated_at = NOW()
                WHERE id = ${existingByEmail[0].id}
            `;
            return;
        }

        const orgSlug = `${fullName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
        const orgName = `${fullName}'s Organization`;

        const newOrg = await tx<{ id: string }[]>`
            INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
            VALUES (${orgName}, ${orgSlug}, ${userId}, NOW(), NOW())
            RETURNING id
        `;

        await tx`
            INSERT INTO users (id, name, email, clerk_user_id, role, organization_id, image_url, created_at, updated_at)
            VALUES (gen_random_uuid(), ${fullName}, ${email}, ${userId}, ${role}, ${newOrg[0].id}, ${uploadedImageUrl || currentUser.imageUrl || null}, NOW(), NOW())
        `;
    });
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const accountType = normalizeAccountType(formData.get("accountType"));
        const firstNameRaw = formData.get("firstName");
        const lastNameRaw = formData.get("lastName");
        const emailRaw = formData.get("email");
        const birthDateRaw = formData.get("birthDate");
        const passwordRaw = formData.get("password");

        if (!accountType) {
            return Response.json(
                { error: "Tipo de conta invalido." },
                { status: 400 },
            );
        }

        if (typeof firstNameRaw !== "string" || !firstNameRaw.trim()) {
            return Response.json(
                { error: "Primeiro nome é obrigatório." },
                { status: 400 },
            );
        }

        if (typeof lastNameRaw !== "string" || !lastNameRaw.trim()) {
            return Response.json(
                { error: "Último nome é obrigatório." },
                { status: 400 },
            );
        }

        if (typeof birthDateRaw !== "string" || !birthDateRaw.trim()) {
            return Response.json(
                { error: "Data de nascimento é obrigatória." },
                { status: 400 },
            );
        }

        const parsedBirthDate = new Date(birthDateRaw);
        if (Number.isNaN(parsedBirthDate.getTime())) {
            return Response.json(
                { error: "Data de nascimento inválida." },
                { status: 400 },
            );
        }

        const age = calculateAge(birthDateRaw);
        if (age === null || age < MIN_SIGNUP_AGE || age > MAX_SIGNUP_AGE) {
            return Response.json(
                {
                    error: `A idade deve estar entre ${MIN_SIGNUP_AGE} e ${MAX_SIGNUP_AGE} anos.`,
                },
                { status: 400 },
            );
        }

        if (typeof passwordRaw !== "string" || passwordRaw.trim().length < 8) {
            return Response.json(
                { error: "A palavra-passe deve ter no mínimo 8 caracteres." },
                { status: 400 },
            );
        }

        const role: "user" = "user";
        const heightRaw = formData.get("altura_cm");
        const weightRaw = formData.get("peso_kg");
        const alturaCm =
            typeof heightRaw === "string" && heightRaw.trim().length > 0
                ? Number(heightRaw)
                : null;
        const pesoKg =
            typeof weightRaw === "string" && weightRaw.trim().length > 0
                ? Number(weightRaw)
                : null;

        if (accountType === "atleta") {
            if (
                alturaCm === null ||
                Number.isNaN(alturaCm) ||
                alturaCm <= 0 ||
                pesoKg === null ||
                Number.isNaN(pesoKg) ||
                pesoKg <= 0
            ) {
                return Response.json(
                    {
                        error: "Para atleta, altura e peso são obrigatórios e devem ser válidos.",
                    },
                    { status: 400 },
                );
            }
        }

        const client = await clerkClient();
        const currentUser = await client.users.getUser(userId);
        const currentEmail = currentUser.emailAddresses[0]?.emailAddress;

        if (!currentEmail) {
            return Response.json(
                { error: "Nao foi possivel validar o email do utilizador." },
                { status: 400 },
            );
        }

        if (
            typeof emailRaw === "string" &&
            emailRaw.trim().length > 0 &&
            emailRaw.trim().toLowerCase() !== currentEmail.toLowerCase()
        ) {
            return Response.json(
                { error: "Email inválido para a sessão atual." },
                { status: 400 },
            );
        }

        const firstName = firstNameRaw.trim();
        const lastName = lastNameRaw.trim();
        const fullName = `${firstName} ${lastName}`.trim();
        const birthDate = birthDateRaw;
        const hashedPassword = await hash(passwordRaw, 12);

        await client.users.updateUser(userId, {
            firstName,
            lastName,
        });

        const profilePhoto = formData.get("profilePhoto");
        let uploadedImageUrl: string | null = null;

        if (profilePhoto instanceof File && profilePhoto.size > 0) {
            if (!ALLOWED_PHOTO_TYPES.includes(profilePhoto.type)) {
                return Response.json(
                    {
                        error: "Formato de foto inválido. Use JPG, PNG ou WEBP.",
                    },
                    { status: 400 },
                );
            }

            if (profilePhoto.size > MAX_PHOTO_SIZE) {
                return Response.json(
                    { error: "A foto deve ter no máximo 5MB." },
                    { status: 400 },
                );
            }

            uploadedImageUrl = await uploadImageToR2(
                profilePhoto,
                "user",
                userId,
            );
        }

        await client.users.updateUserMetadata(userId, {
            unsafeMetadata: {
                ...currentUser.unsafeMetadata,
                accountType,
                dateOfBirth: birthDate,
                age,
                athleteProfile:
                    accountType === "atleta"
                        ? {
                              altura_cm: alturaCm,
                              peso_kg: pesoKg,
                          }
                        : null,
                profilePhotoUrl:
                    uploadedImageUrl ||
                    (typeof currentUser.unsafeMetadata?.profilePhotoUrl ===
                    "string"
                        ? currentUser.unsafeMetadata.profilePhotoUrl
                        : null),
            },
            publicMetadata: {
                ...currentUser.publicMetadata,
                accountType,
                age,
            },
        });

        const usersColumns = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name IN ('data_nascimento', 'idade')
        `;

        const hasDataNascimento = usersColumns.some(
            (column) => column.column_name === "data_nascimento",
        );
        const hasIdade = usersColumns.some(
            (column) => column.column_name === "idade",
        );

        await ensureUserExistsWithOrganization(
            userId,
            role,
            currentUser,
            uploadedImageUrl,
        );

        if (hasDataNascimento && hasIdade) {
            await sql`
                UPDATE users
                SET
                    name = ${fullName},
                    email = ${currentEmail},
                    password = ${hashedPassword},
                    role = ${role},
                    data_nascimento = ${birthDate},
                    idade = ${age},
                    image_url = ${uploadedImageUrl || currentUser.imageUrl || null},
                    updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        } else if (hasDataNascimento) {
            await sql`
                UPDATE users
                SET
                    name = ${fullName},
                    email = ${currentEmail},
                    password = ${hashedPassword},
                    role = ${role},
                    data_nascimento = ${birthDate},
                    image_url = ${uploadedImageUrl || currentUser.imageUrl || null},
                    updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        } else {
            await sql`
                UPDATE users
                SET
                    name = ${fullName},
                    email = ${currentEmail},
                    password = ${hashedPassword},
                    role = ${role},
                    image_url = ${uploadedImageUrl || currentUser.imageUrl || null},
                    updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        return Response.json({
            success: true,
            role,
            accountType,
            name: fullName,
            email: currentEmail,
            profilePhotoUrl: uploadedImageUrl || currentUser.imageUrl || null,
        });
    } catch (error) {
        console.error("[ACCOUNT_TYPE] Failed to persist account type:", error);
        return Response.json(
            { error: "Nao foi possivel guardar o tipo de conta." },
            { status: 500 },
        );
    }
}
