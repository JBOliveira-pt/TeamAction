import { fetchAutorizacoes } from "@/app/lib/data";
import AutorizacaoForm from "./_components/AutorizacaoForm";

const tipoStyle: Record<string, string> = {
    "Aprovação":    "bg-emerald-500/10 text-emerald-400",
    "Recusa":       "bg-red-500/10 text-red-400",
    "Transferência":"bg-blue-500/10 text-blue-400",
    "Suspensão":    "bg-amber-500/10 text-amber-400",
    "Outro":        "bg-gray-500/10 text-gray-400",
};

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit", month: "short", year: "numeric",
    });

export default async function AutorizacoesPage() {
    const autorizacoes = await fetchAutorizacoes();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Autorizações</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {autorizacoes.length} registo{autorizacoes.length !== 1 ? "s" : ""} de autorização
                </p>
            </div>

            {/* Formulário */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Registar Autorização</h2>
                <AutorizacaoForm />
            </div>

            {/* Lista */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {autorizacoes.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma autorização registada.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">Autorizado a</th>
                                <th className="text-left px-6 py-4">Tipo de Ação</th>
                                <th className="text-left px-6 py-4">Notas</th>
                                <th className="text-left px-6 py-4">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {autorizacoes.map((a) => (
                                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                        {a.autorizado_a}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoStyle[a.tipo_acao] ?? "bg-gray-500/10 text-gray-400"}`}>
                                            {a.tipo_acao}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {a.notas ?? "—"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {formatData(a.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}



