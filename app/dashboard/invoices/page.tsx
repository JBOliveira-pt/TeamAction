// app/dashboard/invoices/page.tsx
import Pagination from "@/app/ui/invoices/pagination";
import Search from "@/app/ui/search";
import InvoicesTable from "@/app/ui/invoices/table";
import { CreateInvoice } from "@/app/ui/invoices/buttons";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import InvoiceFiltersForm from "@/app/ui/invoices/filters";
import { Suspense } from "react";
import {
    fetchInvoicesPages,
    fetchInvoiceCustomers,
    fetchInvoiceDates,
    fetchInvoicePaymentDates,
    InvoiceFilters,
} from "@/app/lib/data";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Invoices | PrimeFlow Dashboard",
};

// Forçar renderização dinâmica
export const dynamic = "force-dynamic";

// Skeleton para o Search
function SearchSkeleton() {
    return (
        <div className="relative flex flex-1 max-w-md">
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
    );
}

// Skeleton para Pagination
function PaginationSkeleton() {
    return (
        <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
    );
}

export default async function Page(props: {
    searchParams?: Promise<{
        query?: string;
        customer?: string;
        status?: "pending" | "paid";
        dateFrom?: string;
        dateTo?: string;
        page?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || "";

    const filters: InvoiceFilters = {
        query,
        customerId: searchParams?.customer || undefined,
        status: searchParams?.status || undefined,
        dateFrom: searchParams?.dateFrom || undefined,
        dateTo: searchParams?.dateTo || undefined,
    };

    const currentPage = Number(searchParams?.page) || 1;

    const [customers, totalPages, invoiceDates, paymentDates] =
        await Promise.all([
            fetchInvoiceCustomers(),
            fetchInvoicesPages(filters),
            fetchInvoiceDates(),
            fetchInvoicePaymentDates(),
        ]);

    return (
        <div className="w-full min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
            <div className="flex flex-col w-full justify-between">
                <h1 className="text-xl text-center lg:text-start md:text-3xl font-bold text-gray-900 dark:text-white">
                    Faturas
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-start">
                    Gerencie suas faturas
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Suspense fallback={<SearchSkeleton />}>
                    <Search placeholder="Buscar faturas..." />
                </Suspense>
                <CreateInvoice />
            </div>

            <div className="mt-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <InvoiceFiltersForm
                    customers={customers}
                    invoiceDates={invoiceDates}
                    paymentDates={paymentDates}
                    filters={filters}
                />
            </div>

            <Suspense
                key={query + JSON.stringify(filters) + currentPage}
                fallback={<InvoicesTableSkeleton />}
            >
                <InvoicesTable filters={filters} currentPage={currentPage} />
            </Suspense>

            <div className="mt-5 flex w-full justify-center">
                <Suspense fallback={<PaginationSkeleton />}>
                    <Pagination totalPages={totalPages} />
                </Suspense>
            </div>
        </div>
    );
}
