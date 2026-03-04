import { Revenue } from "./definitions";

export const formatCurrency = (
    amount: number | string,
    locale: string = "en-US",
    currency: string = "EUR",
    divideByHundred: boolean = true,
): string => {
    let numValue: number;

    // Converte string para número
    if (typeof amount === "string") {
        numValue = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
    } else {
        numValue = amount;
    }

    // Divide por 100 se necessário (para centavos)
    if (divideByHundred) {
        numValue = numValue / 100;
    }

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
    }).format(numValue || 0);
};

export const formatCurrencyPTBR = (value: string | number) =>
    formatCurrency(value, "pt-BR", "EUR", true);

export const formatDateToLocal = (
    dateStr: string,
    locale: string = "en-US",
) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        year: "numeric",
    };
    const formatter = new Intl.DateTimeFormat(locale, options);
    return formatter.format(date);
};

export const generateYAxis = (revenue: Revenue[]) => {
    // Revenue values are stored in cents; build labels in EUR.
    const yAxisLabels: string[] = [];
    const highestRecord = Math.max(...revenue.map((month) => month.revenue), 0);

    // Aim for 6 ticks max to keep the axis readable.
    const maxTicks = 6;
    const step =
        highestRecord === 0
            ? 0
            : Math.ceil(highestRecord / (maxTicks - 1) / 100000) * 100000;
    const topLabel = step === 0 ? 0 : Math.ceil(highestRecord / step) * step;

    for (let i = topLabel; i >= 0; i -= step || 1) {
        const euros = i / 100;
        const label =
            euros >= 1000
                ? `€ ${(euros / 1000).toFixed(1).replace(/\.0$/, "")}k`
                : `€ ${euros.toFixed(0)}`;
        yAxisLabels.push(label);
        if (yAxisLabels.length >= maxTicks) {
            break;
        }
    }

    return { yAxisLabels, topLabel };
};

export const generatePagination = (currentPage: number, totalPages: number) => {
    // If the total number of pages is 7 or less,
    // display all pages without any ellipsis.
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // If the current page is among the first 3 pages,
    // show the first 3, an ellipsis, and the last 2 pages.
    if (currentPage <= 3) {
        return [1, 2, 3, "...", totalPages - 1, totalPages];
    }

    // If the current page is among the last 3 pages,
    // show the first 2, an ellipsis, and the last 3 pages.
    if (currentPage >= totalPages - 2) {
        return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    // If the current page is somewhere in the middle,
    // show the first page, an ellipsis, the current page and its neighbors,
    // another ellipsis, and the last page.
    return [
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
    ];
};
