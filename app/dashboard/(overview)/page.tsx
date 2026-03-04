// app/dashboard/page.tsx
import CardWrapper from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/revenue-chart";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";
import { Suspense } from "react";
import {
    RevenueChartSkeleton,
    LatestInvoicesSkeleton,
    CardsSkeleton,
} from "@/app/ui/skeletons";
import { getCurrentUser } from "@/app/lib/auth-helpers";
import { fetchRevenue, fetchPendingRevenue } from "@/app/lib/data";

// Forçar renderização dinâmica (requerida para Next.js Production)
export const dynamic = "force-dynamic";

export default async function Page() {
    const user = await getCurrentUser();
    const userName = user?.name || user?.email?.split("@")[0] || "Usuário";
    const [revenue, pendingRevenue] = await Promise.all([
        fetchRevenue(),
        fetchPendingRevenue(),
    ]);

    return (
        <div className="bg-gray-50 dark:bg-gray-950 w-full min-h-screen p-6">
            {/* Header da página */}
            <div className="mb-8">
                <h2 className="text-xl text-center lg:text-start md:text-2xl font-bold text-gray-900 dark:text-white">
                    Visão Geral
                </h2>
                <p className="text-sm text-center lg:text-start md:text-base text-gray-600 dark:text-gray-400">
                    Bem-vindo de volta,{" "}
                    <span className="font-bold">{userName}</span>!
                </p>
            </div>

            {/* Cards KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                <Suspense fallback={<CardsSkeleton />}>
                    <CardWrapper />
                </Suspense>
            </div>

            {/* Gráficos */}
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
                <Suspense fallback={<RevenueChartSkeleton />}>
                    <RevenueChart
                        revenue={revenue}
                        pendingRevenue={pendingRevenue}
                    />
                </Suspense>

                <Suspense fallback={<LatestInvoicesSkeleton />}>
                    <LatestInvoices />
                </Suspense>
            </div>
        </div>
    );
}
