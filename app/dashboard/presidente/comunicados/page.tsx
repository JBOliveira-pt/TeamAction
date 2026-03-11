const comunicados = [
    { id: 1, titulo: "Convocatória — Seniores M vs FC Porto", equipa: "Seniores M", data: "10 Mar 2025", tipo: "Convocatória" },
    { id: 2, titulo: "Alteração de horário — treino de 12 Mar", equipa: "Todos", data: "09 Mar 2025", tipo: "Aviso" },
    { id: 3, titulo: "Resultados — Jornada 8", equipa: "Todos", data: "03 Mar 2025", tipo: "Resultados" },
    { id: 4, titulo: "Reunião de pais — Sub-14 M", equipa: "Sub-14 M", data: "28 Fev 2025", tipo: "Reunião" },
];

const tipoStyle: Record<string, string> = {
    "Convocatória": "bg-cyan-500/10 text-cyan-400",
    "Aviso": "bg-amber-500/10 text-amber-400",
    "Resultados": "bg-emerald-500/10 text-emerald-400",
    "Reunião": "bg-violet-500/10 text-violet-400",
};

export default function ComunicadosPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Comunicados</h1>
                    <p className="text-sm text-slate-400 mt-1">{comunicados.length} comunicados enviados</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Novo Comunicado
                </button>
            </div>

            {/* Formulário novo comunicado */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-white">✉️ Enviar Comunicado</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Título</label>
                        <input
                            type="text"
                            placeholder="Ex: Convocatória para jogo..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Destinatário</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors">
                            <option>Todos</option>
                            <option>Seniores M</option>
                            <option>Sub-18 M</option>
                            <option>Sub-16 F</option>
                            <option>Sub-14 M</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Mensagem</label>
                    <textarea
                        rows={4}
                        placeholder="Escreve aqui a mensagem..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                    />
                </div>
                <div className="flex justify-end">
                    <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        Enviar Comunicado
                    </button>
                </div>
            </div>

            {/* Lista de comunicados */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-white">📋 Histórico</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                            <th className="text-left px-6 py-4">Título</th>
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Data</th>
                            <th className="text-left px-6 py-4">Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comunicados.map((c) => (
                            <tr key={c.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-white">{c.titulo}</td>
                                <td className="px-6 py-4 text-slate-400">{c.equipa}</td>
                                <td className="px-6 py-4 text-slate-400">{c.data}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoStyle[c.tipo]}`}>
                                        {c.tipo}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
