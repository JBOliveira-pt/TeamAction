import {
    fetchInteractionTypes,
    fetchUserActionLogs,
    fetchAdminUsersForSelect,
} from "@/app/lib/admin-data";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";

export const dynamic = "force-dynamic";

function getLogTypeBadge(type: string): { label: string; className: string } {
    const t = type.toLowerCase();

    if (t === "page_view")
        return {
            label: type,
            className:
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        };
    if (t === "admin_user_update")
        return {
            label: type,
            className:
                "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
        };
    if (t === "admin_warning_emit")
        return {
            label: type,
            className:
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        };
    if (t.startsWith("admin_"))
        return {
            label: type,
            className:
                "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        };
    if (t.includes("login") || t.includes("logout") || t.includes("auth"))
        return {
            label: type,
            className:
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        };
    if (t.includes("create") || t.includes("insert"))
        return {
            label: type,
            className:
                "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        };
    if (t.includes("delete") || t.includes("remove"))
        return {
            label: type,
            className:
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        };
    if (t.includes("update") || t.includes("edit"))
        return {
            label: type,
            className:
                "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        };
    // fallback
    return {
        label: type,
        className:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
}

export default async function AdminLogsPage({
    searchParams,
}: {
    searchParams: Promise<{
        userId?: string;
        interactionType?: string;
        date?: string;
        sort?: string;
        dir?: string;
    }>;
}) {
    const resolved = await searchParams;
    const users = await fetchAdminUsersForSelect();
    const types = await fetchInteractionTypes();
    const logs = await fetchUserActionLogs({
        userId: resolved.userId,
        interactionType: resolved.interactionType,
        date: resolved.date,
    });

    const sort = resolved.sort || "";
    const dir = resolved.dir === "desc" ? "desc" : "asc";

    const sortedLogs = [...logs];

    if (sort === "date") {
        sortedLogs.sort((a, b) => {
            const diff =
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime();
            return dir === "desc" ? -diff : diff;
        });
    } else if (sort === "user") {
        sortedLogs.sort((a, b) => {
            const cmp = a.user_name.localeCompare(b.user_name, "pt");
            return dir === "desc" ? -cmp : cmp;
        });
    } else if (sort === "type") {
        sortedLogs.sort((a, b) => {
            const cmp = a.interaction_type.localeCompare(
                b.interaction_type,
                "pt",
            );
            return dir === "desc" ? -cmp : cmp;
        });
    } else if (sort === "path") {
        sortedLogs.sort((a, b) => {
            const cmp = a.path.localeCompare(b.path, "pt");
            return dir === "desc" ? -cmp : cmp;
        });
    }

    const buildSortHref = (field: string) => {
        const params = new URLSearchParams();
        if (resolved.userId) params.set("userId", resolved.userId);
        if (resolved.interactionType)
            params.set("interactionType", resolved.interactionType);
        if (resolved.date) params.set("date", resolved.date);
        if (sort === field) {
            // Toggle direction, or remove sort if already desc
            if (dir === "asc") {
                params.set("sort", field);
                params.set("dir", "desc");
            }
            // if desc, don't add sort → removes it
        } else {
            params.set("sort", field);
        }
        const qs = params.toString();
        return `/admin/logs${qs ? `?${qs}` : ""}`;
    };

    const sortLinkClass = (field: string) =>
        `inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${sort === field ? "text-blue-600 dark:text-blue-400" : ""}`;

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Logs de Ações
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Filtro por utilizadores, datas e tipos de interações.
                </p>
            </header>

            <form className="grid items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4 dark:border-gray-800 dark:bg-gray-900">
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                        Utilizador
                    </label>
                    <select
                        name="userId"
                        defaultValue={resolved.userId || ""}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    >
                        <option value="">Todos</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                        Tipo
                    </label>
                    <select
                        name="interactionType"
                        defaultValue={resolved.interactionType || ""}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    >
                        <option value="">Todos</option>
                        {types.map((type) => (
                            <option
                                key={type.interaction_type}
                                value={type.interaction_type}
                            >
                                {type.interaction_type}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                        Data
                    </label>
                    <input
                        type="date"
                        name="date"
                        defaultValue={resolved.date || ""}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    />
                </div>

                <button
                    type="submit"
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                >
                    Filtrar
                </button>
            </form>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-950/70">
                        <tr>
                            <th className="text-left px-4 py-3">
                                <Link
                                    href={buildSortHref("date")}
                                    className={sortLinkClass("date")}
                                >
                                    Data
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                            <th className="text-left px-4 py-3">
                                <Link
                                    href={buildSortHref("user")}
                                    className={sortLinkClass("user")}
                                >
                                    Utilizador
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                            <th className="text-left px-4 py-3">
                                <Link
                                    href={buildSortHref("type")}
                                    className={sortLinkClass("type")}
                                >
                                    Tipo
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                            <th className="text-left px-4 py-3">
                                <Link
                                    href={buildSortHref("path")}
                                    className={sortLinkClass("path")}
                                >
                                    Página
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLogs.map((log) => (
                            <tr
                                key={log.id}
                                className="border-t border-gray-100 dark:border-gray-800"
                            >
                                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {new Date(log.created_at).toLocaleString(
                                        "pt-PT",
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                                    <div>{log.user_name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {log.user_email}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {(() => {
                                        const badge = getLogTypeBadge(
                                            log.interaction_type,
                                        );
                                        return (
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}
                                            >
                                                {badge.label}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                                    {log.path}
                                </td>
                            </tr>
                        ))}
                        {sortedLogs.length === 0 && (
                            <tr>
                                <td
                                    className="px-4 py-6 text-gray-500 dark:text-gray-400"
                                    colSpan={4}
                                >
                                    Nenhum log encontrado para os filtros
                                    aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
