const mensalidades = [
    { id: 1, atleta: "João Silva", equipa: "Seniores M", mes: "Março 2025", valor: 25, estado: "Pago", data_pagamento: "02 Mar" },
    { id: 2, atleta: "Miguel Santos", equipa: "Seniores M", mes: "Março 2025", valor: 25, estado: "Pago", data_pagamento: "01 Mar" },
    { id: 3, atleta: "Rui Ferreira", equipa: "Seniores M", mes: "Março 2025", valor: 25, estado: "Em Atraso", data_pagamento: null },
    { id: 4, atleta: "André Costa", equipa: "Seniores M", mes: "Março 2025", valor: 25, estado: "Em Atraso", data_pagamento: null },
    { id: 5, atleta: "Pedro Oliveira", equipa: "Sub-18 M", mes: "Março 2025", valor: 20, estado: "Pago", data_pagamento: "03 Mar" },
    { id: 6, atleta: "Tiago Martins", equipa: "Sub-18 M", mes: "Março 2025", valor: 20, estado: "Pendente", data_pagamento: null },
    { id: 7, atleta: "Sofia Rodrigues", equipa: "Sub-16 F", mes: "Março 2025", valor: 20, estado: "Pago", data_pagamento: "01 Mar" },
    { id: 8, atleta: "Beatriz Lima", equipa: "Sub-16 F", mes: "Março 2025", valor: 20, estado: "Pago", data_pagamento: "04 Mar" },
];

const estadoStyle: Record<string, string> = {
    "Pago": "bg-emerald-500/10 text-emerald-400",
    "Em Atraso": "bg-red-500/10 text-red-400",
    "Pendente": "bg-amber-500/10 text-amber-400",
};

export default function MensalidadesPage() {
    const emAtraso = mensalidades.filter(m => m.estado === "Em Atraso");
    const pago = mensalidades.filter(m => m.estado === "Pago");
    const totalRecebido = pago.reduce((acc, m) => acc + m.valor, 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mensalidades</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Março 2025 · Todos os escalões</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Recebido</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">€{totalRecebido}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pagos</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pago.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Em Atraso</p>
                    <p className="text-3xl font-bold text-red-400 mt-2">{emAtraso.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-amber-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pendentes</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{mensalidades.filter(m => m.estado === "Pendente").length}</p>
                </div>
            </div>

            {/* Alerta de atrasos */}
            {emAtraso.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-red-400 text-lg">⚠️</span>
                    <div>
                        <p className="text-red-400 font-semibold text-sm">{emAtraso.length} atleta(s) com mensalidade em atraso</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Podes suspender o acesso aos treinos e jogos alterando o estado do atleta.</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left px-6 py-4">Atleta</th>
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Mês</th>
                            <th className="text-left px-6 py-4">Valor</th>
                            <th className="text-left px-6 py-4">Data Pagamento</th>
                            <th className="text-left px-6 py-4">Estado</th>
                            <th className="text-left px-6 py-4">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mensalidades.map((m) => (
                            <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{m.atleta}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{m.equipa}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{m.mes}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">€{m.valor}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{m.data_pagamento ?? "—"}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[m.estado]}`}>
                                        {m.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {m.estado === "Em Atraso" && (
                                        <button className="text-xs text-red-400 hover:text-red-300 font-medium border border-red-500/30 px-2 py-1 rounded-lg transition-colors">
                                            Suspender atleta
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
