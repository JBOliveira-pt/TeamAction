import { fetchMensalidades, fetchAtletas } from "@/app/lib/data";
import SuspenderAtletaButton from "./_components/SuspenderAtletaButton.client";
import RegistarMensalidadeModal from "./_components/RegistarMensalidadeModal.client";

export const dynamic = 'force-dynamic';

const estadoStyle: Record<string, string> = {
    "pago":      "bg-emerald-500/10 text-emerald-400",
    "em_atraso": "bg-red-500/10 text-red-400",
    "pendente":  "bg-amber-500/10 text-amber-400",
};

const estadoLabel: Record<string, string> = {
    "pago":      "Pago",
    "em_atraso": "Em Atraso",
    "pendente":  "Pendente",
};

const mesesNomes: Record<number, string> = {
    1: "Janeiro",  2: "Fevereiro", 3: "Março",    4: "Abril",
    5: "Maio",     6: "Junho",     7: "Julho",     8: "Agosto",
    9: "Setembro", 10: "Outubro",  11: "Novembro", 12: "Dezembro",
};

export default async function MensalidadesPage() {
    const [mensalidades, atletas] = await Promise.all([
        fetchMensalidades(),
        fetchAtletas(),
    ]);

    const emAtraso      = mensalidades.filter(m => m.estado === "em_atraso");
    const pagas         = mensalidades.filter(m => m.estado === "pago");
    const pendentes     = mensalidades.filter(m => m.estado === "pendente");
    const totalRecebido = pagas.reduce((acc, m) => acc + Number(m.valor ?? 0), 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mensalidades</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Todos os escalões</p>
                </div>
                <RegistarMensalidadeModal
                    atletas={atletas.map(a => ({
                        id: a.id,
                        nome: a.nome,
                        equipa_nome: a.equipa_nome ?? null,
                    }))}
                />
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Recebido</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">€{totalRecebido.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pagos</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pagas.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Em Atraso</p>
                    <p className="text-3xl font-bold text-red-400 mt-2">{emAtraso.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-amber-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pendentes</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{pendentes.length}</p>
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

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {mensalidades.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
                        Nenhuma mensalidade registada ainda.
                    </p>
                ) : (
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
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{m.atleta_nome}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{m.equipa_nome ?? "—"}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {mesesNomes[m.mes]} {m.ano}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {m.valor != null ? `€${Number(m.valor).toFixed(2)}` : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {m.data_pagamento
                                            ? new Date(m.data_pagamento).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[m.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                                            {estadoLabel[m.estado] ?? m.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {m.estado === "em_atraso" && (
                                            <SuspenderAtletaButton atletaId={m.atleta_id} />
                                        )}
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


