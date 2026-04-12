// Página de autorizacoes do presidente.
import { fetchAutorizacoes } from "@/app/lib/data";
import PedidoFederacaoModal from "./_components/PedidoFederacaoModal.client";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
    pendente: "bg-amber-500/10 text-amber-400",
    aprovado: "bg-emerald-500/10 text-emerald-400",
    recusado: "bg-red-500/10 text-red-400",
};

const statusLabel: Record<string, string> = {
    pendente: "Pendente",
    aprovado: "Aprovado",
    recusado: "Recusado",
};

const tipoContaLabel: Record<string, string> = {
    treinador: "Treinador",
    atleta: "Atleta",
    responsavel: "Responsável",
    presidente: "Presidente",
};

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

export default async function AutorizacoesPage() {
    const autorizacoes = await fetchAutorizacoes();

    const pendentes = autorizacoes.filter(
        (a) => a.status === "pendente",
    ).length;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Autorizações
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pedidos de federação recebidos de treinadores e atletas do
                    clube.
                </p>
            </div>

            {pendentes > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-sm text-amber-400 font-medium">
                        {pendentes} pedido{pendentes !== 1 ? "s" : ""} pendente
                        {pendentes !== 1 ? "s" : ""} de análise
                    </p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {autorizacoes.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            Nenhum pedido de federação recebido.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">
                                    Solicitante
                                </th>
                                <th className="text-left px-6 py-4">Função</th>
                                <th className="text-left px-6 py-4">Data</th>
                                <th className="text-left px-6 py-4">Estado</th>
                                <th className="text-left px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {autorizacoes.map((a) => (
                                <tr
                                    key={a.id}
                                    className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                        {a.solicitante_nome ??
                                            "Utilizador removido"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {tipoContaLabel[
                                            a.solicitante_tipo ?? ""
                                        ] ?? "—"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {formatData(a.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[a.status] ?? "bg-gray-500/10 text-gray-400"}`}
                                        >
                                            {statusLabel[a.status] ?? a.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <PedidoFederacaoModal pedido={a} />
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
