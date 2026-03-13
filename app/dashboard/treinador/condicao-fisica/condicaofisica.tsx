import React from "react";

const statsData = [
    { label: "Velocidade (30m)", value: "4.2s", percent: 78, color: "#00d4ff" },
    {
        label: "Impulsão Vertical",
        value: "52cm",
        percent: 65,
        color: "#10b981",
    },
    { label: "VO2max (média)", value: "54.3", percent: 72, color: "#f59e0b" },
    { label: "Força (kg Press)", value: "98kg", percent: 83, color: "#8b5cf6" },
];

export default function PhysicalCondition() {
    return (
        <div className="w-full px-4">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 text-green-700">
                            Condição Física
                        </h2>
                        <p className="text-muted text-base">
                            Monitorize a condição física dos atletas.
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">
                        ＋ Nova Avaliação
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statsData.map((stat, idx) => (
                    <div
                        key={idx}
                        className="stat-card flex flex-col items-center gap-3 p-4 border rounded-lg shadow"
                    >
                        <span
                            className="stat-label"
                            style={{ width: "140px", color: "#64748b" }}
                        >
                            {stat.label}
                        </span>
                        <div className="stat-bar-wrap flex-1 h-2 bg-gray-200 rounded">
                            <div
                                className="stat-bar h-2 rounded"
                                style={{
                                    width: `${stat.percent}%`,
                                    background: stat.color,
                                }}
                            ></div>
                        </div>
                        <span
                            className="stat-value font-mono font-bold"
                            style={{ width: "60px" }}
                        >
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
