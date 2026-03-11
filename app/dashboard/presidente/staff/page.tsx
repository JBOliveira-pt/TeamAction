const staff = [
    { id: 1, nome: "Carlos Ferreira", funcao: "Treinador Principal", equipa: "Seniores M", email: "carlos@clube.pt", telefone: "912 345 678", estado: "Ativo" },
    { id: 2, nome: "Pedro Sousa", funcao: "Treinador Principal", equipa: "Sub-18 M", email: "pedro@clube.pt", telefone: "913 456 789", estado: "Ativo" },
    { id: 3, nome: "Ana Martins", funcao: "Treinadora Principal", equipa: "Sub-16 F", email: "ana@clube.pt", telefone: "914 567 890", estado: "Ativo" },
    { id: 4, nome: "João Silva", funcao: "Treinador Principal", equipa: "Sub-14 M", email: "joao@clube.pt", telefone: "915 678 901", estado: "Ativo" },
    { id: 5, nome: "Rui Costa", funcao: "Treinador Principal", equipa: "Sub-12 M", email: "rui@clube.pt", telefone: "916 789 012", estado: "Ativo" },
    { id: 6, nome: "Miguel Nunes", funcao: "Treinador Adjunto", equipa: "Seniores M", email: "miguel@clube.pt", telefone: "917 890 123", estado: "Ativo" },
    { id: 7, nome: "Luís Pereira", funcao: "Fisioterapeuta", equipa: "Todos", email: "luis@clube.pt", telefone: "918 901 234", estado: "Ativo" },
    { id: 8, nome: "Sofia Gomes", funcao: "Equipa Médica", equipa: "Todos", email: "sofia@clube.pt", telefone: "919 012 345", estado: "Inativo" },
];

const funcaoStyle: Record<string, string> = {
    "Treinador Principal": "bg-violet-500/10 text-violet-400",
    "Treinadora Principal": "bg-violet-500/10 text-violet-400",
    "Treinador Adjunto": "bg-blue-500/10 text-blue-400",
    "Fisioterapeuta": "bg-cyan-500/10 text-cyan-400",
    "Equipa Médica": "bg-emerald-500/10 text-emerald-400",
};

const estadoStyle: Record<string, string> = {
    "Ativo": "bg-emerald-500/10 text-emerald-400",
    "Inativo": "bg-red-500/10 text-red-400",
};

export default function StaffPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{staff.length} membros na equipa técnica</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Adicionar Membro
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Staff</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{staff.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-violet-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Treinadores</p>
                    <p className="text-3xl font-bold text-violet-400 mt-2">{staff.filter(s => s.funcao.includes("Treinador") || s.funcao.includes("Treinadora")).length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ativos</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{staff.filter(s => s.estado === "Ativo").length}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left px-6 py-4">Nome</th>
                            <th className="text-left px-6 py-4">Função</th>
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Email</th>
                            <th className="text-left px-6 py-4">Telefone</th>
                            <th className="text-left px-6 py-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map((s) => (
                            <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{s.nome}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${funcaoStyle[s.funcao] ?? "bg-slate-500/10 text-gray-500 dark:text-gray-400"}`}>
                                        {s.funcao}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{s.equipa}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{s.email}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{s.telefone}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[s.estado]}`}>
                                        {s.estado}
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
