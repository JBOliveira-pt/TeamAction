// Componente table.
import { fetchFilteredRecibos, ReciboFilters } from "@/app/lib/receipts-data";
import { formatCurrencyPTBR } from "@/app/lib/utils";
import ReciboStatus from "@/app/ui/receipts/status";
import { ReciboActions } from "@/app/ui/receipts/buttons";

const MESES_NOMES: Record<number, string> = {
    1: "Janeiro", 2: "Fevereiro", 3: "Marco", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
};

export default async function RecibosTable({
    filters,
    currentPage,
}: {
    filters: ReciboFilters;
    currentPage: number;
}) {
    const recibos = await fetchFilteredRecibos(filters, currentPage);

    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {/* Vista Mobile */}
                    <div className="md:hidden">
                        {recibos.map((recibo) => (
                            <div
                                key={recibo.id}
                                className="w-full border-b border-gray-200 dark:border-gray-800 p-4 last:border-b-0"
                            >
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {recibo.atleta_nome}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Recibo #{recibo.recibo_number}
                                        </p>
                                    </div>
                                    <ReciboStatus status={recibo.status} />
                                </div>
                                <div className="flex w-full items-center justify-between pt-4">
                                    <div>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {formatCurrencyPTBR(recibo.amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {MESES_NOMES[recibo.mensalidade_mes] ?? recibo.mensalidade_mes}/{recibo.mensalidade_ano}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {recibo.data_pagamento ?? "-"}
                                        </p>
                                    </div>
                                    <ReciboActions
                                        reciboId={recibo.id}
                                        reciboCreatedBy={recibo.recibo_created_by}
                                        status={recibo.status}
                                        pdfUrl={recibo.pdf_url}
                                    />
                                </div>
                            </div>
                        ))}

                        {recibos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <p className="text-gray-500 text-sm">Nenhum recibo encontrado</p>
                            </div>
                        )}
                    </div>

                    {/* Vista Desktop */}
                    <table className="hidden min-w-full md:table">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Recibo
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Atleta
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Valor
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Periodo
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Pagamento
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th scope="col" className="relative py-4 pl-3 pr-6">
                                    <span className="sr-only">Acoes</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {recibos.map((recibo) => (
                                <tr key={recibo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            #{recibo.recibo_number}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {recibo.atleta_nome}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrencyPTBR(recibo.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {MESES_NOMES[recibo.mensalidade_mes] ?? recibo.mensalidade_mes}/{recibo.mensalidade_ano}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {recibo.data_pagamento ?? "-"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <ReciboStatus status={recibo.status} />
                                    </td>
                                    <td className="whitespace-nowrap py-4 pl-3 pr-6">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ReciboActions
                                                reciboId={recibo.id}
                                                reciboCreatedBy={recibo.recibo_created_by}
                                                status={recibo.status}
                                                pdfUrl={recibo.pdf_url}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {recibos.length === 0 && (
                        <div className="hidden md:flex flex-col items-center justify-center py-12">
                            <p className="text-gray-500 text-sm">Nenhum recibo encontrado</p>
                            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                                Tente ajustar os filtros de busca
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
