// CardMacro.tsx
// Card para visualização de um macronutriente
import React from "react";

type CardMacroProps = {
    label: string;
    value: string;
    percent: number;
    color: string;
};

export default function CardMacro({
    label,
    value,
    percent,
    color,
}: CardMacroProps) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-xl p-6 shadow-md flex flex-col justify-between">
            <span
                className="text-xs text-gray-500 font-semibold mb-1"
                style={{ minWidth: "120px" }}
            >
                {label}
            </span>
            <span className="text-3xl font-bold" style={{ color }}>
                {value}
            </span>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mt-2">
                <div
                    className="h-3 rounded-lg transition-all"
                    style={{ width: `${percent}%`, background: color }}
                ></div>
            </div>
        </div>
    );
}
