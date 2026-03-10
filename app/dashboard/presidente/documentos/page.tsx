const documentos = [
    { id: 1, nome: "Regulamento Interno 2024/2025", tipo: "PDF", tamanho: "1.2 MB", data: "01 Set 2024", categoria: "Regulamentos" },
    { id: 2, nome: "Lista de Atletas Inscritos", tipo: "XLSX", tamanho: "245 KB", data: "05 Set 2024", categoria: "Atletas" },
    { id: 3, nome: "Calendário de Competições", tipo: "PDF", tamanho: "890 KB", data: "10 Set 2024", categoria: "Competição" },
    { id: 4, nome: "Atas da Reunião de Direção", tipo: "PDF", tamanho: "560 KB", data: "15 Out 2024", categoria: "Gestão" },
    { id: 5, nome: "Apólice de Seguro Desportivo", tipo: "PDF", tamanho: "2.1 MB", data: "01 Set 2024", categoria: "Seguros" },
];

const categoriaStyle: Record<string, string> = {
    "Regulamentos": "bg-violet-500/10 text-violet-400",
    "Atletas": "bg-cyan-500/10 text-cyan-400",
    "Competição": "bg-emerald-500/10 text-emerald-400",
    "Gestão": "bg-amber-500/10 text-amber-400",
    "Seguros": "bg-blue-500/10 text-blue-400",
};

const tipoIcon: Record<string, string> = {
    "PDF": "📄",
    "XLSX": "📊",
    "DOCX": "📝",
};

export default function DocumentosPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Documentos</h1>
                    <p className="text-sm text-slate-400 mt-1">{documentos.length} documentos guardados</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Carregar Documento
                </button>
            </div>

            {/* Área de upload */}
            <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center gap-3 hover:border-violet-500/50 transition-colors cursor-pointer">
                <span className="text-4xl">📂</span>
                <p className="text-sm font-semibold text-white">Arrasta ficheiros para aqui</p>
                <p className="text-xs text-slate-500">PDF, XLSX, DOCX · máx. 10MB</p>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors">
                    Ou escolhe um ficheiro
                </button>
            </div>

            {/* Lista de documentos */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                            <th className="text-left px-6 py-4">Documento</th>
                            <th className="text-left px-6 py-4">Categoria</th>
                            <th className="text-left px-6 py-4">Tamanho</th>
                            <th className="text-left px-6 py-4">Data</th>
                            <th className="text-left px-6 py-4">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documentos.map((d) => (
                            <tr key={d.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span>{tipoIcon[d.tipo] ?? "📄"}</span>
                                        <div>
                                            <p className="font-semibold text-white">{d.nome}</p>
                                            <p className="text-xs text-slate-500">{d.tipo}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoriaStyle[d.categoria]}`}>
                                        {d.categoria}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{d.tamanho}</td>
                                <td className="px-6 py-4 text-slate-400">{d.data}</td>
                                <td className="px-6 py-4">
                                    <button className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                        Descarregar ↓
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
