export default function EpocaAtualPage() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Época Atual</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">2024/2025 · Em curso</p>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Início</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-2">01 Set 2024</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fim</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">30 Jun 2025</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Meses Restantes</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">4 meses</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-violet-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado</p>
                    <p className="text-2xl font-bold text-violet-400 mt-2">Em curso</p>
                </div>
            </div>

            {/* Progresso da época */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">📅 Progresso da Época</h2>
                    <span className="text-sm font-bold text-violet-400">67%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full" style={{ width: "67%" }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>Set 2024</span>
                    <span>Jun 2025</span>
                </div>
            </div>

            {/* Fases da época */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">🗓️ Fases da Época</h2>
                <div className="space-y-3">
                    {[
                        { fase: "Pré-época", periodo: "Set 2024", estado: "Concluído" },
                        { fase: "Fase Regular", periodo: "Out 2024 – Abr 2025", estado: "Em curso" },
                        { fase: "Playoffs", periodo: "Mai 2025", estado: "Por iniciar" },
                        { fase: "Final Four", periodo: "Jun 2025", estado: "Por iniciar" },
                    ].map((f) => (
                        <div key={f.fase} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.fase}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.periodo}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                f.estado === "Concluído" ? "bg-emerald-500/10 text-emerald-400" :
                                f.estado === "Em curso" ? "bg-violet-500/10 text-violet-400" :
                                "bg-slate-500/10 text-gray-500 dark:text-gray-400"
                            }`}>
                                {f.estado}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
