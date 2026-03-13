import { auth, clerkClient } from "@clerk/nextjs/server";
import postgres from "postgres";
import { uploadImageToR2 } from "@/app/lib/r2-storage";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

async function ensureUserExistsWithOrganization(
    userId: string,
    role: "admin" | "user",
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

        if (!accountType) {
            return Response.json(
                { error: "Tipo de conta invalido." },
                { status: 400 },
            );
        }

        const role = accountType === "presidente" ? "admin" : "user";
        const ageRaw = formData.get("idade");
        const heightRaw = formData.get("altura_cm");
        const weightRaw = formData.get("peso_kg");

        const idade =
            typeof ageRaw === "string" && ageRaw.trim().length > 0
                ? Number(ageRaw)
                : null;
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
                idade === null ||
                !Number.isInteger(idade) ||
                idade <= 0 ||
                alturaCm === null ||
                Number.isNaN(alturaCm) ||
                alturaCm <= 0 ||
                pesoKg === null ||
                Number.isNaN(pesoKg) ||
                pesoKg <= 0
            ) {
                return Response.json(
                    {
                        error: "Para atleta, idade, altura e peso são obrigatórios e devem ser válidos.",
                    },
                    { status: 400 },
                );
            }
        }

        const client = await clerkClient();
        const currentUser = await client.users.getUser(userId);
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
                athleteProfile:
                    accountType === "atleta"
                        ? {
                              idade,
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
            },
        });

        await sql`
            UPDATE users
            SET role = ${role}, image_url = ${uploadedImageUrl || currentUser.imageUrl || null}, updated_at = NOW()
            WHERE clerk_user_id = ${userId}
        `;

        await ensureUserExistsWithOrganization(
            userId,
            role,
            currentUser,
            uploadedImageUrl,
        );

        return Response.json({
            success: true,
            role,
            accountType,
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
