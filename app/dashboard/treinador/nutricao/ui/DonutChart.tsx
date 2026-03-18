// DonutChart.tsx
// Componente para visualização gráfica dos macronutrientes
import React from "react";

export type DonutChartData = { label: string; value: number; color: string }[];

export default function DonutChart({ data }: { data: DonutChartData }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = 60;
    const cx = 70;
    const cy = 70;
    const strokeWidth = 22;
    const segments = data.reduce<{
        prev: number;
        elements: Array<React.ReactElement>;
    }>(
        (acc, d) => {
            const startAngle = (acc.prev / total) * 2 * Math.PI;
            const endAngle = ((acc.prev + d.value) / total) * 2 * Math.PI;
            const x1 = cx + radius * Math.sin(startAngle);
            const y1 = cy - radius * Math.cos(startAngle);
            const x2 = cx + radius * Math.sin(endAngle);
            const y2 = cy - radius * Math.cos(endAngle);
            const largeArc = d.value / total > 0.5 ? 1 : 0;
            const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            ].join(" ");
            acc.elements.push(
                <path
                    key={d.label}
                    d={pathData}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />,
            );
            acc.prev += d.value;
            return acc;
        },
        { prev: 0, elements: [] },
    ).elements;
    return (
        <svg width={140} height={140} viewBox="0 0 140 140">
            {segments}
            <circle cx={cx} cy={cy} r={radius - strokeWidth / 2} fill="#fff" />
            <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="1.1em"
                className="fill-orange-700 dark:fill-orange-300 font-bold"
            >
                Macros
            </text>
        </svg>
    );
}
