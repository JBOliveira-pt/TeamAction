import React from "react";

const liveStatsData = [
    { event: "Golo", athlete: "João Silva", time: "12'", badge: "badge-green" },
    {
        event: "Assistência",
        athlete: "Maria Costa",
        time: "18'",
        badge: "badge-blue",
    },
    { event: "Falta", athlete: "Pedro Sousa", time: "22'", badge: "badge-red" },
    {
        event: "Substituição",
        athlete: "Ana Martins",
        time: "30'",
        badge: "badge-orange",
    },
];

export default function LiveStats() {
    return (
        <div className="w-full px-4">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 text-red-700">
                            Live Stats
                        </h2>
                        <p className="text-muted text-base">
                            Acompanhe estatísticas em tempo real durante os
                            jogos.
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700">
                        Iniciar Live
                    </button>
                </div>
            </div>
            <div className="live-banner mb-8 flex items-center gap-4 rounded-lg shadow">
                <div className="live-dot"></div>
                <div className="font-bold text-red-600">LIVE</div>
                <div className="flex-1 flex justify-center gap-8">
                    <div className="text-center">
                        <div className="live-team text-muted">Sporting CP</div>
                        <div className="live-score text-2xl font-mono font-bold">
                            18
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="live-team text-muted">Tempo</div>
                        <div className="live-time text-red-600 text-xl font-mono">
                            38&apos;
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="live-team text-muted">FC Porto</div>
                        <div className="live-score text-2xl font-mono font-bold">
                            15
                        </div>
                    </div>
                </div>
                <button className="btn btn-accent text-xs">Ver Live →</button>
            </div>
            <div className="section mb-8">
                <div className="section-title text-2xl font-bold mb-4 text-red-700">
                    🔴 Eventos Recentes
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left">Evento</th>
                                <th className="py-3 px-4 text-left">Atleta</th>
                                <th className="py-3 px-4 text-left">Tempo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveStatsData.map((ev, idx) => (
                                <tr key={idx} className="hover:bg-gray-100">
                                    <td className="py-3 px-4">
                                        <span className={`badge ${ev.badge}`}>
                                            {ev.event}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-medium">
                                        {ev.athlete}
                                    </td>
                                    <td className="py-3 px-4">{ev.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
