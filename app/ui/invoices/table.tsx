// app/ui/invoices/table.tsx
import Image from "next/image";
import { UpdateInvoice, DeleteInvoice } from "@/app/ui/invoices/buttons";
import InvoiceStatus from "@/app/ui/invoices/status";
import { formatDateToLocal, formatCurrencyPTBR } from "@/app/lib/utils";
import { fetchFilteredInvoices, InvoiceFilters } from "@/app/lib/data";

export default async function InvoicesTable({
    filters,
    currentPage,
}: {
    filters: InvoiceFilters;
    currentPage: number;
}) {
    const invoices = await fetchFilteredInvoices(filters, currentPage);

    const getAmountColor = (status: string) => {
        return status === "paid"
            ? "text-green-600 dark:text-green-400"
            : "text-yellow-600 dark:text-yellow-400";
    };

    const getPaymentDateLabel = (
        status: string,
        paymentDate?: string | null,
    ) => {
        if (status !== "paid" || !paymentDate) {
            return <span className="flex justify-center pr-10">--</span>;
        }

        return formatDateToLocal(paymentDate);
    };

    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {/* Mobile View */}
                    <div className="md:hidden">
                        {invoices?.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="w-full border-b border-gray-200 dark:border-gray-800 p-4 last:border-b-0"
                            >
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                                    <div>
                                        <div className="mb-2 flex items-center gap-3">
                                            <Image
                                                src={invoice.image_url}
                                                className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700"
                                                width={32}
                                                height={32}
                                                alt={`${invoice.name}'s profile picture`}
                                            />
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {invoice.name}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {invoice.email}
                                        </p>
                                    </div>
                                    <InvoiceStatus status={invoice.status} />
                                </div>
                                <div className="flex w-full items-center justify-between pt-4">
                                    <div>
                                        <p
                                            className={`text-lg font-medium ${getAmountColor(invoice.status)}`}
                                        >
                                            {formatCurrencyPTBR(invoice.amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDateToLocal(invoice.date)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Pagamento:{" "}
                                            {getPaymentDateLabel(
                                                invoice.status,
                                                invoice.payment_date,
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <UpdateInvoice
                                            id={invoice.id}
                                            createdBy={invoice.created_by}
                                            status={invoice.status}
                                        />
                                        <DeleteInvoice
                                            id={invoice.id}
                                            createdBy={invoice.created_by}
                                            status={invoice.status}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty state mobile */}
                        {invoices?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <p className="text-gray-500 text-sm">
                                    Nenhuma fatura encontrada
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
                                    Cliente
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Email
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
                                    Status
                                </th>
                                <th
                                    scope="col"
                                    className="relative py-4 pl-3 pr-6"
                                >
                                    <span className="sr-only">Ações</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {invoices?.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                >
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={invoice.image_url}
                                                className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-600 transition-all"
                                                style={{
                                                    objectFit: "cover",
                                                    aspectRatio: "1 / 1",
                                                }}
                                                width={36}
                                                height={36}
                                                alt={`${invoice.name}'s profile picture`}
                                            />
                                            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {invoice.name}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {invoice.email}
                                    </td>
                                    <td
                                        className={`whitespace-nowrap px-3 py-4 text-sm font-medium ${getAmountColor(invoice.status)}`}
                                    >
                                        {formatCurrencyPTBR(invoice.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {formatDateToLocal(invoice.date)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {getPaymentDateLabel(
                                            invoice.status,
                                            invoice.payment_date,
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <InvoiceStatus
                                            status={invoice.status}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap py-4 pl-3 pr-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <UpdateInvoice
                                                id={invoice.id}
                                                createdBy={invoice.created_by}
                                                status={invoice.status}
                                            />
                                            <DeleteInvoice
                                                id={invoice.id}
                                                createdBy={invoice.created_by}
                                                status={invoice.status}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Empty state desktop */}
                    {invoices?.length === 0 && (
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
                                Nenhuma fatura encontrada
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
