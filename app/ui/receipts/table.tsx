import { fetchFilteredReceipts, ReceiptFilters } from "@/app/lib/receipts-data";
import { formatCurrencyPTBR, formatDateToLocal } from "@/app/lib/utils";
import ReceiptStatus from "@/app/ui/receipts/status";
import { ReceiptActions } from "@/app/ui/receipts/buttons";

export default async function ReceiptsTable({
    filters,
    currentPage,
}: {
    filters: ReceiptFilters;
    currentPage: number;
}) {
    const receipts = await fetchFilteredReceipts(filters, currentPage);

    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {/* Mobile View */}
                    <div className="md:hidden">
                        {receipts.map((receipt) => (
                            <div
                                key={receipt.id}
                                className="w-full border-b border-gray-200 dark:border-gray-800 p-4 last:border-b-0"
                            >
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {receipt.customer_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {receipt.customer_email}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Recibo #{receipt.receipt_number}
                                        </p>
                                    </div>
                                    <ReceiptStatus status={receipt.status} />
                                </div>
                                <div className="flex w-full items-center justify-between pt-4">
                                    <div>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {formatCurrencyPTBR(receipt.amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Lançamento:{" "}
                                            {formatDateToLocal(
                                                receipt.invoice_date,
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {receipt.payment_date
                                                ? formatDateToLocal(
                                                      receipt.payment_date,
                                                  )
                                                : "-"}
                                        </p>
                                    </div>
                                    <ReceiptActions
                                        receiptId={receipt.id}
                                        receiptCreatedBy={
                                            receipt.receipt_created_by
                                        }
                                        status={receipt.status}
                                        pdfUrl={receipt.pdf_url}
                                    />
                                </div>
                            </div>
                        ))}

                        {receipts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <p className="text-gray-500 text-sm">
                                    Nenhum recibo encontrado
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Desktop View */}
                    <table className="hidden min-w-full md:table">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Recibo
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Cliente
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Valor
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Lançamento
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Pagamento
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Estado
                                </th>
                                <th
                                    scope="col"
                                    className="relative py-4 pl-3 pr-6"
                                >
                                    <span className="sr-only">Acoes</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {receipts.map((receipt) => (
                                <tr
                                    key={receipt.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                >
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            #{receipt.receipt_number}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {receipt.customer_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {receipt.customer_email}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrencyPTBR(receipt.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {formatDateToLocal(
                                            receipt.invoice_date,
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {receipt.payment_date
                                            ? formatDateToLocal(
                                                  receipt.payment_date,
                                              )
                                            : "-"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <ReceiptStatus
                                            status={receipt.status}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap py-4 pl-3 pr-6">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ReceiptActions
                                                receiptId={receipt.id}
                                                receiptCreatedBy={
                                                    receipt.receipt_created_by
                                                }
                                                status={receipt.status}
                                                pdfUrl={receipt.pdf_url}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {receipts.length === 0 && (
                        <div className="hidden md:flex flex-col items-center justify-center py-12">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                                <svg
                                    className="w-6 h-6 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Nenhum recibo encontrado
                            </p>
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
