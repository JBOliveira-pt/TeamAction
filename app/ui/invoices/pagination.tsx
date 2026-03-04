// app/ui/invoices/pagination.tsx
"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { generatePagination } from "@/app/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

export default function Pagination({ totalPages }: { totalPages: number }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get("page")) || 1;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const allPages = generatePagination(currentPage, totalPages);

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            {/* Info de páginas */}
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-500 mr-4">
                Página {currentPage} de {totalPages}
            </span>

            <div className="inline-flex items-center gap-1">
                <PaginationArrow
                    direction="left"
                    href={createPageURL(currentPage - 1)}
                    isDisabled={currentPage <= 1}
                />

                <div className="flex gap-1">
                    {allPages.map((page, index) => {
                        let position:
                            | "first"
                            | "last"
                            | "single"
                            | "middle"
                            | undefined;

                        if (index === 0) position = "first";
                        if (index === allPages.length - 1) position = "last";
                        if (allPages.length === 1) position = "single";
                        if (page === "...") position = "middle";

                        return (
                            <PaginationNumber
                                key={`${page}-${index}`}
                                href={createPageURL(page)}
                                page={page}
                                position={position}
                                isActive={currentPage === page}
                            />
                        );
                    })}
                </div>

                <PaginationArrow
                    direction="right"
                    href={createPageURL(currentPage + 1)}
                    isDisabled={currentPage >= totalPages}
                />
            </div>
        </div>
    );
}

function PaginationNumber({
    page,
    href,
    isActive,
    position,
}: {
    page: number | string;
    href: string;
    position?: "first" | "last" | "middle" | "single";
    isActive: boolean;
}) {
    const className = clsx(
        "flex h-10 w-10 items-center justify-center text-sm font-medium rounded-lg transition-all",
        {
            // Active state - destaque azul
            "bg-blue-600 text-white shadow-lg shadow-blue-600/25": isActive,
            // Hover state para números normais
            "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-gray-700":
                !isActive && position !== "middle",
            // Ellipsis (...)
            "text-gray-400 dark:text-gray-600 cursor-default pointer-events-none":
                position === "middle",
        },
    );

    return isActive || position === "middle" ? (
        <div className={className}>{page}</div>
    ) : (
        <Link href={href} className={className}>
            {page}
        </Link>
    );
}

function PaginationArrow({
    href,
    direction,
    isDisabled,
}: {
    href: string;
    direction: "left" | "right";
    isDisabled?: boolean;
}) {
    const className = clsx(
        "flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
        {
            // Disabled state
            "pointer-events-none border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed":
                isDisabled,
            // Normal state
            "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600":
                !isDisabled,
            // Spacing
            "mr-2": direction === "left",
            "ml-2": direction === "right",
        },
    );

    const icon =
        direction === "left" ? (
            <ArrowLeftIcon className="w-4 h-4" />
        ) : (
            <ArrowRightIcon className="w-4 h-4" />
        );

    return isDisabled ? (
        <div className={className}>{icon}</div>
    ) : (
        <Link className={className} href={href}>
            {icon}
        </Link>
    );
}
