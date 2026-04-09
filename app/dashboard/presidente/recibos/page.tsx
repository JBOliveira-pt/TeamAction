import { Suspense } from "react";
import Pagination from "@/app/ui/components/pagination";
import RecibosTable from "@/app/ui/receipts/table";
import ReciboFiltersForm from "@/app/ui/receipts/filters";
import Search from "@/app/ui/receipts/search";
import {
    fetchReciboAtletas,
    fetchRecibosPages,
    ReciboFilters,
} from "@/app/lib/receipts-data";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Recibos | TeamAction Dashboard",
};

export const dynamic = "force-dynamic";

function SearchSkeleton() {
    return (
        <div className="relative flex flex-1 max-w-md">
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
    );
}

function MobileSkeleton() {
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

function TableRowSkeleton() {
    return (
        <tr className="w-full border-b border-gray-200 dark:border-gray-800 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
            <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            <td className="whitespace-nowrap px-3 py-3">
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800"></div>
            </td>
            <td className="whitespace-nowrap py-3 pl-6 pr-3">
                <div className="flex justify-end gap-3">
                    <div className="h-[38px] w-[38px] rounded bg-gray-200 dark:bg-gray-800"></div>
                    <div className="h-[38px] w-[38px] rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </td>
        </tr>
    );
}

function RecibosTableSkeleton() {
    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-950 p-2 md:pt-0">
                    <div className="md:hidden">
                        <MobileSkeleton />
                        <MobileSkeleton />
                        <MobileSkeleton />
                        <MobileSkeleton />
                        <MobileSkeleton />
                        <MobileSkeleton />
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

export default async function Page(props: {
    searchParams?: Promise<{
        query?: string;
        atleta?: string;
        status?: "pendente_envio" | "enviado_atleta";
        page?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || "";

    const filters: ReciboFilters = {
        query,
        atletaId: searchParams?.atleta || undefined,
        status: searchParams?.status || undefined,
    };

    const currentPage = Number(searchParams?.page) || 1;

    const [atletas, totalPages] = await Promise.all([
        fetchReciboAtletas(),
        fetchRecibosPages(filters),
    ]);

    return (
        <div className="w-full min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
            <div className="flex flex-col w-full justify-between">
                <h1 className="text-xl text-center lg:text-start md:text-3xl font-bold text-gray-900 dark:text-white">
                    Recibos
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-start">
                    Pesquisa e envio de recibos de mensalidades
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Suspense fallback={<SearchSkeleton />}>
                    <Search placeholder="Buscar recibos..." />
                </Suspense>
            </div>

            <div className="mt-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <ReciboFiltersForm atletas={atletas} filters={filters} />
            </div>

            <Suspense
                key={query + JSON.stringify(filters) + currentPage}
                fallback={<RecibosTableSkeleton />}
            >
                <RecibosTable filters={filters} currentPage={currentPage} />
            </Suspense>

            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}
