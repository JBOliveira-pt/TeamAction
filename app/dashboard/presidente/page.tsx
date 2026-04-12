// Dashboard principal do presidente: equipas, jogos, notificações e resumo geral.
import Link from "next/link";
import {
    fetchPresidenteDashboard,
    fetchUltimosJogos,
    fetchProximosJogos,
    fetchEquipas,
    fetchNotificacoes,
} from "@/app/lib/data";

export const dynamic = "force-dynamic";

const resultadoStyle: Record<string, string> = {
    V: "text-emerald-400 font-bold",
    D: "text-red-400 font-bold",
    E: "text-amber-400 font-bold",
};

const estadoStyle: Record<string, string> = {
    ativa: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    inativa: "bg-red-500/10 text-red-400 border border-red-500/20",
    periodo_off: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

const tipoNotificacaoIcon: Record<string, string> = {
    convite: "📩",
    pagamento: "💰",
    jogo: "⚽",
    suspensao: "🚫",
    sistema: "⚙️",
    aviso: "⚠️",
};

function tempoRelativo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `há ${mins}min`;
    if (hours < 24) return `há ${hours}h`;
    return `há ${days}d`;
}

export default async function PresidenteDashboard() {
    const [dashboard, ultimosJogos, proximosJogos, equipas, notificacoes] =
        await Promise.all([
            fetchPresidenteDashboard().catch(() => ({
                totalEquipas: 0,
                totalAtletas: 0,
                jogosAgendados: 0,
                mensalidadesEmAtraso: 0,
                epocaNome: null as string | null,
                presidenteNome: null as string | null,
            })),
            fetchUltimosJogos().catch(() => []),
            fetchProximosJogos().catch(() => []),
            fetchEquipas().catch(() => []),
            fetchNotificacoes().catch(() => []),
        ]);

    const presidenteNome = dashboard.presidenteNome?.trim() || "Presidente";

    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    const metricas = [
        {
            label: "Total de Atletas",
            valor: String(dashboard.totalAtletas),
            detalhe: `${dashboard.totalEquipas} equipas`,
            cor: "text-cyan-400",
            borda: "border-cyan-500/30",
            bg: "bg-cyan-500/5",
            icon: "👥",
        },
        {
            label: "Equipas",
            valor: String(dashboard.totalEquipas),
            detalhe: "Esta época",
            cor: "text-emerald-400",
            borda: "border-emerald-500/30",
            bg: "bg-emerald-500/5",
            icon: "🏅",
        },
        {
            label: "Jogos Agendados",
            valor: String(dashboard.jogosAgendados),
            detalhe: "Próximos jogos",
            cor: "text-blue-400",
            borda: "border-blue-500/30",
            bg: "bg-blue-500/5",
            icon: "📅",
        },
        {
            label: "Mensalidades em Atraso",
            valor: String(dashboard.mensalidadesEmAtraso),
            detalhe: "Mês atual",
            cor: "text-amber-400",
            borda: "border-amber-500/30",
            bg: "bg-amber-500/5",
            icon: "💶",
        },
    ];

    const atalhos = [
        {
            label: "Convidar Atleta",
            href: "/dashboard/presidente/atletas?new=true", // ✅
            icon: "➕",
        },
        {
            label: "Agendar Jogo",
            href: "/dashboard/presidente/jogos?new=true", // ✅ já implementado
            icon: "⚽",
        },
        {
            label: "Nova Equipa",
            href: "/dashboard/presidente/equipas?new=true", // ✅
            icon: "🏅",
        },
        {
            label: "Relatórios",
            href: "/dashboard/presidente/relatorios", // sem alteração
            icon: "📄",
        },
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Bem-vindo, {presidenteNome} 👋
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {dashboard.epocaNome
                            ? `${dashboard.epocaNome} · ${new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}`
                            : "Sem época ativa"}
                    </p>
                </div>

                {/* Atalhos rápidos */}
                <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
                    {atalhos.map((a) => (
                        <Link
                            key={a.href}
                            href={a.href}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                        >
                            <span>{a.icon}</span>
                            {a.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Cards de métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metricas.map((m) => (
                    <div
                        key={m.label}
                        className={`${m.bg} border ${m.borda} rounded-xl p-5 space-y-2`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-snug">
                                {m.label}
                            </p>
                            <span className="text-lg">{m.icon}</span>
                        </div>
                        <p className={`text-4xl font-bold ${m.cor}`}>
                            {m.valor}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {m.detalhe}
                        </p>
                    </div>
                ))}
            </div>

            {/* Linha principal: Jogos + Notificações + Equipas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Últimos + Próximos Jogos — ocupa 2/3 */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Últimos Jogos */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            🏆 Últimos Jogos
                        </h2>
                        {ultimosJogos.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                                Nenhum jogo realizado ainda.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {ultimosJogos.map((j) => {
                                    const tipo =
                                        j.resultado_nos != null &&
                                        j.resultado_adv != null
                                            ? j.resultado_nos > j.resultado_adv
                                                ? "V"
                                                : j.resultado_nos <
                                                    j.resultado_adv
                                                  ? "D"
                                                  : "E"
                                            : null;
                                    return (
                                        <div
                                            key={j.id}
                                            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {j.adversario}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(
                                                        j.data,
                                                    ).toLocaleDateString(
                                                        "pt-PT",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                        },
                                                    )}{" "}
                                                    · {j.casa_fora}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-sm ${tipo ? resultadoStyle[tipo] : "text-gray-400"}`}
                                            >
                                                {j.resultado_nos != null
                                                    ? `${j.resultado_nos}–${j.resultado_adv}`
                                                    : "—"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Próximos Jogos */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            📅 Próximos Jogos
                        </h2>
                        {proximosJogos.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                                Nenhum jogo agendado.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {proximosJogos.map((j) => (
                                    <div
                                        key={j.id}
                                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {j.adversario}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {new Date(
                                                    j.data,
                                                ).toLocaleDateString("pt-PT", {
                                                    day: "2-digit",
                                                    month: "short",
                                                })}{" "}
                                                · {j.local ?? "Local TBD"}
                                            </p>
                                        </div>
                                        <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full capitalize">
                                            {j.casa_fora}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Equipas */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            📋 Equipas
                        </h2>
                        <Link
                            href="/dashboard/presidente/equipas"
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                            Ver todas →
                        </Link>
                    </div>
                    {equipas.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                            Nenhuma equipa registada ainda.
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                    <th className="text-left pb-3">Equipa</th>
                                    <th className="text-left pb-3">Atletas</th>
                                    <th className="text-left pb-3">
                                        Treinador
                                    </th>
                                    <th className="text-left pb-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipas.map((e) => (
                                    <tr
                                        key={e.id}
                                        className="border-b border-gray-100 dark:border-gray-800/50 last:border-0"
                                    >
                                        <td className="py-3 font-medium text-gray-900 dark:text-white">
                                            {e.nome}
                                        </td>
                                        <td className="py-3 text-gray-500 dark:text-gray-400">
                                            {Number(e.total_atletas)}
                                        </td>
                                        <td className="py-3 text-gray-500 dark:text-gray-400">
                                            {e.nome_treinador ?? "—"}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[e.estado] ?? "bg-slate-500/10 text-slate-400 border border-slate-500/20"}`}
                                            >
                                                {e.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
