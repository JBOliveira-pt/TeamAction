// Gráfico de barras mensal com períodos 3/6/12M e expansão lateral.
"use client";

import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";

type MonthlyCountPoint = {
    month: string;
    count: number;
};

type MonthlyCountChartProps = {
    title: string;
    subtitle: string;
    data: MonthlyCountPoint[];
    accent: "blue" | "emerald";
    tabs?: Array<{
        id: string;
        label: string;
        data: MonthlyCountPoint[];
    }>;
};

const MONTH_OPTIONS = [3, 6, 12] as const;
type MonthOption = (typeof MONTH_OPTIONS)[number];

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
    const yAxisLabels = [topLabel, topLabel * 0.5, 0].map(
        (v) => `${Math.round(v)}`,
    );
    return { topLabel, yAxisLabels };
}

export function MonthlyCountChart({
    title,
    subtitle,
    data,
    accent,
    tabs,
}: MonthlyCountChartProps) {
    const [selectedMonths, setSelectedMonths] = useState<MonthOption>(3);
    const [selectedTabId, setSelectedTabId] = useState<string | null>(
        tabs?.[0]?.id ?? null,
    );

    const [prevTabs, setPrevTabs] = useState(tabs);
    if (tabs !== prevTabs) {
        setPrevTabs(tabs);
        if (
            tabs &&
            tabs.length > 0 &&
            !tabs.some((tab) => tab.id === selectedTabId)
        ) {
            setSelectedTabId(tabs[0].id);
        }
    }

    const activeData = useMemo(() => {
        if (!tabs || tabs.length === 0) return data;
        const selected = tabs.find((tab) => tab.id === selectedTabId);
        return selected?.data ?? tabs[0].data;
    }, [data, selectedTabId, tabs]);

    const series = useMemo(
        () => activeData.slice(-selectedMonths),
        [activeData, selectedMonths],
    );

    const total = useMemo(
        () => series.reduce((sum, item) => sum + item.count, 0),
        [series],
    );

    const growth = useMemo(() => {
        if (series.length < 2) return 0;
        const last = series[series.length - 1].count;
        const previous = series[series.length - 2].count;
        if (previous === 0) return last > 0 ? 100 : 0;
        return ((last - previous) / previous) * 100;
    }, [series]);

    const chartHeight = 140;
    const values = series.map((item) => item.count);
    const { topLabel, yAxisLabels } = generateYAxis(values);
    const palette = accentClasses[accent];

    if (activeData.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sem dados para este gráfico.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            {/* Cabeçalho compacto */}
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {subtitle}
                    </p>
                </div>

                {/* Período — pills compactas */}
                <div className="flex shrink-0 gap-1">
                    {MONTH_OPTIONS.map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedMonths(m)}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                                selectedMonths === m
                                    ? `${palette.activeText} bg-gray-100 dark:bg-gray-800`
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                            }`}
                        >
                            {m}M
                        </button>
                    ))}
                </div>
            </div>

            {/* Mini-stats inline */}
            <div className="mb-2 flex items-baseline gap-4 text-xs">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                    {total}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                    total {selectedMonths}M
                </span>
                <span
                    className={`ml-auto font-medium ${
                        growth >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                    }`}
                >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(0)}%
                </span>
            </div>

            {/* Gráfico de barras */}
            <div className="relative">
                <div
                    className="grid items-end gap-[3px]"
                    style={{
                        height: `${chartHeight}px`,
                        gridTemplateColumns: `24px repeat(${series.length}, 1fr)`,
                    }}
                >
                    {/* Y-axis */}
                    <div
                        className="flex flex-col justify-between text-[9px] text-gray-400 dark:text-gray-600"
                        style={{ height: `${chartHeight - 16}px` }}
                    >
                        {yAxisLabels.map((label) => (
                            <p key={label} className="text-right leading-none">
                                {label}
                            </p>
                        ))}
                    </div>

                    {series.map((item, index) => {
                        const barHeight =
                            (chartHeight - 16) *
                            (topLabel > 0 ? item.count / topLabel : 0);
                        const isLast = index === series.length - 1;

                        return (
                            <div
                                key={`${item.month}-${index}`}
                                className="group relative flex flex-col items-center"
                            >
                                {/* Tooltip */}
                                <div className="pointer-events-none absolute -top-5 left-1/2 z-10 -translate-x-1/2 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    {item.count}
                                </div>

                                <div
                                    className={`w-full rounded-t transition-all duration-200 ${isLast ? palette.latestBar : palette.defaultBar}`}
                                    style={{
                                        height: `${Math.max(2, barHeight)}px`,
                                    }}
                                />
                                <p className="mt-1 text-[9px] leading-none text-gray-500 dark:text-gray-500">
                                    {item.month}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rodapé */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-500">
                <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Últimos {selectedMonths} meses
                </span>
                <span>vs mês anterior</span>
            </div>

            {/* Tabs de filtro (se existirem) */}
            {tabs && tabs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-100 pt-2 dark:border-gray-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedTabId(tab.id)}
                            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                                selectedTabId === tab.id
                                    ? `${palette.activeText} ${palette.activeBorder}`
                                    : "border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
