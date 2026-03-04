import {
    RefreshCw,
    Clock,
    ArrowUpRight,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { fetchLatestInvoices } from "@/app/lib/data";
import { formatCurrencyPTBR } from "@/app/lib/utils";

export default async function LatestInvoices() {
    const latestInvoices = await fetchLatestInvoices();

    return (
        <div className="flex w-full flex-col md:col-span-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Últimas Faturas
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Transações recentes
                    </p>
                </div>
            </div>

            {/* Lista de Invoices */}
            <div className="flex grow flex-col justify-between rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {latestInvoices.map((invoice) => {
                        const isPaid = invoice.status === "paid";
                        const dateLabel = isPaid
                            ? invoice.payment_date || " - "
                            : invoice.date;
                        const DateIcon = isPaid ? CheckCircle : Clock;

                        return (
                            <div
                                key={invoice.id}
                                className="flex flex-row items-center justify-between py-4 first:pt-0 last:pb-0 group hover:bg-gray-100 dark:hover:bg-gray-800/50 -mx-4 px-4 transition-colors cursor-pointer"
                            >
                                {/* Avatar e Info */}
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Image
                                            src={invoice.image_url}
                                            alt={`${invoice.name}'s profile picture`}
                                            className="rounded-full ring-2 ring-gray-300 dark:ring-gray-800 group-hover:ring-gray-400 dark:group-hover:ring-gray-700 transition-all"
                                            style={{
                                                objectFit: "cover",
                                                aspectRatio: "1 / 1",
                                            }}
                                            width={40}
                                            height={40}
                                        />
                                        {/* Indicador de status no avatar */}
                                        <span
                                            className={clsx(
                                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900",
                                                isPaid
                                                    ? "bg-green-500"
                                                    : "bg-yellow-500",
                                            )}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                            {invoice.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate max-w-[150px] sm:max-w-none">
                                            {invoice.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Status, Valor e Data */}
                                <div className="flex items-center gap-4">
                                    {/* Badge de Status */}
                                    <span
                                        className={clsx(
                                            "hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
                                            isPaid
                                                ? "bg-green-500/10 text-green-400"
                                                : "bg-yellow-500/10 text-yellow-400",
                                        )}
                                    >
                                        {isPaid ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Pago
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-3 h-3" />
                                                Pendente
                                            </>
                                        )}
                                    </span>

                                    {/* Valor e Data */}
                                    <div className="flex flex-col items-end gap-1">
                                        <span
                                            className={clsx(
                                                "text-sm font-bold",
                                                isPaid
                                                    ? "text-green-400"
                                                    : "text-yellow-400",
                                            )}
                                        >
                                            {formatCurrencyPTBR(invoice.amount)}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <DateIcon
                                                className={clsx(
                                                    "w-3 h-3",
                                                    isPaid
                                                        ? "text-green-500"
                                                        : "text-gray-500",
                                                )}
                                            />
                                            {dateLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Ver mais link */}
                <Link
                    href="/dashboard/invoices"
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2 text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors group w-full cursor-pointer"
                >
                    <span>Ver todas as faturas</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
