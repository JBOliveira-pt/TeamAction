import React from "react";

const macrosData = [
    { label: "Proteína", value: "165g / 180g", percent: 91, color: "#00d4ff" },
    { label: "Hidratos", value: "280g / 320g", percent: 87, color: "#10b981" },
    { label: "Gordura", value: "62g / 70g", percent: 88, color: "#f59e0b" },
];

export default function Nutrition() {
    return (
        <div className="w-full px-4">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 text-orange-700">
                            Nutrição
                        </h2>
                        <p className="text-muted text-base">
                            Gestão de planos alimentares e registo nutricional.
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700">
                        ＋ Novo Plano
                    </button>
                </div>
            </div>
            <div className="card mb-8 rounded-lg shadow">
                {macrosData.map((macro, idx) => (
                    <div key={idx} className="macro-bar mb-4">
                        <div className="macro-label flex justify-between text-base mb-2">
                            <span>{macro.label}</span>
                            <span style={{ color: macro.color }}>
                                {macro.value}
                            </span>
                        </div>
                        <div className="macro-track h-2 bg-gray-200 rounded">
                            <div
                                className="macro-fill h-2 rounded"
                                style={{
                                    width: `${macro.percent}%`,
                                    background: macro.color,
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
                <div className="text-center pt-2 text-base text-muted">
                    2.840 kcal consumidas de 3.200 kcal
                </div>
            </div>
        </div>
    );
}
