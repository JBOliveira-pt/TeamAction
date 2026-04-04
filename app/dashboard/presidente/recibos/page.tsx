import { Suspense } from "react";
import Pagination from "@/app/ui/components/pagination";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import RecibosTable from "@/app/ui/receipts/table";
import ReciboFiltersForm from "@/app/ui/receipts/filters";
import Search from "@/app/ui/search";
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
                <ReciboFiltersForm
                    atletas={atletas}
                    filters={filters}
                />
            </div>

            <Suspense
                key={query + JSON.stringify(filters) + currentPage}
                fallback={<InvoicesTableSkeleton />}
            >
                <RecibosTable filters={filters} currentPage={currentPage} />
            </Suspense>

            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}
