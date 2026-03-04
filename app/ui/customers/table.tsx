// app/ui/customers/table.tsx
import Image from "next/image";
import { FormattedCustomersTable } from "@/app/lib/definitions";
import { UpdateCustomer, DeleteCustomer } from "./buttons";
import { Users } from "lucide-react";
import { isUserAdmin } from "@/app/lib/auth-helpers";
import { formatCurrencyPTBR } from "@/app/lib/utils";

export default async function CustomersTable({
    customers,
}: {
    customers: FormattedCustomersTable[];
}) {
    const isAdmin = await isUserAdmin();

    return (
        <div className="w-full">
            <div className="mt-6 flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            {/* Mobile View */}
                            <div className="md:hidden">
                                {customers?.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className="w-full border-b border-gray-200 dark:border-gray-800 p-4 last:border-b-0"
                                    >
                                        {/* Customer Info */}
                                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={customer.image_url}
                                                    className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700"
                                                    alt={`${customer.name}'s profile picture`}
                                                    width={40}
                                                    height={40}
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {customer.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {customer.email}
                                                    </p>
                                                    {customer.nif && (
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            NIF: {customer.nif}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex w-full items-center justify-between py-4 border-b border-gray-200 dark:border-gray-800">
                                            <div className="flex flex-col">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                    Pendente
                                                </p>
                                                <p className="font-medium text-yellow-400">
                                                    {formatCurrencyPTBR(
                                                        customer.total_pending,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                    Pago
                                                </p>
                                                <p className="font-medium text-green-400">
                                                    {formatCurrencyPTBR(
                                                        customer.total_paid,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                    Faturas
                                                </p>
                                                <p className="font-medium text-white">
                                                    {customer.total_invoices}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-4 flex justify-end gap-2">
                                            <UpdateCustomer
                                                id={customer.id}
                                                createdBy={customer.created_by}
                                            />
                                            <DeleteCustomer
                                                id={customer.id}
                                                createdBy={customer.created_by}
                                                invoiceCount={
                                                    customer.total_invoices
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Empty State Mobile */}
                                {customers?.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 px-4">
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                                            <Users className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            Nenhum cliente encontrado
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
                                            NIF
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Faturas
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Pendente
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Pago
                                        </th>
                                        {isAdmin && (
                                            <th
                                                scope="col"
                                                className="relative py-4 pl-3 pr-6"
                                            >
                                                <span className="sr-only">
                                                    Ações
                                                </span>
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {customers.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                        >
                                            <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src={customer.image_url}
                                                        className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-600 transition-all"
                                                        style={{
                                                            objectFit: "cover",
                                                            aspectRatio:
                                                                "1 / 1",
                                                        }}
                                                        alt={`${customer.name}'s profile picture`}
                                                        width={36}
                                                        height={36}
                                                    />
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                        {customer.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {customer.email}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {customer.nif || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    {customer.total_invoices}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <span className="text-sm font-medium text-yellow-400">
                                                    {formatCurrencyPTBR(
                                                        customer.total_pending,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <span className="text-sm font-medium text-green-400">
                                                    {formatCurrencyPTBR(
                                                        customer.total_paid,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-3 pr-6">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <UpdateCustomer
                                                        id={customer.id}
                                                        createdBy={
                                                            customer.created_by
                                                        }
                                                    />
                                                    <DeleteCustomer
                                                        id={customer.id}
                                                        createdBy={
                                                            customer.created_by
                                                        }
                                                        invoiceCount={
                                                            customer.total_invoices
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Empty State Desktop */}
                            {customers?.length === 0 && (
                                <div className="hidden md:flex flex-col items-center justify-center py-12">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                                        <Users className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Nenhum cliente encontrado
                                    </p>
                                    <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                                        Tente ajustar os filtros de busca
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
