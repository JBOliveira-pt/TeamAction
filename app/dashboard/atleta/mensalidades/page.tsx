import { fetchMensalidadesAtleta, fetchAtletaFederado } from "@/app/lib/data";
import { Receipt, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

const mesesNomes = [
    "",
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

export default async function AtletaMensalidadesPage() {
    const federado = await fetchAtletaFederado();

    if (!federado) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Mensalidades
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Estado de pagamentos da época atual.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 flex flex-col items-center gap-4 text-center">
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                        <ShieldAlert size={28} className="text-gray-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                            Ainda não estás federado
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            As mensalidades ficam disponíveis assim que fores
                            associado a um clube na plataforma.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const mensalidades = await fetchMensalidadesAtleta();

    const total = mensalidades.length;
    const pagas = mensalidades.filter((m) => m.estado === "pago").length;
    const pendentes = total - pagas;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Mensalidades
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Estado de pagamentos da época atual.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Total</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {total}
                    </span>
                    <span className="text-xs text-gray-400">mensalidades</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Pagas</span>
                    <span className="text-2xl font-bold text-emerald-500">
                        {pagas}
                    </span>
                    <span className="text-xs text-gray-400">em dia</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Pendentes</span>
                    <span
                        className={`text-2xl font-bold ${pendentes > 0 ? "text-amber-500" : "text-gray-900 dark:text-white"}`}
                    >
                        {pendentes}
                    </span>
                    <span className="text-xs text-gray-400">por pagar</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {mensalidades.length === 0 ? (
                    <div className="p-12 flex flex-col items-center gap-3 text-center">
                        <Receipt size={28} className="text-gray-300" />
                        <p className="text-sm text-gray-500">
                            Nenhuma mensalidade registada.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Mês
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Data pagamento
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {mensalidades.map((m) => (
                                <tr
                                    key={m.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                                        {mesesNomes[m.mes]} {m.ano}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                        {m.valor.toFixed(2).replace(".", ",")} €
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                        {m.data_pagamento
                                            ? new Date(
                                                  m.data_pagamento,
                                              ).toLocaleDateString("pt-PT")
                                            : "—"}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                m.estado === "pago"
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : m.estado === "atrasado"
                                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            }`}
                                        >
                                            {m.estado === "pago"
                                                ? "Pago"
                                                : m.estado === "atrasado"
                                                  ? "Atrasado"
                                                  : "Pendente"}
                                        </span>
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
