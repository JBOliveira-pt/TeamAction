// Rota API account-type: provisão de conta (presidente, treinador, atleta, responsável), criação de org/equipa e vinculação responsável-atleta.
import { auth, clerkClient } from "@clerk/nextjs/server";
import postgres from "postgres";
import crypto from "node:crypto";
import { uploadImageToR2 } from "@/app/lib/r2-storage";
import { hash } from "bcryptjs";
import {
    PRESIDENT_SPORT_OPTIONS,
    ENABLED_SPORTS,
    normalizePresidentSport,
} from "@/app/lib/president-sport-options";
import {
    TRAINER_AMATEUR_COURSE_VALUE,
    isValidNationality,
} from "@/app/lib/trainer-profile-options";
import { sendResponsibleInviteEmail } from "@/app/lib/send-responsible-invite";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_SIGNUP_AGE = 5;
const MIN_ADULT_SIGNUP_AGE = 18;
const MAX_SIGNUP_AGE = 120;
const ATHLETE_HEIGHT_MIN_CM = 100;
const ATHLETE_HEIGHT_MAX_CM = 300;
const ATHLETE_WEIGHT_MIN_KG = 10;
const ATHLETE_WEIGHT_MAX_KG = 300;
const ATHLETE_WEIGHT_DECIMALS_REGEX = /^\d+(\.\d{1,2})?$/;
const ADULT_ONLY_ACCOUNT_TYPES: AccountType[] = [
    "presidente",
    "treinador",
    "responsavel",
];
const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;
const PORTUGAL_COUNTRY = "Portugal";

type PresidentProfileInput = {
    clubName: string;
    sport: string;
    iban: string | null;
    nipc: string | null;
    website: string | null;
    phone: string | null;
    postalCode: string | null;
    address: string | null;
    city: string | null;
    country: string;
};

type TrainerProfileInput = {
    modality: string;
    nationality: string;
    courseType: "amador" | "ipjd_pnft";
    courseModalityId: number | null;
    courseModalityName: string | null;
    technicalLevelId: number | null;
    technicalLevelCode: string | null;
    technicalLevelName: string | null;
    technicalLevelDescription: string | null;
    phone: string | null;
    nif: string | null;
    postalCode: string | null;
    address: string | null;
    city: string | null;
    country: string;
};

type AthleteProfileInput = {
    alturaCm: number;
    pesoKg: number;
    maoDominante: string;
    modality: string;
    clubName: string | null;
    trainerName: string | null;
    teamName: string | null;
    postalCode: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    responsibleEmail: string | null;
    clubPendingApproval: boolean;
    trainerPendingApproval: boolean;
    teamPendingApproval: boolean;
    responsiblePendingApproval: boolean;
};

function getOptionalString(formData: FormData, field: string): string | null {
    const value = formData.get(field);
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizePostalCode(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length !== 7) {
        return value;
    }

    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
}

function isValidEmailFormat(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function parseBooleanFlag(formData: FormData, field: string): boolean {
    const value = formData.get(field);
    return typeof value === "string" && value.toLowerCase() === "true";
}

async function hasTable(tableName: string): Promise<boolean> {
    const rows = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ${tableName}
        ) AS exists
    `;

    return Boolean(rows[0]?.exists);
}

function parsePresidentProfile(formData: FormData): {
    value?: PresidentProfileInput;
    error?: string;
} {
    const clubName = getOptionalString(formData, "president_club_name");
    const sport = getOptionalString(formData, "president_sport");
    const postalCodeRaw = getOptionalString(formData, "president_postal_code");
    const postalCode = normalizePostalCode(postalCodeRaw);
    const city = getOptionalString(formData, "president_city");

    if (!clubName) {
        return { error: "Nome do clube é obrigatório para Presidente." };
    }

    if (!sport) {
        return { error: "Modalidade é obrigatória para Presidente." };
    }

    const normalizedSport = normalizePresidentSport(sport);
    if (!normalizedSport) {
        return {
            error: "Modalidade inválida para Presidente.",
        };
    }

    if (!ENABLED_SPORTS.has(normalizedSport)) {
        return {
            error: "Esta modalidade ainda não está disponível na plataforma.",
        };
    }

    if (postalCode && !POSTAL_CODE_REGEX.test(postalCode)) {
        return {
            error: "Código Postal inválido. Use o formato 0000-000.",
        };
    }

    if (postalCode && !city) {
        return {
            error: "Cidade é obrigatória quando Código Postal é preenchido.",
        };
    }

    return {
        value: {
            clubName,
            sport: normalizedSport,
            iban: getOptionalString(formData, "president_iban"),
            nipc: getOptionalString(formData, "president_nipc"),
            website: getOptionalString(formData, "president_website"),
            phone: getOptionalString(formData, "president_phone"),
            postalCode,
            address: getOptionalString(formData, "president_address"),
            city,
            country: PORTUGAL_COUNTRY,
        },
    };
}

async function parseTrainerProfile(formData: FormData): Promise<{
    value?: TrainerProfileInput;
    error?: string;
}> {
    const modality = getOptionalString(formData, "trainer_modality");
    const nationality = getOptionalString(formData, "trainer_nationality");
    const courseModalityIdRaw = getOptionalString(
        formData,
        "trainer_course_modality_id",
    );
    const technicalLevelIdRaw = getOptionalString(
        formData,
        "trainer_technical_level_id",
    );
    const postalCodeRaw = getOptionalString(formData, "trainer_postal_code");
    const postalCode = normalizePostalCode(postalCodeRaw);
    const city = getOptionalString(formData, "trainer_city");

    if (!modality) {
        return { error: "Modalidade é obrigatória para Treinador." };
    }

    if (!PRESIDENT_SPORT_OPTIONS.some((option) => option === modality)) {
        return { error: "Modalidade inválida para Treinador." };
    }

    if (!ENABLED_SPORTS.has(modality)) {
        return {
            error: "Esta modalidade ainda não está disponível na plataforma.",
        };
    }

    if (!nationality) {
        return { error: "Nacionalidade é obrigatória para Treinador." };
    }

    if (!isValidNationality(nationality)) {
        return { error: "Nacionalidade inválida para Treinador." };
    }

    if (!courseModalityIdRaw) {
        return { error: "Curso IPJD/PNFT é obrigatório para Treinador." };
    }

    let courseType: "amador" | "ipjd_pnft" = "amador";
    let courseModalityId: number | null = null;
    let courseModalityName: string | null = null;
    let technicalLevelId: number | null = null;
    let technicalLevelCode: string | null = null;
    let technicalLevelName: string | null = null;
    let technicalLevelDescription: string | null = null;

    if (courseModalityIdRaw !== TRAINER_AMATEUR_COURSE_VALUE) {
        courseType = "ipjd_pnft";

        const parsedCourseModalityId = Number(courseModalityIdRaw);
        if (!Number.isInteger(parsedCourseModalityId)) {
            return { error: "Curso IPJD/PNFT inválido para Treinador." };
        }

        if (!technicalLevelIdRaw) {
            return {
                error: "Grau Técnico é obrigatório quando existe vínculo ao IPJD/PNFT.",
            };
        }

        const parsedTechnicalLevelId = Number(technicalLevelIdRaw);
        if (!Number.isInteger(parsedTechnicalLevelId)) {
            return { error: "Grau Técnico inválido para Treinador." };
        }

        const modalityRows = await sql<{ id: number; name: string }[]>`
            SELECT id, name
            FROM modalidades
            WHERE id = ${parsedCourseModalityId}
            LIMIT 1
        `;

        const modality = modalityRows[0];
        if (!modality) {
            return { error: "Curso IPJD/PNFT inválido para Treinador." };
        }

        if (!ENABLED_SPORTS.has(modality.name)) {
            return {
                error: "Esta modalidade de curso ainda não está disponível na plataforma.",
            };
        }

        const technicalLevelRows = await sql<
            {
                id: number;
                code: string;
                name: string;
                description: string;
            }[]
        >`
            SELECT id, code, name, description
            FROM graus_tecnicos
            WHERE id = ${parsedTechnicalLevelId}
            LIMIT 1
        `;

        const technicalLevel = technicalLevelRows[0];
        if (!technicalLevel) {
            return { error: "Grau Técnico inválido para Treinador." };
        }

        const courseRows = await sql<{ id: number }[]>`
            SELECT id
            FROM cursos
            WHERE modality_id = ${parsedCourseModalityId}
              AND level_id = ${parsedTechnicalLevelId}
            LIMIT 1
        `;

        if (courseRows.length === 0) {
            return { error: "Combinação de curso e grau técnico inválida." };
        }

        courseModalityId = parsedCourseModalityId;
        courseModalityName = modality.name;
        technicalLevelId = parsedTechnicalLevelId;
        technicalLevelCode = technicalLevel.code;
        technicalLevelName = technicalLevel.name;
        technicalLevelDescription = technicalLevel.description;
    }

    if (postalCode && !POSTAL_CODE_REGEX.test(postalCode)) {
        return {
            error: "Código Postal inválido. Use o formato 0000-000.",
        };
    }

    if (postalCode && !city) {
        return {
            error: "Cidade é obrigatória quando Código Postal é preenchido.",
        };
    }

    return {
        value: {
            modality,
            nationality,
            courseType,
            courseModalityId,
            courseModalityName,
            technicalLevelId,
            technicalLevelCode,
            technicalLevelName,
            technicalLevelDescription,
            phone: getOptionalString(formData, "trainer_phone"),
            nif: getOptionalString(formData, "trainer_nif"),
            postalCode,
            address: getOptionalString(formData, "trainer_address"),
            city,
            country: PORTUGAL_COUNTRY,
        },
    };
}

function parseAthleteProfile(
    formData: FormData,
    age: number,
): {
    value?: AthleteProfileInput;
    error?: string;
} {
    const heightRaw = formData.get("altura_cm");
    const weightRaw = formData.get("peso_kg");
    const maoDominanteRaw = getOptionalString(formData, "mao_dominante");
    const athleteModalityRaw = getOptionalString(formData, "athlete_modality");
    const weightRawTrimmed =
        typeof weightRaw === "string" ? weightRaw.trim() : "";
    const alturaCm =
        typeof heightRaw === "string" && heightRaw.trim().length > 0
            ? Number(heightRaw)
            : null;
    const pesoKg =
        typeof weightRaw === "string" && weightRaw.trim().length > 0
            ? Number(weightRaw)
            : null;

    const VALID_MAO_DOMINANTE = ["direita", "esquerda", "ambidestro"];
    if (!maoDominanteRaw || !VALID_MAO_DOMINANTE.includes(maoDominanteRaw)) {
        return {
            error: "Mão dominante é obrigatória (direita, esquerda ou ambidestro).",
        };
    }

    if (
        !athleteModalityRaw ||
        !PRESIDENT_SPORT_OPTIONS.some((opt) => opt === athleteModalityRaw)
    ) {
        return {
            error: "Modalidade é obrigatória para Atleta.",
        };
    }

    if (!ENABLED_SPORTS.has(athleteModalityRaw)) {
        return {
            error: "Esta modalidade ainda não está disponível na plataforma.",
        };
    }

    if (
        alturaCm === null ||
        Number.isNaN(alturaCm) ||
        alturaCm < ATHLETE_HEIGHT_MIN_CM ||
        alturaCm > ATHLETE_HEIGHT_MAX_CM ||
        pesoKg === null ||
        Number.isNaN(pesoKg) ||
        pesoKg < ATHLETE_WEIGHT_MIN_KG ||
        pesoKg > ATHLETE_WEIGHT_MAX_KG ||
        !ATHLETE_WEIGHT_DECIMALS_REGEX.test(weightRawTrimmed)
    ) {
        return {
            error: "Para atleta, Altura deve estar entre 100 e 300 cm. Peso deve estar entre 10 e 300 kg, com no máximo 2 casas decimais.",
        };
    }

    const postalCodeRaw = getOptionalString(formData, "athlete_postal_code");
    const postalCode = normalizePostalCode(postalCodeRaw);
    const city = getOptionalString(formData, "athlete_city");

    const responsibleEmail = getOptionalString(
        formData,
        "athlete_responsible_email",
    );
    const athleteNeedsResponsible = age < MIN_ADULT_SIGNUP_AGE;

    if (!athleteNeedsResponsible) {
        if (postalCode && !POSTAL_CODE_REGEX.test(postalCode)) {
            return {
                error: "Código Postal inválido. Use o formato 0000-000.",
            };
        }

        if (postalCode && !city) {
            return {
                error: "Cidade é obrigatória quando Código Postal é preenchido.",
            };
        }
    }

    if (athleteNeedsResponsible) {
        if (!responsibleEmail || !isValidEmailFormat(responsibleEmail)) {
            return {
                error: "Para menores de 18 anos, é obrigatório indicar um e-mail válido de Responsável.",
            };
        }
    }

    return {
        value: {
            alturaCm,
            pesoKg,
            maoDominante: maoDominanteRaw,
            modality: athleteModalityRaw,
            clubName: getOptionalString(formData, "athlete_club_name"),
            trainerName: getOptionalString(formData, "athlete_trainer_name"),
            teamName: getOptionalString(formData, "athlete_team_name"),
            postalCode: athleteNeedsResponsible ? null : postalCode,
            address: athleteNeedsResponsible
                ? null
                : getOptionalString(formData, "athlete_address"),
            city: athleteNeedsResponsible ? null : city,
            country: athleteNeedsResponsible ? null : PORTUGAL_COUNTRY,
            responsibleEmail: athleteNeedsResponsible ? responsibleEmail : null,
            clubPendingApproval: parseBooleanFlag(
                formData,
                "athlete_club_pending_approval",
            ),
            trainerPendingApproval: parseBooleanFlag(
                formData,
                "athlete_trainer_pending_approval",
            ),
            teamPendingApproval: parseBooleanFlag(
                formData,
                "athlete_team_pending_approval",
            ),
            responsiblePendingApproval: parseBooleanFlag(
                formData,
                "athlete_responsible_pending_approval",
            ),
        },
    };
}

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

function getMinimumAgeForAccountType(accountType: AccountType): number {
    return ADULT_ONLY_ACCOUNT_TYPES.includes(accountType)
        ? MIN_ADULT_SIGNUP_AGE
        : MIN_SIGNUP_AGE;
}

async function ensureUserExistsWithOrganization(
    userId: string,
    currentUser: any,
    uploadedImageUrl?: string | null,
    hashedPassword?: string,
    accountType?: string,
) {
    const email = currentUser.emailAddresses[0]?.emailAddress;
    const fullName =
        `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
        email ||
        `user_${userId}`;

    if (!email) return;

    const FALLBACK_ORG_ID = "00000000-0000-0000-0000-000000000000";

    const byClerk = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;

    if (
        byClerk[0]?.organization_id &&
        byClerk[0].organization_id !== FALLBACK_ORG_ID
    ) {
        await sql`
            UPDATE users
            SET image_url = ${uploadedImageUrl || currentUser.imageUrl || null}, updated_at = NOW()
            WHERE id = ${byClerk[0].id}
        `;
        return;
    }

    const passwordValue =
        hashedPassword || `clerk_managed_${crypto.randomUUID()}`;

    await sql.begin(async (tx: any) => {
        const existingByEmail = await tx<
            { id: string; organization_id: string }[]
        >`
            SELECT id, organization_id
            FROM users
            WHERE email = ${email}
            LIMIT 1
        `;

        if (
            existingByEmail[0]?.organization_id &&
            existingByEmail[0].organization_id !== FALLBACK_ORG_ID
        ) {
            await tx`
                UPDATE users
                SET clerk_user_id = ${userId}, image_url = ${uploadedImageUrl || currentUser.imageUrl || null}, updated_at = NOW()
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

        // Utilizador já existe (ex.: via webhook) mas sem org — atualizar em vez de inserir
        const existingUser = byClerk[0] || existingByEmail[0];
        if (existingUser) {
            await tx`
                UPDATE users
                SET clerk_user_id = ${userId}, organization_id = ${newOrg[0].id},
                    name = ${fullName}, image_url = ${uploadedImageUrl || currentUser.imageUrl || null}, updated_at = NOW()
                WHERE id = ${existingUser.id}
            `;
        } else {
            await tx`
                INSERT INTO users (id, name, email, password, clerk_user_id, organization_id, image_url, created_at, updated_at)
                VALUES (gen_random_uuid(), ${fullName}, ${email}, ${passwordValue}, ${userId}, ${newOrg[0].id}, ${uploadedImageUrl || currentUser.imageUrl || null}, NOW(), NOW())
            `;
        }

        // Auto-criar equipa mirror para esta organização (1:1) — exceto treinadores
        if (accountType !== "treinador") {
            const existingEquipa = await tx`
                SELECT id FROM equipas WHERE organization_id = ${newOrg[0].id} LIMIT 1
            `;
            if (existingEquipa.length === 0) {
                await tx`
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
                `;
            }
        }
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
        if (age === null || age > MAX_SIGNUP_AGE) {
            return Response.json(
                {
                    error: `A idade deve estar entre ${MIN_SIGNUP_AGE} e ${MAX_SIGNUP_AGE} anos.`,
                },
                { status: 400 },
            );
        }

        const minimumAgeForAccountType =
            getMinimumAgeForAccountType(accountType);
        if (age < minimumAgeForAccountType) {
            return Response.json(
                {
                    error:
                        minimumAgeForAccountType === MIN_ADULT_SIGNUP_AGE
                            ? "Para Presidente, Treinador e Responsável, a idade mínima é 18 anos."
                            : `A idade deve estar entre ${MIN_SIGNUP_AGE} e ${MAX_SIGNUP_AGE} anos.`,
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

        const presidentProfileResult =
            accountType === "presidente"
                ? parsePresidentProfile(formData)
                : { value: undefined, error: undefined };
        const trainerProfileResult =
            accountType === "treinador"
                ? await parseTrainerProfile(formData)
                : { value: undefined, error: undefined };
        const athleteProfileResult =
            accountType === "atleta"
                ? parseAthleteProfile(formData, age)
                : { value: undefined, error: undefined };

        if (presidentProfileResult.error) {
            return Response.json(
                { error: presidentProfileResult.error },
                { status: 400 },
            );
        }

        if (trainerProfileResult.error) {
            return Response.json(
                { error: trainerProfileResult.error },
                { status: 400 },
            );
        }

        if (athleteProfileResult.error) {
            return Response.json(
                { error: athleteProfileResult.error },
                { status: 400 },
            );
        }

        const presidentProfile = presidentProfileResult.value;
        const trainerProfile = trainerProfileResult.value;
        const athleteProfile = athleteProfileResult.value;

        const client = await clerkClient();
        const currentUser = await client.users.getUser(userId);
        const currentEmail = currentUser.emailAddresses[0]?.emailAddress;

        if (!currentEmail) {
            return Response.json(
                { error: "Nao foi possivel validar o e-mail do utilizador." },
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
                presidentProfile:
                    accountType === "presidente" ? presidentProfile : null,
                trainerProfile:
                    accountType === "treinador" ? trainerProfile : null,
                athleteProfile:
                    accountType === "atleta" ? athleteProfile : null,
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
            currentUser,
            uploadedImageUrl,
            hashedPassword,
            accountType,
        );

        await sql`
            UPDATE users
            SET account_type = ${accountType}, updated_at = NOW()
            WHERE clerk_user_id = ${userId}
        `;

        if (accountType === "presidente" && presidentProfile) {
            const userOrg = await sql<
                { id: string; organization_id: string | null }[]
            >`
                SELECT id, organization_id
                FROM users
                WHERE clerk_user_id = ${userId}
                LIMIT 1
            `;

            const presidenteUserId = userOrg[0]?.id ?? null;
            const organizationId = userOrg[0]?.organization_id ?? null;

            if (organizationId) {
                // organizations = multi-tenancy; atualizar apenas o nome
                await sql`
                    UPDATE organizations
                    SET
                        name = ${presidentProfile.clubName},
                        updated_at = NOW()
                    WHERE id = ${organizationId}
                `;

                if (presidenteUserId) {
                    await sql`
                        INSERT INTO clubes (
                            organization_id,
                            presidente_user_id,
                            nome,
                            modalidade,
                            iban,
                            nipc,
                            website,
                            telefone,
                            codigo_postal,
                            morada,
                            cidade,
                            pais,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            ${organizationId},
                            ${presidenteUserId},
                            ${presidentProfile.clubName},
                            ${presidentProfile.sport},
                            ${presidentProfile.iban},
                            ${presidentProfile.nipc},
                            ${presidentProfile.website},
                            ${presidentProfile.phone},
                            ${presidentProfile.postalCode},
                            ${presidentProfile.address},
                            ${presidentProfile.city},
                            ${presidentProfile.country},
                            NOW(),
                            NOW()
                        )
                        ON CONFLICT (presidente_user_id)
                        DO UPDATE SET
                            organization_id = EXCLUDED.organization_id,
                            nome = EXCLUDED.nome,
                            modalidade = EXCLUDED.modalidade,
                            iban = EXCLUDED.iban,
                            nipc = EXCLUDED.nipc,
                            website = EXCLUDED.website,
                            telefone = EXCLUDED.telefone,
                            codigo_postal = EXCLUDED.codigo_postal,
                            morada = EXCLUDED.morada,
                            cidade = EXCLUDED.cidade,
                            pais = EXCLUDED.pais,
                            updated_at = NOW()
                    `;
                }

                // Sincronizar equipa mirror com dados atualizados do clube
                await sql`
                    UPDATE equipas
                    SET
                        nome = ${presidentProfile.clubName},
                        desporto = ${presidentProfile.sport},
                        updated_at = NOW()
                    WHERE organization_id = ${organizationId}
                `;
            }

            const userExtraColumns = await sql<{ column_name: string }[]>`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name IN (
                    'nipc',
                    'website',
                    'telefone',
                    'codigo_postal',
                    'morada',
                    'cidade',
                    'pais'
                  )
            `;

            const hasUserColumn = (column: string) =>
                userExtraColumns.some((item) => item.column_name === column);

            if (hasUserColumn("nipc")) {
                await sql`
                    UPDATE users
                    SET nipc = ${presidentProfile.nipc}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("website")) {
                await sql`
                    UPDATE users
                    SET website = ${presidentProfile.website}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("telefone")) {
                await sql`
                    UPDATE users
                    SET telefone = ${presidentProfile.phone}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("codigo_postal")) {
                await sql`
                    UPDATE users
                    SET codigo_postal = ${presidentProfile.postalCode}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("morada")) {
                await sql`
                    UPDATE users
                    SET morada = ${presidentProfile.address}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("cidade")) {
                await sql`
                    UPDATE users
                    SET cidade = ${presidentProfile.city}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("pais")) {
                await sql`
                    UPDATE users
                    SET pais = ${presidentProfile.country}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }
        }

        if (accountType === "treinador" && trainerProfile) {
            const userExtraColumns = await sql<{ column_name: string }[]>`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name IN (
                    'telefone',
                    'nif',
                    'codigo_postal',
                    'morada',
                    'cidade',
                    'pais'
                  )
            `;

            const hasUserColumn = (column: string) =>
                userExtraColumns.some((item) => item.column_name === column);

            if (hasUserColumn("telefone")) {
                await sql`
                    UPDATE users
                    SET telefone = ${trainerProfile.phone}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("nif")) {
                await sql`
                    UPDATE users
                    SET nif = ${trainerProfile.nif}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("codigo_postal")) {
                await sql`
                    UPDATE users
                    SET codigo_postal = ${trainerProfile.postalCode}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("morada")) {
                await sql`
                    UPDATE users
                    SET morada = ${trainerProfile.address}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("cidade")) {
                await sql`
                    UPDATE users
                    SET cidade = ${trainerProfile.city}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }

            if (hasUserColumn("pais")) {
                await sql`
                    UPDATE users
                    SET pais = ${trainerProfile.country}, updated_at = NOW()
                    WHERE clerk_user_id = ${userId}
                `;
            }
        }

        if (hasDataNascimento && hasIdade) {
            await sql`
                UPDATE users
                SET
                    name = ${fullName},
                    email = ${currentEmail},
                    password = ${hashedPassword},
                    account_type = ${accountType},
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
                    account_type = ${accountType},
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
                    account_type = ${accountType},
                    image_url = ${uploadedImageUrl || currentUser.imageUrl || null},
                    updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (accountType === "atleta" && athleteProfile) {
            const athleteTable = (await hasTable("users")) ? "users" : null;

            if (athleteTable) {
                const columns = await sql<{ column_name: string }[]>`
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = ${athleteTable}
                `;

                const hasAthleteColumn = (column: string) =>
                    columns.some((item) => item.column_name === column);

                const athleteExists = await sql<{ id: string }[]>`
                    SELECT id
                    FROM users
                    WHERE clerk_user_id = ${userId}
                    LIMIT 1
                `;

                if (athleteExists.length > 0) {
                    if (hasAthleteColumn("name")) {
                        await sql`
                            UPDATE users
                            SET name = ${fullName}, updated_at = NOW()
                            WHERE clerk_user_id = ${userId}
                        `;
                    }

                    if (hasAthleteColumn("data_nascimento")) {
                        await sql`
                            UPDATE users
                            SET data_nascimento = ${birthDate}, updated_at = NOW()
                            WHERE clerk_user_id = ${userId}
                        `;
                    }

                    if (hasAthleteColumn("morada")) {
                        await sql`
                            UPDATE users
                            SET morada = ${athleteProfile.address}, updated_at = NOW()
                            WHERE clerk_user_id = ${userId}
                        `;
                    }

                    if (hasAthleteColumn("codigo_postal")) {
                        await sql`
                            UPDATE users
                            SET codigo_postal = ${athleteProfile.postalCode}, updated_at = NOW()
                            WHERE clerk_user_id = ${userId}
                        `;
                    }

                    if (hasAthleteColumn("cidade")) {
                        await sql`
                            UPDATE users
                            SET cidade = ${athleteProfile.city}, updated_at = NOW()
                            WHERE clerk_user_id = ${userId}
                        `;
                    }

                    if (hasAthleteColumn("pais")) {
                        await sql`
                            UPDATE users
                            SET pais = ${athleteProfile.country}, updated_at = NOW()
                            WHERE clerk_user_id = ${userId}
                        `;
                    }

                    if (hasAthleteColumn("image_url")) {
                        await sql`
                            UPDATE users
                            SET image_url = ${uploadedImageUrl || currentUser.imageUrl || null}, updated_at = NOW()
                            WHERE clerk_user_id = ${userId}
                        `;
                    }
                }
            }
        }

        if (accountType === "atleta" && athleteProfile) {
            // Garantir que o atleta tem registo na tabela `atletas`
            const athleteUser = await sql<
                { id: string; organization_id: string | null }[]
            >`
                SELECT id, organization_id
                FROM users
                WHERE clerk_user_id = ${userId}
                LIMIT 1
            `;

            let athleteDbId = athleteUser[0]?.id;
            let athleteOrgId = athleteUser[0]?.organization_id;

            // Se o utilizador existe mas não tem organização real, criá-la agora
            const FALLBACK_ORG_UUID = "00000000-0000-0000-0000-000000000000";
            if (
                athleteDbId &&
                (!athleteOrgId || athleteOrgId === FALLBACK_ORG_UUID)
            ) {
                console.warn(
                    `[ACCOUNT_TYPE] Athlete ${userId} has no valid organization_id (got: ${athleteOrgId}). Creating organization now.`,
                );
                const orgSlug = `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
                const orgName = `${fullName}'s Organization`;
                const newOrg = await sql<{ id: string }[]>`
                    INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
                    VALUES (${orgName}, ${orgSlug}, ${userId}, NOW(), NOW())
                    RETURNING id
                `;
                athleteOrgId = newOrg[0].id;
                await sql`
                    UPDATE users
                    SET organization_id = ${athleteOrgId}, updated_at = NOW()
                    WHERE id = ${athleteDbId}
                `;
            }

            if (!athleteDbId || !athleteOrgId) {
                console.error(
                    `[ACCOUNT_TYPE] Cannot create athlete record: athleteDbId=${athleteDbId}, athleteOrgId=${athleteOrgId}`,
                );
                return Response.json(
                    {
                        error: "Não foi possível criar o registo de atleta. Tente novamente.",
                    },
                    { status: 500 },
                );
            }

            const existingAtleta = await sql<{ id: string }[]>`
                SELECT id FROM atletas WHERE user_id = ${athleteDbId} LIMIT 1
            `;

            if (existingAtleta.length === 0) {
                const isMinor = age !== null && age < 18;
                await sql`
                    INSERT INTO atletas (
                        id, nome, organization_id, user_id, estado,
                        menor_idade, peso_kg, altura_cm, mao_dominante, modalidade, data_nascimento, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(),
                        ${fullName},
                        ${athleteOrgId},
                        ${athleteDbId},
                        'ativo',
                        ${isMinor},
                        ${athleteProfile.pesoKg},
                        ${athleteProfile.alturaCm},
                        ${athleteProfile.maoDominante},
                        ${athleteProfile.modality},
                        ${birthDate},
                        NOW(),
                        NOW()
                    )
                `;
            } else {
                // Atualizar peso/altura no registo existente
                await sql`
                    UPDATE atletas
                    SET peso_kg = ${athleteProfile.pesoKg},
                        altura_cm = ${athleteProfile.alturaCm},
                        mao_dominante = ${athleteProfile.maoDominante},
                        modalidade = ${athleteProfile.modality},
                        data_nascimento = COALESCE(data_nascimento, ${birthDate}),
                        updated_at = NOW()
                    WHERE user_id = ${athleteDbId}
                `;
            }

            const hasPendingRelationsTable = await hasTable(
                "atleta_relacoes_pendentes",
            );

            if (hasPendingRelationsTable) {
                const athleteUserId = athleteDbId;
                if (athleteUserId) {
                    await sql`
                        DELETE FROM atleta_relacoes_pendentes
                        WHERE atleta_user_id = ${athleteUserId}
                          AND status = 'pendente'
                    `.catch(() => {});

                    if (
                        athleteProfile.clubPendingApproval &&
                        athleteProfile.clubName
                    ) {
                        const hasClubsTable = await hasTable("clubes");
                        const clubId = hasClubsTable
                            ? ((
                                  await sql<{ id: string }[]>`
                                      SELECT id::text AS id
                                      FROM clubes
                                      WHERE LOWER(nome) = LOWER(${athleteProfile.clubName})
                                      LIMIT 1
                                  `
                              )[0]?.id ?? null)
                            : null;

                        await sql`
                            INSERT INTO atleta_relacoes_pendentes (
                                atleta_user_id,
                                relation_kind,
                                status,
                                alvo_nome,
                                alvo_clube_id,
                                created_at,
                                updated_at
                            )
                            VALUES (
                                ${athleteUserId},
                                'clube',
                                'pendente',
                                ${athleteProfile.clubName},
                                ${clubId},
                                NOW(),
                                NOW()
                            )
                            ON CONFLICT DO NOTHING
                        `.catch(() => {});
                    }

                    if (
                        athleteProfile.trainerPendingApproval &&
                        athleteProfile.trainerName
                    ) {
                        const trainerRows = await sql<{ id: string }[]>`
                            SELECT id::text AS id
                            FROM users
                            WHERE LOWER(name) = LOWER(${athleteProfile.trainerName})
                            LIMIT 1
                        `;

                        await sql`
                            INSERT INTO atleta_relacoes_pendentes (
                                atleta_user_id,
                                relation_kind,
                                status,
                                alvo_nome,
                                alvo_treinador_user_id,
                                created_at,
                                updated_at
                            )
                            VALUES (
                                ${athleteUserId},
                                'treinador',
                                'pendente',
                                ${athleteProfile.trainerName},
                                ${trainerRows[0]?.id ?? null},
                                NOW(),
                                NOW()
                            )
                            ON CONFLICT DO NOTHING
                        `.catch(() => {});
                    }

                    if (
                        athleteProfile.teamPendingApproval &&
                        athleteProfile.teamName
                    ) {
                        const hasTeamsTable = await hasTable("equipas");
                        const teamId = hasTeamsTable
                            ? ((
                                  await sql<{ id: string }[]>`
                                      SELECT id::text AS id
                                      FROM equipas
                                      WHERE LOWER(nome) = LOWER(${athleteProfile.teamName})
                                      LIMIT 1
                                  `
                              )[0]?.id ?? null)
                            : null;

                        await sql`
                            INSERT INTO atleta_relacoes_pendentes (
                                atleta_user_id,
                                relation_kind,
                                status,
                                alvo_nome,
                                alvo_equipa_id,
                                created_at,
                                updated_at
                            )
                            VALUES (
                                ${athleteUserId},
                                'equipa',
                                'pendente',
                                ${athleteProfile.teamName},
                                ${teamId},
                                NOW(),
                                NOW()
                            )
                            ON CONFLICT DO NOTHING
                        `.catch(() => {});
                    }

                    if (
                        athleteProfile.responsiblePendingApproval &&
                        athleteProfile.responsibleEmail
                    ) {
                        // Preencher encarregado_educacao no registo do atleta
                        await sql`
                            UPDATE atletas
                            SET encarregado_educacao = ${athleteProfile.responsibleEmail},
                                updated_at = NOW()
                            WHERE user_id = ${athleteUserId}
                              AND (encarregado_educacao IS NULL OR encarregado_educacao = '')
                        `.catch(() => {});

                        // Verificar se o responsável já tem conta
                        const existingResponsavel = await sql<{ id: string }[]>`
                            SELECT id FROM users
                            WHERE LOWER(email) = LOWER(${athleteProfile.responsibleEmail})
                              AND account_type = 'responsavel'
                            LIMIT 1
                        `.catch(() => []);

                        const responsavelUserId =
                            existingResponsavel[0]?.id ?? null;

                        // A relação começa SEMPRE como pendente.
                        // Só pode passar a 'aceite' quando o responsável
                        // confirmar explicitamente (via /api/vinculacoes-responsavel).
                        const relationStatus = "pendente";

                        await sql`
                            INSERT INTO atleta_relacoes_pendentes (
                                atleta_user_id,
                                relation_kind,
                                status,
                                alvo_email,
                                alvo_responsavel_user_id,
                                created_at,
                                updated_at
                            )
                            VALUES (
                                ${athleteUserId},
                                'responsavel',
                                ${relationStatus},
                                ${athleteProfile.responsibleEmail},
                                ${responsavelUserId},
                                NOW(),
                                NOW()
                            )
                            ON CONFLICT DO NOTHING
                        `.catch(() => {});

                        // Enviar e-mail de convite apenas se o responsável
                        // ainda NÃO completou a sua conta
                        if (!responsavelUserId) {
                            try {
                                await sendResponsibleInviteEmail(
                                    athleteUserId,
                                    fullName,
                                    athleteProfile.responsibleEmail,
                                );
                            } catch (inviteError) {
                                console.error(
                                    "[ACCOUNT_TYPE] Failed to send responsible invite email:",
                                    inviteError,
                                );
                            }
                        } else {
                            // Responsável já existe — notificar que há um
                            // pedido de vinculação pendente (NÃO auto-aceitar).
                            await sql`
                                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                                VALUES (
                                    gen_random_uuid(),
                                    (SELECT COALESCE(organization_id, '00000000-0000-0000-0000-000000000000') FROM users WHERE id = ${responsavelUserId} LIMIT 1),
                                    ${responsavelUserId},
                                    'Pedido de Vinculação — Atleta',
                                    ${`O atleta ${fullName} registou-se como menor de idade e indicou o seu e-mail como responsável. Aceda à plataforma para aceitar ou recusar o pedido.`},
                                    'vinculacao_responsavel',
                                    false,
                                    NOW()
                                )
                            `.catch(() => {});
                        }
                    }
                }
            }
        }

        // Quando um "responsavel" completa o registo, tratar vinculação ao atleta menor
        let pendingValidation = false;
        if (accountType === "responsavel") {
            try {
                const responsavelUserRows = await sql<{ id: string }[]>`
                    SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
                `;
                const responsavelDbId = responsavelUserRows[0]?.id;
                const responsibleMinorEmail = String(
                    formData.get("responsible_minor_email") || "",
                ).trim();

                if (responsavelDbId) {
                    // 1. Always update existing athlete-initiated pending relations
                    //    (minor signed up first), storing the responsible user_id.
                    const hasPendingTable = await hasTable(
                        "atleta_relacoes_pendentes",
                    );
                    if (hasPendingTable) {
                        await sql`
                            UPDATE atleta_relacoes_pendentes
                            SET alvo_responsavel_user_id = ${responsavelDbId},
                                updated_at = NOW()
                            WHERE relation_kind = 'responsavel'
                              AND status = 'pendente'
                              AND LOWER(alvo_email) = LOWER(${currentEmail})
                        `.catch(() => {});
                    }

                    // 2. If minor email provided (self-initiated flow), validate + link
                    if (responsibleMinorEmail) {
                        const minorRows = await sql<
                            {
                                user_id: string;
                                nome: string;
                                menor_idade: boolean | null;
                            }[]
                        >`
                            SELECT a.user_id, a.nome, a.menor_idade
                            FROM atletas a
                            INNER JOIN users u ON u.id = a.user_id
                            WHERE LOWER(u.email) = LOWER(${responsibleMinorEmail})
                              AND a.menor_idade = true
                            LIMIT 1
                        `;

                        if (minorRows.length === 0) {
                            // Menor ainda não se registou — guardar a
                            // intenção do responsável para que o vínculo
                            // seja estabelecido quando o menor se registar.
                            console.log(
                                `[ACCOUNT_TYPE] Minor ${responsibleMinorEmail} not found yet. Storing responsible intent for later linking.`,
                            );
                        } else {
                            const minor = minorRows[0];
                            // Verificar se o vínculo já existe (fluxo iniciado pelo atleta)
                            const existingLink = await sql<
                                { id: string; status: string }[]
                            >`
                                SELECT id, status FROM atleta_relacoes_pendentes
                                WHERE atleta_user_id = ${minor.user_id}
                                  AND relation_kind = 'responsavel'
                                  AND LOWER(alvo_email) = LOWER(${currentEmail})
                                LIMIT 1
                            `.catch(() => []);

                            if (existingLink.length === 0) {
                                // Responsável registou-se e indicou o menor —
                                // criar como pendente. Só aceitar quando o
                                // atleta confirmar via /api/vinculacoes-responsavel.
                                await sql`
                                    INSERT INTO atleta_relacoes_pendentes (
                                        id, atleta_user_id, relation_kind, status,
                                        alvo_email, alvo_responsavel_user_id,
                                        created_at, updated_at
                                    ) VALUES (
                                        gen_random_uuid(), ${minor.user_id}, 'responsavel', 'pendente',
                                        ${currentEmail}, ${responsavelDbId},
                                        NOW(), NOW()
                                    )
                                    ON CONFLICT DO NOTHING
                                `;
                            } else if (existingLink[0].status === "pendente") {
                                // Já existe relação pendente criada pelo
                                // atleta — preencher o user_id do responsável
                                // mas manter pendente até confirmação explícita.
                                await sql`
                                    UPDATE atleta_relacoes_pendentes
                                    SET alvo_responsavel_user_id = ${responsavelDbId},
                                        updated_at = NOW()
                                    WHERE id = ${existingLink[0].id}
                                `.catch(() => {});
                            }

                            // NÃO atualizar encarregado_educacao automaticamente.
                            // Só deve ser preenchido quando a vinculação for aceite.

                            // Notificar o atleta menor sobre o pedido pendente
                            const minorOrg = await sql<
                                { organization_id: string | null }[]
                            >`
                                SELECT organization_id FROM users WHERE id = ${minor.user_id} LIMIT 1
                            `.catch(() => []);

                            await sql`
                                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                                VALUES (
                                    gen_random_uuid(),
                                    ${minorOrg[0]?.organization_id ?? "00000000-0000-0000-0000-000000000000"},
                                    ${minor.user_id},
                                    'Pedido de Vinculação — Responsável',
                                    ${`${fullName} (${currentEmail}) registou-se como responsável e indicou o seu e-mail. Aceda às notificações para aceitar ou recusar o pedido.`},
                                    'vinculacao_responsavel',
                                    false,
                                    NOW()
                                )
                            `.catch(() => {});
                        }
                    }

                    // 3. Check if the responsável has any accepted relation
                    const acceptedRows = await sql<{ id: string }[]>`
                        SELECT id FROM atleta_relacoes_pendentes
                        WHERE alvo_responsavel_user_id = ${responsavelDbId}
                          AND relation_kind = 'responsavel'
                          AND status = 'aceite'
                        LIMIT 1
                    `.catch(() => []);
                    pendingValidation = acceptedRows.length === 0;
                }
            } catch (linkError) {
                console.error(
                    "[ACCOUNT_TYPE] Failed to handle responsavel linking:",
                    linkError,
                );
                pendingValidation = true;
            }
        }

        return Response.json({
            success: true,
            accountType,
            pendingValidation,
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
