export type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

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

export function getDashboardPathForAccountType(
    accountType: AccountType | null,
): string {
    switch (accountType) {
        case "presidente":
            return "/dashboard/presidente";
        case "treinador":
            return "/dashboard/treinador";
        case "atleta":
            return "/dashboard/atleta";
        case "responsavel":
            return "/dashboard/pai";
        default:
            return "/signup";
    }
}
