const relatorios = [
    { id: 1, nome: "Relatório de Atletas — Época 2024/2025", descricao: "Lista completa de atletas, posições, equipas e estado.", icone: "👥", categoria: "Atletas" },
    { id: 2, nome: "Relatório de Mensalidades — Março 2025", descricao: "Estado de pagamentos de todos os atletas no mês corrente.", icone: "💶", categoria: "Financeiro" },
    { id: 3, nome: "Relatório de Assiduidade", descricao: "Taxa de presença nos treinos por atleta e por equipa.", icone: "📋", categoria: "Treinos" },
    { id: 4, nome: "Relatório de Resultados Desportivos", descricao: "Resumo de jogos, resultados e estatísticas da época.", icone: "🏆", categoria: "Desporto" },
    { id: 5, nome: "Relatório de Staff", descricao: "Lista de treinadores, funções e equipas associadas.", icone: "👨‍💼", categoria: "Staff" },
];

const categoriaStyle: Record<string, string> = {
    "Atletas": "bg-cyan-500/10 text-cyan-400",
    "Financeiro": "bg-emerald-500/10 text-emerald-400",
    "Treinos": "bg-amber-500/10 text-amber-400",
    "Desporto": "bg-violet-500/10 text-violet-400",
    "Staff": "bg-blue-500/10 text-blue-400",
};

export default function RelatoriosPage() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Exporta dados do clube em PDF ou Excel</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatorios.map((r) => (
                    <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-xl p-5 flex items-start gap-4 transition-colors group">
                        <span className="text-3xl">{r.icone}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.nome}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoriaStyle[r.categoria]}`}>
                                    {r.categoria}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.descricao}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <button className="text-xs text-violet-400 hover:text-violet-300 font-medium border border-violet-500/30 px-3 py-1.5 rounded-lg transition-colors">
                                    📄 Exportar PDF
                                </button>
                                <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors">
                                    📊 Exportar Excel
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
