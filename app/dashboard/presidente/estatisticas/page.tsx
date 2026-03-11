import { fetchEstatisticasPorEquipa, fetchTopAtletas } from "@/app/lib/data";

export default async function EstatisticasPage() {
    const [estatisticasPorEquipa, topAtletas] = await Promise.all([
        fetchEstatisticasPorEquipa(),
        fetchTopAtletas(),
    ]);

    const totalJogos = estatisticasPorEquipa.reduce((acc, e) => acc + Number(e.jogos), 0);
    const totalVitorias = estatisticasPorEquipa.reduce((acc, e) => acc + Number(e.vitorias), 0);
    const totalGolos = estatisticasPorEquipa.reduce((acc, e) => acc + Number(e.golos_marcados), 0);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estatísticas</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Época 2024/2025 · Todos os escalões</p>
            </div>

            {/* Cards globais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Jogos</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalJogos}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vitórias</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{totalVitorias}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Golos Marcados</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{totalGolos}</p>
                </div>
            </div>

            {/* Tabela por equipa */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">📊 Por Equipa</h2>
                </div>
                {estatisticasPorEquipa.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhuma estatística disponível ainda.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4">J</th>
                                <th className="text-left px-6 py-4">V</th>
                                <th className="text-left px-6 py-4">E</th>
                                <th className="text-left px-6 py-4">D</th>
                                <th className="text-left px-6 py-4">GM</th>
                                <th className="text-left px-6 py-4">GS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estatisticasPorEquipa.map((e) => (
                                <tr key={e.equipa_id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{e.equipa}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{Number(e.jogos)}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-semibold">{Number(e.vitorias)}</td>
                                    <td className="px-6 py-4 text-amber-400 font-semibold">{Number(e.empates)}</td>
                                    <td className="px-6 py-4 text-red-400 font-semibold">{Number(e.derrotas)}</td>
                                    <td className="px-6 py-4 text-cyan-400">{Number(e.golos_marcados)}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{Number(e.golos_sofridos)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Top atletas */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">🏅 Top 5 Atletas</h2>
                </div>
                {topAtletas.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhuma estatística de atleta disponível ainda.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">#</th>
                                <th className="text-left px-6 py-4">Atleta</th>
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4">Golos</th>
                                <th className="text-left px-6 py-4">Assistências</th>
                                <th className="text-left px-6 py-4">Assiduidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topAtletas.map((a, i) => {
                                const totalTreinos = Number(a.total_treinos);
                                const presencas = Number(a.presencas);
                                const perc = totalTreinos > 0 ? Math.round((presencas / totalTreinos) * 100) : 0;
                                return (
                                    <tr key={a.atleta_id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-bold">#{i + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{a.nome}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{a.equipa_nome ?? "—"}</td>
                                        <td className="px-6 py-4 text-cyan-400 font-semibold">{Number(a.golos)}</td>
                                        <td className="px-6 py-4 text-violet-400 font-semibold">{Number(a.assistencias)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${perc}%` }} />
                                                </div>
                                                <span className="text-gray-500 dark:text-gray-400 text-xs">{perc}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

