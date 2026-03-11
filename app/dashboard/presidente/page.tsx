import {
    UserRound,
    Trophy,
    CalendarCheck,
    TrendingUp
} from "lucide-react";

// --- DADOS MOCK (substituir por queries reais amanhã) ---
const metricas = [
    { label: "Atletas Ativos", valor: "34", detalhe: "↑ 3 desde set.", cor: "text-cyan-400", borda: "border-cyan-500/30" },
    { label: "Treinos Realizados", valor: "47", detalhe: "Esta época", cor: "text-emerald-400", borda: "border-emerald-500/30" },
    { label: "Jogos", valor: "12", detalhe: "8V · 2E · 2D", cor: "text-gray-900 dark:text-white", borda: "border-gray-300 dark:border-slate-600" },
    { label: "Assiduidade Média", valor: "87%", detalhe: "Última semana", cor: "text-amber-400", borda: "border-amber-500/30" },
];

const ultimosJogos = [
    { data: "28 Fev", adversario: "FC Porto", resultado: "28-22", tipo: "V", local: "Casa" },
    { data: "21 Fev", adversario: "Benfica", resultado: "19-24", tipo: "D", local: "Fora" },
    { data: "14 Fev", adversario: "Braga", resultado: "25-25", tipo: "E", local: "Casa" },
    { data: "07 Fev", adversario: "ABC Braga", resultado: "31-18", tipo: "V", local: "Casa" },
];

const equipas = [
    { nome: "Seniores M", atletas: 18, treinos: "4x", estado: "Ativa" },
    { nome: "Sub-18 M", atletas: 16, treinos: "3x", estado: "Ativa" },
    { nome: "Sub-16 F", atletas: 14, treinos: "2x", estado: "Ativa" },
    { nome: "Sub-14 M", atletas: 12, treinos: "2x", estado: "Período Off" },
];

// --- HELPERS ---
const resultadoStyle: Record<string, string> = {
    V: "text-emerald-400 font-bold",
    D: "text-red-400 font-bold",
    E: "text-amber-400 font-bold",
};

const estadoStyle: Record<string, string> = {
    "Ativa": "bg-emerald-500/10 text-emerald-400",
    "Período Off": "bg-amber-500/10 text-amber-400",
};

export default function PresidenteDashboard() {
    return (
        <div className="p-6 space-y-6">

            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard do Clube</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Época 2024/2025 · Sporting CP Andebol</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg border border-gray-300 dark:border-gray-700 transition-colors">
                    📄 Relatório
                </button>
            </div>

            {/* Cards de métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricas.map((m) => (
                    <div
                        key={m.label}
                        className={`bg-white dark:bg-gray-900 border ${m.borda} rounded-xl p-5 space-y-2`}
                    >
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            {m.label}
                        </p>
                        <p className={`text-4xl font-bold ${m.cor}`}>{m.valor}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{m.detalhe}</p>
                    </div>
                ))}
            </div>

            {/* Tabelas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Últimos Jogos */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">🏆 Últimos Jogos</h2>
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
                            {ultimosJogos.map((j, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                    <td className="py-3 text-gray-500 dark:text-gray-400">{j.data}</td>
                                    <td className="py-3 text-gray-900 dark:text-white">{j.adversario}</td>
                                    <td className={`py-3 ${resultadoStyle[j.tipo]}`}>
                                        {j.resultado} {j.tipo}
                                    </td>
                                    <td className="py-3 text-gray-500 dark:text-gray-400">{j.local}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Equipas */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">📋 Equipas</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left pb-3">Equipa</th>
                                <th className="text-left pb-3">Atletas</th>
                                <th className="text-left pb-3">Treinos/Sem.</th>
                                <th className="text-left pb-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipas.map((e, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                    <td className="py-3 text-gray-900 dark:text-white">{e.nome}</td>
                                    <td className="py-3 text-gray-500 dark:text-gray-400">{e.atletas}</td>
                                    <td className="py-3 text-gray-500 dark:text-gray-400">{e.treinos}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[e.estado]}`}>
                                            {e.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
