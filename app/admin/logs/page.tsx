import {
    fetchInteractionTypes,
    fetchUserActionLogs,
    fetchAdminUsersForSelect,
} from "@/app/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({
    searchParams,
}: {
    searchParams: Promise<{
        userId?: string;
        interactionType?: string;
        date?: string;
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

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Logs de Ações
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Filtro por user, data e tipo de interação.
                </p>
            </header>

            <form className="grid items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4 dark:border-gray-800 dark:bg-gray-900">
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                        User
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
                            <th className="text-left px-4 py-3">Quando</th>
                            <th className="text-left px-4 py-3">User</th>
                            <th className="text-left px-4 py-3">Tipo</th>
                            <th className="text-left px-4 py-3">Página</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
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
                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                        {log.interaction_type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                                    {log.path}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
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
