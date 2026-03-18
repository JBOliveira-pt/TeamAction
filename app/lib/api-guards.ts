import { auth, clerkClient } from "@clerk/nextjs/server";

export type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

type ApiAccessOk = {
    ok: true;
    userId: string;
    accountType: AccountType;
};

type ApiAccessError = {
    ok: false;
    status: number;
    error: string;
};

export type ApiAccessResult = ApiAccessOk | ApiAccessError;

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

export async function requireApiAccountType(): Promise<ApiAccessResult> {
    const { userId } = await auth();

    if (!userId) {
        return {
            ok: false,
            status: 401,
            error: "Unauthorized",
        };
    }

    try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const accountType = normalizeAccountType(
            user.unsafeMetadata?.accountType ??
                user.publicMetadata?.accountType,
        );

        if (!accountType) {
            return {
                ok: false,
                status: 403,
                error: "Account type is required",
            };
        }

        return {
            ok: true,
            userId,
            accountType,
        };
    } catch {
        return {
            ok: false,
            status: 500,
            error: "Failed to validate account type",
        };
    }
}
