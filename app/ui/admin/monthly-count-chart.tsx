"use client";

import { CalendarIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MonthlyCountPoint = {
    month: string;
    count: number;
};

type MonthlyCountChartProps = {
    title: string;
    subtitle: string;
    data: MonthlyCountPoint[];
    accent: "blue" | "emerald";
};

const accentClasses = {
    blue: {
        activeText: "text-blue-600 dark:text-blue-400",
        activeBorder: "border-blue-600 dark:border-blue-400",
        latestBar:
            "bg-gradient-to-t from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20",
        defaultBar:
            "bg-gradient-to-t from-gray-400 to-gray-300 dark:from-gray-700 dark:to-gray-600 hover:from-gray-500 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500",
    },
    emerald: {
        activeText: "text-emerald-600 dark:text-emerald-400",
        activeBorder: "border-emerald-600 dark:border-emerald-400",
        latestBar:
            "bg-gradient-to-t from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/20",
        defaultBar:
            "bg-gradient-to-t from-gray-400 to-gray-300 dark:from-gray-700 dark:to-gray-600 hover:from-gray-500 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500",
    },
};

function generateYAxis(values: number[]) {
    const max = Math.max(...values, 0);
    const topLabel = Math.max(1, Math.ceil(max / 5) * 5);
    const yAxisLabels = [
        topLabel,
        topLabel * 0.75,
        topLabel * 0.5,
        topLabel * 0.25,
        0,
    ].map((value) => `${Math.round(value)}`);

    return { topLabel, yAxisLabels };
}

export function MonthlyCountChart({
    title,
    subtitle,
    data,
    accent,
}: MonthlyCountChartProps) {
    const [selectedMonths, setSelectedMonths] = useState<3 | 5 | 12>(12);
    const [series, setSeries] = useState<MonthlyCountPoint[]>(data.slice(-12));

    useEffect(() => {
        setSeries(data.slice(-selectedMonths));
    }, [data, selectedMonths]);

    const total = useMemo(
        () => series.reduce((sum, item) => sum + item.count, 0),
        [series],
    );

    const average = useMemo(
        () => (series.length > 0 ? total / series.length : 0),
        [series, total],
    );

    const growth = useMemo(() => {
        if (series.length < 2) {
            return 0;
        }

        const last = series[series.length - 1].count;
        const previous = series[series.length - 2].count;

        if (previous === 0) {
            return last > 0 ? 100 : 0;
        }

        return ((last - previous) / previous) * 100;
    }, [series]);

    const chartHeight = 320;
    const values = series.map((item) => item.count);
    const { topLabel, yAxisLabels } = generateYAxis(values);
    const palette = accentClasses[accent];

    if (data.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sem dados para este gráfico.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {subtitle}
                    </p>
                </div>
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {selectedMonths}M
                </span>
            </div>

            <div className="mb-5 flex gap-2">
                {[3, 5, 12].map((months) => (
                    <button
                        key={months}
                        type="button"
                        onClick={() => setSelectedMonths(months as 3 | 5 | 12)}
                        className={`border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                            selectedMonths === months
                                ? `${palette.activeText} ${palette.activeBorder}`
                                : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    >
                        {months}M
                    </button>
                ))}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
                <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Total
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {total}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Media mensal
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {average.toFixed(1)}
                    </p>
                </div>
            </div>

            <div className="relative">
                <div
                    className="sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-1 md:gap-2"
                    style={{ height: `${chartHeight}px` }}
                >
                    <div
                        className="mb-6 hidden flex-col justify-between text-xs text-gray-600 dark:text-gray-500 sm:flex col-span-1"
                        style={{ height: `${chartHeight - 24}px` }}
                    >
                        {yAxisLabels.map((label) => (
                            <p key={label} className="text-right">
                                {label}
                            </p>
                        ))}
                    </div>

                    {series.map((item, index) => {
                        const barHeight = (chartHeight / topLabel) * item.count;
                        const isLastMonth = index === series.length - 1;

                        return (
                            <div
                                key={`${item.month}-${index}`}
                                className="group relative flex flex-col items-center gap-2"
                            >
                                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    {item.count}
                                </div>

                                <div
                                    className={`w-full rounded-t-md transition-all duration-300 ${isLastMonth ? palette.latestBar : palette.defaultBar}`}
                                    style={{
                                        height: `${Math.max(2, barHeight)}px`,
                                        marginTop: "15px",
                                    }}
                                />

                                <p className="-rotate-45 text-xs text-gray-600 dark:text-gray-500 sm:rotate-0">
                                    {item.month}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    Últimos 12 meses
                </div>
                <div
                    className={`text-xs font-medium ${
                        growth >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                    }`}
                >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(1)}% vs mes anterior
                </div>
            </div>
        </div>
    );
}
