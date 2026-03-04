import { Suspense } from "react";
import Pagination from "@/app/ui/invoices/pagination";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import ReceiptsTable from "@/app/ui/receipts/table";
import ReceiptFiltersForm from "@/app/ui/receipts/filters";
import Search from "@/app/ui/search";
import {
    fetchReceiptCustomers,
    fetchReceiptsPages,
    fetchReceiptInvoiceDates,
    fetchReceiptPaymentDates,
    ReceiptFilters,
} from "@/app/lib/receipts-data";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Receipts | PrimeFlow Dashboard",
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
        customer?: string;
        status?: "pending_send" | "sent_to_customer";
        dateFrom?: string;
        dateTo?: string;
        page?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || "";

    const filters: ReceiptFilters = {
        query,
        customerId: searchParams?.customer || undefined,
        status: searchParams?.status || undefined,
        dateFrom: searchParams?.dateFrom || undefined,
        dateTo: searchParams?.dateTo || undefined,
    };

    const currentPage = Number(searchParams?.page) || 1;

    const [customers, totalPages, invoiceDates, paymentDates] =
        await Promise.all([
            fetchReceiptCustomers(),
            fetchReceiptsPages(filters),
            fetchReceiptInvoiceDates(),
            fetchReceiptPaymentDates(),
        ]);

    return (
        <div className="w-full min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
            <div className="flex flex-col w-full justify-between">
                <h1 className="text-xl text-center lg:text-start md:text-3xl font-bold text-gray-900 dark:text-white">
                    Recibos
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-start">
                    Pesquisa e envio de recibos
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Suspense fallback={<SearchSkeleton />}>
                    <Search placeholder="Buscar recibos..." />
                </Suspense>
            </div>

            <div className="mt-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <ReceiptFiltersForm
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
                <ReceiptsTable filters={filters} currentPage={currentPage} />
            </Suspense>

            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}
