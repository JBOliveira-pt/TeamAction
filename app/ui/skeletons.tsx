const shimmer =
    "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-white/10 before:to-transparent";

export function CardSkeleton() {
    return (
        <div
            className={`${shimmer} relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm`}
        >
            <div className="flex justify-between items-center mb-4">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="space-y-3">
                <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
        </div>
    );
}

export function CardsSkeleton() {
    return (
        <>
            <div className="col-span-2 lg:col-span-1">
                <CardSkeleton />
            </div>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </>
    );
}

export function RevenueChartSkeleton() {
    return (
        <div
            className={`${shimmer} relative w-full overflow-hidden md:col-span-4`}
        >
            <div className="mb-4 h-8 w-36 rounded-md bg-gray-200 dark:bg-gray-800" />
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <div className="sm:grid-cols-13 mt-0 grid h-[410px] grid-cols-12 items-end gap-2 rounded-md bg-gray-50 dark:bg-gray-950 p-4 md:gap-4" />
                <div className="flex items-center pb-2 pt-6">
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div className="ml-2 h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>
        </div>
    );
}

export function InvoiceSkeleton() {
    return (
        <div className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800 py-4">
            <div className="flex items-center">
                <div className="mr-2 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="min-w-0">
                    <div className="h-5 w-40 rounded-md bg-gray-200 dark:bg-gray-800" />
                    <div className="mt-2 h-4 w-12 rounded-md bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>
            <div className="mt-2 h-4 w-12 rounded-md bg-gray-200 dark:bg-gray-800" />
        </div>
    );
}

export function LatestInvoicesSkeleton() {
    return (
        <div
            className={`${shimmer} relative flex w-full flex-col overflow-hidden md:col-span-4`}
        >
            <div className="mb-4 h-8 w-36 rounded-md bg-gray-200 dark:bg-gray-800" />
            <div className="flex grow flex-col justify-between rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <div className="bg-gray-50 dark:bg-gray-950 rounded-lg px-6">
                    <InvoiceSkeleton />
                    <InvoiceSkeleton />
                    <InvoiceSkeleton />
                    <InvoiceSkeleton />
                    <InvoiceSkeleton />
                </div>
                <div className="flex items-center pb-2 pt-6">
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div className="ml-2 h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>
        </div>
    );
}

export default function DashboardSkeleton() {
    return (
        <div className="bg-gray-50 dark:bg-gray-950 w-full min-h-screen p-6">
            <div className="mb-8">
                <div
                    className={`${shimmer} relative h-8 w-36 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800 mb-2`}
                />
                <div
                    className={`${shimmer} relative h-5 w-48 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800`}
                />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                <div className="col-span-2 lg:col-span-1">
                    <CardSkeleton />
                </div>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
                <RevenueChartSkeleton />
                <LatestInvoicesSkeleton />
            </div>
        </div>
    );
}

// Mantenha o resto dos skeletons mas atualize as cores para o tema dark
export function TableRowSkeleton() {
    return (
        <tr className="w-full border-b border-gray-200 dark:border-gray-800 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
            {/* Customer Name and Image */}
            <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
            {/* Email */}
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Amount */}
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Date */}
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Status */}
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Actions */}
            <td className="whitespace-nowrap py-3 pl-6 pr-3">
                <div className="flex justify-end gap-3">
                    <div className="h-[38px] w-[38px] rounded bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-[38px] w-[38px] rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
        </tr>
    );
}

export function InvoicesMobileSkeleton() {
    return (
        <div className="mb-2 w-full rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-8">
                <div className="flex items-center">
                    <div className="mr-2 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
            </div>
            <div className="flex w-full items-center justify-between pt-4">
                <div>
                    <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
                    <div className="mt-2 h-6 w-24 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
                <div className="flex justify-end gap-2">
                    <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </div>
        </div>
    );
}

export function InvoicesTableSkeleton() {
    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-950 p-2 md:pt-0">
                    <div className="md:hidden">
                        <InvoicesMobileSkeleton />
                        <InvoicesMobileSkeleton />
                        <InvoicesMobileSkeleton />
                        <InvoicesMobileSkeleton />
                        <InvoicesMobileSkeleton />
                        <InvoicesMobileSkeleton />
                    </div>
                    <table className="hidden min-w-full text-gray-900 dark:text-gray-100 md:table">
                        <thead className="rounded-lg text-left text-sm font-normal">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-5 text-xs font-medium text-gray-600 dark:text-gray-400 sm:pl-6"
                                >
                                    CLIENTE
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-5 text-xs font-medium text-gray-600 dark:text-gray-400"
                                >
                                    EMAIL
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-5 text-xs font-medium text-gray-600 dark:text-gray-400"
                                >
                                    VALOR
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-5 text-xs font-medium text-gray-600 dark:text-gray-400"
                                >
                                    DATA
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-5 text-xs font-medium text-gray-600 dark:text-gray-400"
                                >
                                    STATUS
                                </th>
                                <th
                                    scope="col"
                                    className="relative pb-4 pl-3 pr-6 pt-2 sm:pr-6"
                                >
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900">
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Skeleton específico para mobile users
export function UsersMobileSkeleton() {
    return (
        <div className="w-full border-b border-gray-200 dark:border-gray-800 p-4 last:border-b-0">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div>
                        <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-800 mb-2"></div>
                        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
                    </div>
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-800"></div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
                <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
                <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
            </div>
        </div>
    );
}

// Skeleton específico para linha de users
export function UsersTableRowSkeleton() {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
            {/* User Name and Image */}
            <td className="whitespace-nowrap py-4 pl-6 pr-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
            {/* Email */}
            <td className="whitespace-nowrap px-3 py-4">
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Role */}
            <td className="whitespace-nowrap px-3 py-4">
                <div className="h-7 w-24 rounded-full bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Actions */}
            <td className="whitespace-nowrap py-4 pl-3 pr-6">
                <div className="flex justify-end gap-2">
                    <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
        </tr>
    );
}

// Skeleton específico para tabela de users
export function UsersTableSkeleton() {
    return (
        <div className="w-full">
            <div className="mt-6 flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            {/* Mobile View */}
                            <div className="md:hidden">
                                <UsersMobileSkeleton />
                                <UsersMobileSkeleton />
                                <UsersMobileSkeleton />
                                <UsersMobileSkeleton />
                                <UsersMobileSkeleton />
                                <UsersMobileSkeleton />
                            </div>

                            {/* Desktop View */}
                            <table className="hidden min-w-full md:table">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Utilizador
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
                                            Função
                                        </th>
                                        <th
                                            scope="col"
                                            className="relative py-4 pl-3 pr-6"
                                        >
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    <UsersTableRowSkeleton />
                                    <UsersTableRowSkeleton />
                                    <UsersTableRowSkeleton />
                                    <UsersTableRowSkeleton />
                                    <UsersTableRowSkeleton />
                                    <UsersTableRowSkeleton />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============= CUSTOMERS SKELETONS =============

// Skeleton específico para mobile customers
export function CustomersMobileSkeleton() {
    return (
        <div className="w-full border-b border-gray-200 dark:border-gray-800 p-4 last:border-b-0">
            {/* Customer Info */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div>
                        <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-800 mb-2"></div>
                        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex w-full items-center justify-between py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col">
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800 mb-1"></div>
                    <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
                <div className="flex flex-col">
                    <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-800 mb-1"></div>
                    <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
                <div className="flex flex-col">
                    <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-800 mb-1"></div>
                    <div className="h-5 w-8 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-2">
                <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
                <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
            </div>
        </div>
    );
}

// Skeleton específico para linha de customers
export function CustomersTableRowSkeleton() {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
            {/* Customer Name and Image */}
            <td className="whitespace-nowrap py-4 pl-6 pr-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
            {/* Email */}
            <td className="whitespace-nowrap px-3 py-4">
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Faturas */}
            <td className="whitespace-nowrap px-3 py-4">
                <div className="h-6 w-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Pendente */}
            <td className="whitespace-nowrap px-3 py-4">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Pago */}
            <td className="whitespace-nowrap px-3 py-4">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            {/* Actions */}
            <td className="whitespace-nowrap py-4 pl-3 pr-6">
                <div className="flex justify-end gap-2">
                    <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
        </tr>
    );
}

// Skeleton específico para tabela de customers
export function CustomersTableSkeleton() {
    return (
        <div className="w-full">
            <div className="mt-6 flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            {/* Mobile View */}
                            <div className="md:hidden">
                                <CustomersMobileSkeleton />
                                <CustomersMobileSkeleton />
                                <CustomersMobileSkeleton />
                                <CustomersMobileSkeleton />
                                <CustomersMobileSkeleton />
                                <CustomersMobileSkeleton />
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
                                        <th
                                            scope="col"
                                            className="relative py-4 pl-3 pr-6"
                                        >
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    <CustomersTableRowSkeleton />
                                    <CustomersTableRowSkeleton />
                                    <CustomersTableRowSkeleton />
                                    <CustomersTableRowSkeleton />
                                    <CustomersTableRowSkeleton />
                                    <CustomersTableRowSkeleton />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
