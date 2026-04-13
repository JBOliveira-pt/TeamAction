// Página principal do painel de administração.
import {
    fetchAdminActionLogsMonthlySeries,
    fetchAdminActionTypeMonthlySeries,
    fetchAdminOverviewStats,
    fetchAdminUsersMonthlySeries,
    fetchAdminUsersAccountTypeMonthlySeries,
    fetchAdminViewLogsMonthlySeries,
} from "@/app/lib/admin-data";
import { MonthlyCountChart } from "@/app/ui/admin/monthly-count-chart";
import { Users, ClipboardList, BellOff, Activity, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

const cardConfig = [
    {
        key: "users",
        label: "Users",
        icon: Users,
        bg: "bg-blue-50 dark:bg-blue-950/40",
        iconBg: "bg-blue-100 dark:bg-blue-900/60",
        iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
        key: "pendingPlans",
        label: "Planos Pendentes",
        icon: ClipboardList,
        bg: "bg-amber-50 dark:bg-amber-950/40",
        iconBg: "bg-amber-100 dark:bg-amber-900/60",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
        key: "avisosNaoLidos",
        label: "Avisos N/ Lidos",
        icon: BellOff,
        bg: "bg-rose-50 dark:bg-rose-950/40",
        iconBg: "bg-rose-100 dark:bg-rose-900/60",
        iconColor: "text-rose-600 dark:text-rose-400",
    },
    {
        key: "actionLogs",
        label: "Logs Ações",
        icon: Activity,
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
        iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
        key: "viewLogs",
        label: "Logs Views",
        icon: Eye,
        bg: "bg-cyan-50 dark:bg-cyan-950/40",
        iconBg: "bg-cyan-100 dark:bg-cyan-900/60",
        iconColor: "text-cyan-600 dark:text-cyan-400",
    },
] as const;

export default async function AdminOverviewPage() {
    const [
        stats,
        usersMonthlySeries,
        usersAccountTypeSeries,
        actionLogsMonthlySeries,
        viewLogsMonthlySeries,
        actionTypeSeries,
    ] = await Promise.all([
        fetchAdminOverviewStats(),
        fetchAdminUsersMonthlySeries(),
        fetchAdminUsersAccountTypeMonthlySeries(),
        fetchAdminActionLogsMonthlySeries(),
        fetchAdminViewLogsMonthlySeries(),
        fetchAdminActionTypeMonthlySeries(),
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

    const statsRecord = stats as Record<string, number>;

    return (
        <div className="space-y-5">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Painel de Controlo
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Gestão central de utilizadores, auditoria e comunicação.
                </p>
            </header>

            {/* Cards resumo — todos numa linha */}
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {cardConfig.map((c) => {
                    const Icon = c.icon;
                    return (
                        <article
                            key={c.key}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${c.bg}`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.iconBg}`}
                            >
                                <Icon className={`h-4 w-4 ${c.iconColor}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    {c.label}
                                </p>
                                <p className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
                                    {statsRecord[c.key] ?? 0}
                                </p>
                            </div>
                        </article>
                    );
                })}
            </section>

            {/* Gráficos — 3 em linha no estado padrão (3M) */}
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <MonthlyCountChart
                    title="Novos Users"
                    subtitle="Inscrições mensais (todos os perfis)"
                    data={usersMonthlySeries}
                    accent="blue"
                    tabs={userTypeTabs}
                />

                <MonthlyCountChart
                    title="Logs de Ações"
                    subtitle="Ações registadas, com aba por tipo"
                    data={actionLogsMonthlySeries}
                    accent="emerald"
                    tabs={actionTypeTabs}
                />

                <MonthlyCountChart
                    title="Logs de Views"
                    subtitle="Visualizações registadas (page_view)"
                    data={viewLogsMonthlySeries}
                    accent="blue"
                />
            </section>
        </div>
    );
}
