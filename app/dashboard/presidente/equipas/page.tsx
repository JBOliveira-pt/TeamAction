import Link from "next/link";

const equipas = [
    { id: 1, nome: "Seniores M", escalao: "Seniores", atletas: 18, treinador: "Carlos Ferreira", treinos: "4x/sem", estado: "Ativa" },
    { id: 2, nome: "Sub-18 M", escalao: "Sub-18", atletas: 16, treinador: "Pedro Sousa", treinos: "3x/sem", estado: "Ativa" },
    { id: 3, nome: "Sub-16 F", escalao: "Sub-16", atletas: 14, treinador: "Ana Martins", treinos: "2x/sem", estado: "Ativa" },
    { id: 4, nome: "Sub-14 M", escalao: "Sub-14", atletas: 12, treinador: "João Silva", treinos: "2x/sem", estado: "Período Off" },
    { id: 5, nome: "Sub-12 M", escalao: "Sub-12", atletas: 10, treinador: "Rui Costa", treinos: "2x/sem", estado: "Inativa" },
];

const estadoStyle: Record<string, string> = {
    "Ativa": "bg-emerald-500/10 text-emerald-400",
    "Período Off": "bg-amber-500/10 text-amber-400",
    "Inativa": "bg-red-500/10 text-red-400",
};

export default function EquipasPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Época 2024/2025 · {equipas.length} escalões</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Nova Equipa
                </button>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Equipas</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{equipas.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Equipas Ativas</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{equipas.filter(e => e.estado === "Ativa").length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Atletas</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{equipas.reduce((acc, e) => acc + e.atletas, 0)}</p>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Escalão</th>
                            <th className="text-left px-6 py-4">Treinador</th>
                            <th className="text-left px-6 py-4">Atletas</th>
                            <th className="text-left px-6 py-4">Treinos</th>
                            <th className="text-left px-6 py-4">Estado</th>
                            <th className="text-left px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {equipas.map((e, i) => (
                            <tr key={e.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{e.nome}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{e.escalao}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{e.treinador}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{e.atletas}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{e.treinos}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[e.estado]}`}>
                                        {e.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link href={`/dashboard/presidente/equipas/${e.id}`} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
    Ver equipa →
</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
