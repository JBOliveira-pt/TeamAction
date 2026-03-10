const estatisticasPorEquipa = [
    { equipa: "Seniores M", jogos: 12, vitorias: 8, empates: 2, derrotas: 2, golos_marcados: 289, golos_sofridos: 198, assiduidade: 87 },
    { equipa: "Sub-18 M", jogos: 10, vitorias: 6, empates: 1, derrotas: 3, golos_marcados: 210, golos_sofridos: 175, assiduidade: 91 },
    { equipa: "Sub-16 F", jogos: 8, vitorias: 5, empates: 2, derrotas: 1, golos_marcados: 178, golos_sofridos: 145, assiduidade: 94 },
    { equipa: "Sub-14 M", jogos: 6, vitorias: 3, empates: 0, derrotas: 3, golos_marcados: 120, golos_sofridos: 130, assiduidade: 82 },
];

const topAtletas = [
    { nome: "João Silva", equipa: "Seniores M", golos: 48, assistencias: 22, assiduidade: 93 },
    { nome: "Miguel Santos", equipa: "Seniores M", golos: 35, assistencias: 30, assiduidade: 88 },
    { nome: "Sofia Rodrigues", equipa: "Sub-16 F", golos: 32, assistencias: 18, assiduidade: 91 },
    { nome: "Pedro Oliveira", equipa: "Sub-18 M", golos: 28, assistencias: 25, assiduidade: 95 },
    { nome: "Beatriz Lima", equipa: "Sub-16 F", golos: 24, assistencias: 15, assiduidade: 85 },
];

export default function EstatisticasPage() {
    const totalJogos = estatisticasPorEquipa.reduce((acc, e) => acc + e.jogos, 0);
    const totalVitorias = estatisticasPorEquipa.reduce((acc, e) => acc + e.vitorias, 0);
    const totalGolos = estatisticasPorEquipa.reduce((acc, e) => acc + e.golos_marcados, 0);
    const assiduidade = Math.round(estatisticasPorEquipa.reduce((acc, e) => acc + e.assiduidade, 0) / estatisticasPorEquipa.length);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Estatísticas</h1>
                <p className="text-sm text-slate-400 mt-1">Época 2024/2025 · Todos os escalões</p>
            </div>

            {/* Cards globais */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Jogos</p>
                    <p className="text-3xl font-bold text-white mt-2">{totalJogos}</p>
                </div>
                <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vitórias</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{totalVitorias}</p>
                </div>
                <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Golos Marcados</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{totalGolos}</p>
                </div>
                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assiduidade Média</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{assiduidade}%</p>
                </div>
            </div>

            {/* Tabela por equipa */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-white">📊 Por Equipa</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">J</th>
                            <th className="text-left px-6 py-4">V</th>
                            <th className="text-left px-6 py-4">E</th>
                            <th className="text-left px-6 py-4">D</th>
                            <th className="text-left px-6 py-4">GM</th>
                            <th className="text-left px-6 py-4">GS</th>
                            <th className="text-left px-6 py-4">Assiduidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estatisticasPorEquipa.map((e) => (
                            <tr key={e.equipa} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-white">{e.equipa}</td>
                                <td className="px-6 py-4 text-slate-400">{e.jogos}</td>
                                <td className="px-6 py-4 text-emerald-400 font-semibold">{e.vitorias}</td>
                                <td className="px-6 py-4 text-amber-400 font-semibold">{e.empates}</td>
                                <td className="px-6 py-4 text-red-400 font-semibold">{e.derrotas}</td>
                                <td className="px-6 py-4 text-cyan-400">{e.golos_marcados}</td>
                                <td className="px-6 py-4 text-slate-400">{e.golos_sofridos}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${e.assiduidade}%` }} />
                                        </div>
                                        <span className="text-slate-400 text-xs">{e.assiduidade}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Top atletas */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-white">🏅 Top 5 Atletas</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                            <th className="text-left px-6 py-4">#</th>
                            <th className="text-left px-6 py-4">Atleta</th>
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Golos</th>
                            <th className="text-left px-6 py-4">Assistências</th>
                            <th className="text-left px-6 py-4">Assiduidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topAtletas.map((a, i) => (
                            <tr key={a.nome} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-500 font-bold">#{i + 1}</td>
                                <td className="px-6 py-4 font-semibold text-white">{a.nome}</td>
                                <td className="px-6 py-4 text-slate-400">{a.equipa}</td>
                                <td className="px-6 py-4 text-cyan-400 font-semibold">{a.golos}</td>
                                <td className="px-6 py-4 text-violet-400 font-semibold">{a.assistencias}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${a.assiduidade}%` }} />
                                        </div>
                                        <span className="text-slate-400 text-xs">{a.assiduidade}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
