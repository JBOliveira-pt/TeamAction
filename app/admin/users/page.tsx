// Página de users.
import Link from "next/link";
import { fetchAdminUsers } from "@/app/lib/admin-data";
import { ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { getProfilePlaceholder } from "@/app/lib/assets";

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

function getProfileBadge(accountType: AccountType | null) {
    if (accountType === "presidente") {
        return {
            label: "Presidente",
            className:
                "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        };
    }

    if (accountType === "treinador") {
        return {
            label: "Treinador",
            className:
                "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        };
    }

    if (accountType === "atleta") {
        return {
            label: "Atleta",
            className:
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        };
    }

    if (accountType === "responsavel") {
        return {
            label: "Responsável",
            className:
                "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        };
    }

    return {
        label: "Utilizador",
        className:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
    };
}

export const dynamic = "force-dynamic";

const ACCOUNT_TYPE_ORDER: Record<string, number> = {
    presidente: 0,
    treinador: 1,
    atleta: 2,
    responsavel: 3,
};

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; sort?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const query = resolvedSearchParams.query || "";
    const sort = resolvedSearchParams.sort || "";
    let users = await fetchAdminUsers(query);

    const sortedUsers: typeof users extends (infer U)[] ? U[] : never[] = [
        ...users,
    ];

    if (sort === "account_type") {
        sortedUsers.sort((a, b) => {
            const orderA = ACCOUNT_TYPE_ORDER[a.account_type ?? ""] ?? 99;
            const orderB = ACCOUNT_TYPE_ORDER[b.account_type ?? ""] ?? 99;
            return orderA - orderB;
        });
    } else if (sort === "organization") {
        sortedUsers.sort((a, b) => {
            const nameA = (a.organization_name ?? "").toLowerCase();
            const nameB = (b.organization_name ?? "").toLowerCase();
            return nameA.localeCompare(nameB, "pt");
        });
    }

    // Construir link de ordenação preservando query params existentes
    const buildSortHref = (field: string) => {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        params.set("sort", sort === field ? "" : field);
        const qs = params.toString();
        return `/admin/users${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Utilizadores
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pesquisa global e acesso ao perfil para edição.
                    </p>
                </div>
                <form className="w-full md:w-96">
                    <input
                        name="query"
                        defaultValue={query}
                        placeholder="Pesquisar por nome, e-mail, função ou clube/equipa"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                </form>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-950/70">
                        <tr>
                            <th className="text-left px-4 py-3">Nome</th>
                            <th className="text-left px-4 py-3">E-mail</th>
                            <th className="text-left px-4 py-3">
                                <Link
                                    href={buildSortHref("account_type")}
                                    className={`inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${sort === "account_type" ? "text-blue-600 dark:text-blue-400" : ""}`}
                                >
                                    Função
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                            <th className="text-left px-4 py-3">
                                <Link
                                    href={buildSortHref("organization")}
                                    className={`inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${sort === "organization" ? "text-blue-600 dark:text-blue-400" : ""}`}
                                >
                                    Clube/Equipa
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                            <th className="text-left px-4 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.map((user) => (
                            <tr
                                key={user.id}
                                className="border-t border-gray-100 dark:border-gray-800"
                            >
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={
                                                user.image_url ||
                                                getProfilePlaceholder(
                                                    user.account_type,
                                                )
                                            }
                                            alt={`Foto de ${user.name}`}
                                            width={32}
                                            height={32}
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                        <span>{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {user.email}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                                            getProfileBadge(
                                                normalizeAccountType(
                                                    user.account_type,
                                                ),
                                            ).className
                                        }`}
                                    >
                                        {
                                            getProfileBadge(
                                                normalizeAccountType(
                                                    user.account_type,
                                                ),
                                            ).label
                                        }
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {user.organization_name || "-"}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/users/${user.id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Ver/Editar perfil
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {sortedUsers.length === 0 && (
                            <tr>
                                <td
                                    className="px-4 py-6 text-gray-500 dark:text-gray-400"
                                    colSpan={5}
                                >
                                    Nenhum utilizador encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
