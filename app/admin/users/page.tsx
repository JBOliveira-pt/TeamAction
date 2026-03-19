import Link from "next/link";
import { fetchAdminUsers } from "@/app/lib/admin-data";
import { clerkClient } from "@clerk/nextjs/server";
import { User } from "lucide-react";
import Image from "next/image";

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
                "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
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
            label: "Pai/Enc.",
            className:
                "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        };
    }

    return {
        label: "Usuário",
        className:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
    };
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const query = resolvedSearchParams.query || "";
    const users = await fetchAdminUsers(query);

    const accountTypeByClerkId = new Map<string, AccountType>();
    const client = await clerkClient();

    await Promise.all(
        users.map(async (user) => {
            if (!user.clerk_user_id) {
                return;
            }

            try {
                const clerkUser = await client.users.getUser(
                    user.clerk_user_id,
                );
                const accountType = normalizeAccountType(
                    clerkUser.unsafeMetadata?.accountType ??
                        clerkUser.publicMetadata?.accountType,
                );

                if (accountType) {
                    accountTypeByClerkId.set(user.clerk_user_id, accountType);
                }
            } catch {
                // Keep fallback badge when Clerk metadata is unavailable.
            }
        }),
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Usuários
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pesquisa global e acesso ao perfil para edição.
                    </p>
                </div>
                <form className="w-full md:w-80">
                    <input
                        name="query"
                        defaultValue={query}
                        placeholder="Pesquisar por nome, email, função, organização"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                </form>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-950/70">
                        <tr>
                            <th className="text-left px-4 py-3">Nome</th>
                            <th className="text-left px-4 py-3">Email</th>
                            <th className="text-left px-4 py-3">Função</th>
                            <th className="text-left px-4 py-3">Organização</th>
                            <th className="text-left px-4 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="border-t border-gray-100 dark:border-gray-800"
                            >
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                    <div className="flex items-center gap-3">
                                        {user.image_url ? (
                                            <Image
                                                src={user.image_url}
                                                alt={`Foto de ${user.name}`}
                                                width={32}
                                                height={32}
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                                                <User size={16} />
                                            </div>
                                        )}
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
                                                user.clerk_user_id
                                                    ? (accountTypeByClerkId.get(
                                                          user.clerk_user_id,
                                                      ) ?? null)
                                                    : null,
                                            ).className
                                        }`}
                                    >
                                        {
                                            getProfileBadge(
                                                user.clerk_user_id
                                                    ? (accountTypeByClerkId.get(
                                                          user.clerk_user_id,
                                                      ) ?? null)
                                                    : null,
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
                        {users.length === 0 && (
                            <tr>
                                <td
                                    className="px-4 py-6 text-gray-500 dark:text-gray-400"
                                    colSpan={5}
                                >
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
