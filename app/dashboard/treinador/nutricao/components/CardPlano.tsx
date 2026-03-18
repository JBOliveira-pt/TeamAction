// CardPlano.tsx
// Card para visualização de um plano nutricional no histórico
import React from "react";
import { NutritionPlan } from "../nutricao";

type CardPlanoProps = {
    plan: NutritionPlan;
    onView: (plan: NutritionPlan) => void;
    onEdit: (plan: NutritionPlan) => void;
    onExport: (plan: NutritionPlan) => void;
    onShare: (plan: NutritionPlan) => void;
};

export default function CardPlano({
    plan,
    onView,
    onEdit,
    onExport,
    onShare,
}: CardPlanoProps) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-xl p-5 shadow flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="font-bold text-orange-700 dark:text-orange-300 text-lg">
                    {plan.name}
                </div>
                <span className="text-xs text-gray-400">{plan.createdAt}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {plan.description}
            </div>
            <div className="flex gap-2 mt-2">
                <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded px-2 py-1 text-xs font-semibold">
                    P: {plan.macros.proteina}
                </span>
                <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded px-2 py-1 text-xs font-semibold">
                    H: {plan.macros.hidratos}
                </span>
                <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded px-2 py-1 text-xs font-semibold">
                    G: {plan.macros.gordura}
                </span>
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <button
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold"
                    onClick={() => onView(plan)}
                >
                    Ver
                </button>
                <button
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold"
                    onClick={() => onEdit(plan)}
                >
                    Editar
                </button>
                <button
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                    onClick={() => onExport(plan)}
                    title="Exportar plano (JSON)"
                >
                    <span className="text-base">⬇️</span> Exportar
                </button>
                <button
                    className="px-3 py-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                    onClick={() => onShare(plan)}
                    title="Partilhar plano (copiar JSON)"
                >
                    <span className="text-base">🔗</span> Partilhar
                </button>
            </div>
        </div>
    );
}
