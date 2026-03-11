import Link from "next/link";


const atletas = [
    { id: 1, nome: "João Silva", posicao: "Pivot", numero: 9, equipa: "Seniores M", estado: "Ativo", assiduidade: 93, mensalidade: "Pago" },
    { id: 2, nome: "Miguel Santos", posicao: "Lateral Direito", numero: 7, equipa: "Seniores M", estado: "Ativo", assiduidade: 88, mensalidade: "Pago" },
    { id: 3, nome: "Rui Ferreira", posicao: "Guarda-Redes", numero: 1, equipa: "Seniores M", estado: "Ativo", assiduidade: 100, mensalidade: "Em Atraso" },
    { id: 4, nome: "André Costa", posicao: "Extremo Esquerdo", numero: 11, equipa: "Seniores M", estado: "Suspenso", assiduidade: 60, mensalidade: "Em Atraso" },
    { id: 5, nome: "Pedro Oliveira", posicao: "Central", numero: 5, equipa: "Sub-18 M", estado: "Ativo", assiduidade: 95, mensalidade: "Pago" },
    { id: 6, nome: "Tiago Martins", posicao: "Lateral Esquerdo", numero: 6, equipa: "Sub-18 M", estado: "Ativo", assiduidade: 78, mensalidade: "Pendente" },
    { id: 7, nome: "Sofia Rodrigues", posicao: "Pivot", numero: 14, equipa: "Sub-16 F", estado: "Ativo", assiduidade: 91, mensalidade: "Pago" },
    { id: 8, nome: "Beatriz Lima", posicao: "Extremo Direito", numero: 10, equipa: "Sub-16 F", estado: "Ativo", assiduidade: 85, mensalidade: "Pago" },
];

const estadoStyle: Record<string, string> = {
    "Ativo": "bg-emerald-500/10 text-emerald-400",
    "Suspenso": "bg-red-500/10 text-red-400",
    "Inativo": "bg-slate-500/10 text-gray-500 dark:text-gray-400",
};

const mensalidadeStyle: Record<string, string> = {
    "Pago": "text-emerald-400",
    "Em Atraso": "text-red-400",
    "Pendente": "text-amber-400",
};

export default function AtletasPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atletas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{atletas.length} atletas registados</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Adicionar Atleta
                </button>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{atletas.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ativos</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{atletas.filter(a => a.estado === "Ativo").length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Suspensos</p>
                    <p className="text-3xl font-bold text-red-400 mt-2">{atletas.filter(a => a.estado === "Suspenso").length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-amber-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Mensalidades em Atraso</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{atletas.filter(a => a.mensalidade === "Em Atraso").length}</p>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left px-6 py-4">Atleta</th>
                            <th className="text-left px-6 py-4">Nº</th>
                            <th className="text-left px-6 py-4">Posição</th>
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Assiduidade</th>
                            <th className="text-left px-6 py-4">Mensalidade</th>
                            <th className="text-left px-6 py-4">Estado</th>
                            <th className="text-left px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {atletas.map((a) => (
                            <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{a.nome}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">#{a.numero}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{a.posicao}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{a.equipa}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-400 rounded-full"
                                                style={{ width: `${a.assiduidade}%` }}
                                            />
                                        </div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs">{a.assiduidade}%</span>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 font-medium ${mensalidadeStyle[a.mensalidade]}`}>
                                    {a.mensalidade}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[a.estado]}`}>
                                        {a.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link href={`/dashboard/presidente/atletas/${a.id}`} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
    Ver perfil →
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
