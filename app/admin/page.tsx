import {
    fetchAdminActionLogsMonthlySeries,
    fetchAdminActionTypeMonthlySeries,
    fetchAdminLogsMonthlySeries,
    fetchAdminOverviewStats,
    fetchAdminUsersMonthlySeries,
    fetchAdminUsersAccountTypeMonthlySeries,
    fetchAdminViewLogsMonthlySeries,
} from "@/app/lib/admin-data";
import { MonthlyCountChart } from "@/app/ui/admin/monthly-count-chart";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
    const [
        stats,
        usersMonthlySeries,
        usersAccountTypeSeries,
        actionLogsMonthlySeries,
        viewLogsMonthlySeries,
        actionTypeSeries,
        logsMonthlySeries,
    ] = await Promise.all([
        fetchAdminOverviewStats(),
        fetchAdminUsersMonthlySeries(),
        fetchAdminUsersAccountTypeMonthlySeries(),
        fetchAdminActionLogsMonthlySeries(),
        fetchAdminViewLogsMonthlySeries(),
        fetchAdminActionTypeMonthlySeries(),
        fetchAdminLogsMonthlySeries(),
    ]);

    const userTypeTabs = [
        {
            id: "all-users",
            label: `Todos (${stats.users})`,
            data: usersMonthlySeries,
        },
        ...usersAccountTypeSeries.map((entry) => {
            const total = entry.data.reduce(
                (sum, point) => sum + point.count,
                0,
            );
            return {
                id: entry.accountType,
                label: `${entry.label} (${total})`,
                data: entry.data,
            };
        }),
    ];

    const actionTypeTabs = [
        {
            id: "all-actions",
            label: `Todas (${stats.actionLogs})`,
            data: actionLogsMonthlySeries,
        },
        ...actionTypeSeries.map((entry) => {
            const total = entry.data.reduce(
                (sum, point) => sum + point.count,
                0,
            );
            return {
                id: entry.interactionType,
                label: `${entry.interactionType} (${total})`,
                data: entry.data,
            };
        }),
    ];

    const logsTotal = logsMonthlySeries.reduce(
        (sum, point) => sum + point.count,
        0,
    );

    const cards = [
        { label: "Total de Users", value: stats.users },
        { label: "Logs de Ações Registados", value: stats.actionLogs },
        { label: "Logs de Views Registados", value: stats.viewLogs },
        { label: "Logs Registados (Total)", value: logsTotal },
        { label: "Avisos Não Lidos", value: stats.avisosNaoLidos },
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Painel de Controlo - Administrador
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Gestão central de utilizadores, auditoria de interações e
                    comunicação por avisos.
                </p>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {cards.map((card) => (
                    <article
                        key={card.label}
                        className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                    >
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {card.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {card.value}
                        </p>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <MonthlyCountChart
                    title="Novos Users Inscritos"
                    subtitle="Inscrições mensais na plataforma (todos os perfis)"
                    data={usersMonthlySeries}
                    accent="blue"
                    tabs={userTypeTabs}
                />

                <MonthlyCountChart
                    title="Logs de Ações Registados"
                    subtitle="Ações de todos os users, incluindo o Administrador, com aba por tipo de ação"
                    data={actionLogsMonthlySeries}
                    accent="emerald"
                    tabs={actionTypeTabs}
                />

                <MonthlyCountChart
                    title="Logs de Views Registados"
                    subtitle="Visualizações registadas (ex: page_view)"
                    data={viewLogsMonthlySeries}
                    accent="blue"
                />
            </section>
        </div>
    );
}
