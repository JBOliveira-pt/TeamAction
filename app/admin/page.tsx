import {
    fetchAdminLogsMonthlySeries,
    fetchAdminOverviewStats,
    fetchAdminUsersMonthlySeries,
} from "@/app/lib/admin-data";
import { MonthlyCountChart } from "@/app/ui/admin/monthly-count-chart";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
    const [stats, usersMonthlySeries, logsMonthlySeries] = await Promise.all([
        fetchAdminOverviewStats(),
        fetchAdminUsersMonthlySeries(),
        fetchAdminLogsMonthlySeries(),
    ]);

    const cards = [
        { label: "Total de Users", value: stats.users },
        { label: "Logs Registados", value: stats.logs },
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

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    subtitle="Inscrições mensais na plataforma (todos os perfis)."
                    data={usersMonthlySeries}
                    accent="blue"
                />

                <MonthlyCountChart
                    title="Logs de Ações Registados"
                    subtitle="Ações de todos os users, incluindo o Administrador."
                    data={logsMonthlySeries}
                    accent="emerald"
                />
            </section>
        </div>
    );
}
