const autorizacoes = [
    { id: 1, atleta: "Pedro Oliveira", tipo: "Participação em torneio", descricao: "Torneio Nacional Sub-18 — Lisboa, 20 Mar", solicitado: "05 Mar", estado: "Aprovado" },
    { id: 2, atleta: "Sofia Rodrigues", tipo: "Saída ao estrangeiro", descricao: "Torneio Internacional Sub-16 — Madrid, 28 Mar", solicitado: "06 Mar", estado: "Pendente" },
    { id: 3, atleta: "Beatriz Lima", tipo: "Participação em torneio", descricao: "Torneio Regional Sub-16 — Porto, 22 Mar", solicitado: "07 Mar", estado: "Pendente" },
    { id: 4, atleta: "João Silva", tipo: "Transferência", descricao: "Pedido de transferência para ABC Braga", solicitado: "01 Mar", estado: "Recusado" },
    { id: 5, atleta: "Tiago Martins", tipo: "Participação em torneio", descricao: "Torneio de Verão Sub-18 — Faro, 15 Jul", solicitado: "08 Mar", estado: "Aprovado" },
];

const estadoStyle: Record<string, string> = {
    "Aprovado": "bg-emerald-500/10 text-emerald-400",
    "Pendente": "bg-amber-500/10 text-amber-400",
    "Recusado": "bg-red-500/10 text-red-400",
};

export default function AutorizacoesPage() {
    const pendentes = autorizacoes.filter(a => a.estado === "Pendente");

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Autorizações</h1>
                <p className="text-sm text-slate-400 mt-1">{pendentes.length} pendente(s) por aprovar</p>
            </div>

            {pendentes.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-amber-400 text-lg">⏳</span>
                    <div>
                        <p className="text-amber-400 font-semibold text-sm">{pendentes.length} autorização(ões) aguardam a tua decisão</p>
                        <p className="text-slate-400 text-xs mt-1">Verifica as autorizações pendentes abaixo e aprova ou recusa.</p>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                            <th className="text-left px-6 py-4">Atleta</th>
                            <th className="text-left px-6 py-4">Tipo</th>
                            <th className="text-left px-6 py-4">Descrição</th>
                            <th className="text-left px-6 py-4">Solicitado</th>
                            <th className="text-left px-6 py-4">Estado</th>
                            <th className="text-left px-6 py-4">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {autorizacoes.map((a) => (
                            <tr key={a.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-white">{a.atleta}</td>
                                <td className="px-6 py-4 text-slate-400">{a.tipo}</td>
                                <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{a.descricao}</td>
                                <td className="px-6 py-4 text-slate-400">{a.solicitado}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[a.estado]}`}>
                                        {a.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {a.estado === "Pendente" && (
                                        <div className="flex items-center gap-2">
                                            <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium border border-emerald-500/30 px-2 py-1 rounded-lg transition-colors">
                                                Aprovar
                                            </button>
                                            <button className="text-xs text-red-400 hover:text-red-300 font-medium border border-red-500/30 px-2 py-1 rounded-lg transition-colors">
                                                Recusar
                                            </button>
                                        </div>
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
