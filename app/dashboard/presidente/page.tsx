import Link from "next/link";
import {
    fetchPresidenteDashboard,
    fetchUltimosJogos,
    fetchProximosJogos,
    fetchEquipas,
} from "@/app/lib/data";

export const dynamic = 'force-dynamic';

const resultadoStyle: Record<string, string> = {
    V: "text-emerald-400 font-bold",
    D: "text-red-400 font-bold",
    E: "text-amber-400 font-bold",
};

const estadoStyle: Record<string, string> = {
    ativa:       "bg-emerald-500/10 text-emerald-400",
    inativa:     "bg-red-500/10 text-red-400",
    periodo_off: "bg-amber-500/10 text-amber-400",
};

export default async function PresidenteDashboard() {
    const [dashboard, ultimosJogos, proximosJogos, equipas] = await Promise.all([
        fetchPresidenteDashboard(),
        fetchUltimosJogos(),
        fetchProximosJogos(),
        fetchEquipas(),
    ]);

    const metricas = [
        {
            label: "Total de Atletas",
            valor: String(dashboard.totalAtletas),
            detalhe: `${dashboard.totalEquipas} equipas`,
            cor: "text-cyan-400",
            borda: "border-cyan-500/30",
        },
        {
            label: "Equipas",
            valor: String(dashboard.totalEquipas),
            detalhe: "Esta época",
            cor: "text-emerald-400",
            borda: "border-emerald-500/30",
        },
        {
            label: "Jogos Agendados",
            valor: String(dashboard.jogosAgendados),
            detalhe: "Próximos jogos",
            cor: "text-white",
            borda: "border-slate-600",
        },
        {
            label: "Mensalidades em Atraso",
            valor: String(dashboard.mensalidadesEmAtraso),
            detalhe: "Mês atual",
            cor: "text-amber-400",
            borda: "border-amber-500/30",
        },
    ];

    return (
        <div className="p-6 space-y-6">

            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard do Clube</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {dashboard.epocaNome ? `Época ${dashboard.epocaNome}` : "Sem época ativa"}
                    </p>
                </div>
                <Link
                    href="/dashboard/presidente/relatorios"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg border border-gray-300 dark:border-gray-700 transition-colors"
                >
                    📄 Relatórios
                </Link>
            </div>

            {/* Cards de métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricas.map((m) => (
                    <div key={m.label} className={`bg-white dark:bg-gray-900 border ${m.borda} rounded-xl p-5 space-y-2`}>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{m.label}</p>
                        <p className={`text-4xl font-bold ${m.cor}`}>{m.valor}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{m.detalhe}</p>
                    </div>
                ))}
            </div>

            {/* Jogos — linha com 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Últimos Jogos */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">🏆 Últimos Jogos</h2>
                    {ultimosJogos.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Nenhum jogo realizado ainda.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                    <th className="text-left pb-3">Data</th>
                                    <th className="text-left pb-3">Adversário</th>
                                    <th className="text-left pb-3">Resultado</th>
                                    <th className="text-left pb-3">Local</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ultimosJogos.map((j) => {
                                    const tipo =
                                        j.resultado_nos != null && j.resultado_adv != null
                                            ? j.resultado_nos > j.resultado_adv ? "V"
                                            : j.resultado_nos < j.resultado_adv ? "D"
                                            : "E"
                                            : null;
                                    return (
                                        <tr key={j.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                            <td className="py-3 text-gray-500 dark:text-gray-400">
                                                {new Date(j.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                                            </td>
                                            <td className="py-3 text-gray-900 dark:text-white">{j.adversario}</td>
                                            <td className={`py-3 ${tipo ? resultadoStyle[tipo] : "text-gray-400"}`}>
                                                {j.resultado_nos != null ? `${j.resultado_nos}-${j.resultado_adv} ${tipo}` : "—"}
                                            </td>
                                            <td className="py-3 text-gray-500 dark:text-gray-400 capitalize">{j.casa_fora}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Próximos Jogos */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">📅 Próximos Jogos</h2>
                    {proximosJogos.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Nenhum jogo agendado.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                    <th className="text-left pb-3">Data</th>
                                    <th className="text-left pb-3">Adversário</th>
                                    <th className="text-left pb-3">Local</th>
                                    <th className="text-left pb-3">Campo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proximosJogos.map((j) => (
                                    <tr key={j.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                        <td className="py-3 text-gray-500 dark:text-gray-400">
                                            {new Date(j.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                                        </td>
                                        <td className="py-3 text-gray-900 dark:text-white">{j.adversario}</td>
                                        <td className="py-3 text-gray-500 dark:text-gray-400 capitalize">{j.casa_fora}</td>
                                        <td className="py-3 text-gray-500 dark:text-gray-400">{j.local ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Equipas */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">📋 Equipas</h2>
                {equipas.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Nenhuma equipa registada ainda.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left pb-3">Equipa</th>
                                <th className="text-left pb-3">Atletas</th>
                                <th className="text-left pb-3">Treinador</th>
                                <th className="text-left pb-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipas.map((e) => (
                                <tr key={e.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                    <td className="py-3 text-gray-900 dark:text-white">{e.nome}</td>
                                    <td className="py-3 text-gray-500 dark:text-gray-400">{Number(e.total_atletas)}</td>
                                    <td className="py-3 text-gray-500 dark:text-gray-400">{e.nome_treinador ?? "—"}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[e.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
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
    );
}

