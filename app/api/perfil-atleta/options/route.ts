import { clerkClient } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type SelectOption = {
    value: string;
    label: string;
};

type UserOption = SelectOption & {
    email?: string;
};

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

function displayNameFromClerkUser(user: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
}): string {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    if (fullName.length > 0) {
        return fullName;
    }

    if (user.username && user.username.trim().length > 0) {
        return user.username.trim();
    }

    return user.emailAddresses?.[0]?.emailAddress || "Sem nome";
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

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const rawQuery = searchParams.get("query") || "";
        const query = rawQuery.trim();

        if (query.length < 2) {
            return Response.json(
                {
                    clubOptions: [],
                    trainerOptions: [],
                    teamOptions: [],
                    responsibleEmailOptions: [],
                },
                { status: 200 },
            );
        }

        const likeQuery = `%${query}%`;

        const [clubRows, teamTableExists] = await Promise.all([
            sql<{ id: string; nome: string }[]>`
                SELECT id::text AS id, nome
                FROM clubes
                WHERE nome ILIKE ${likeQuery}
                ORDER BY nome ASC
                LIMIT 10
            `,
            hasTable("equipas"),
        ]);

        const teamRows = teamTableExists
            ? await sql<{ id: string; nome: string }[]>`
                  SELECT id::text AS id, nome
                  FROM equipas
                  WHERE nome ILIKE ${likeQuery}
                  ORDER BY nome ASC
                  LIMIT 10
              `
            : [];

        const client = await clerkClient();
        const clerkUsers = await client.users.getUserList({
            query,
            limit: 50,
        });

        const trainerOptions: UserOption[] = [];
        const responsibleEmailOptions: SelectOption[] = [];

        for (const user of clerkUsers.data) {
            const accountType = normalizeAccountType(
                user.unsafeMetadata?.accountType ??
                    user.publicMetadata?.accountType,
            );

            if (accountType === "treinador") {
                trainerOptions.push({
                    value: user.id,
                    label: displayNameFromClerkUser(user),
                    email: user.emailAddresses?.[0]?.emailAddress,
                });
            }

            if (accountType === "responsavel") {
                const email = user.emailAddresses?.[0]?.emailAddress;
                if (email) {
                    responsibleEmailOptions.push({
                        value: email,
                        label: email,
                    });
                }
            }
        }

        return Response.json(
            {
                clubOptions: clubRows.map((row) => ({
                    value: row.id,
                    label: row.nome,
                })),
                trainerOptions,
                teamOptions: teamRows.map((row) => ({
                    value: row.id,
                    label: row.nome,
                })),
                responsibleEmailOptions,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "[ATHLETE_PROFILE_OPTIONS] Failed to load options:",
            error,
        );
        return Response.json(
            { error: "Não foi possível carregar opções de Atleta." },
            { status: 500 },
        );
    }
}
