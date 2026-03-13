import React from "react";

const gamesData = [
    {
        date: "28 Fev",
        opponent: "FC Porto",
        result: "28-22 V",
        badge: "badge-green",
        location: "Casa",
    },
    {
        date: "21 Fev",
        opponent: "Benfica",
        result: "19-24 D",
        badge: "badge-red",
        location: "Fora",
    },
    {
        date: "14 Fev",
        opponent: "Braga",
        result: "25-25 E",
        badge: "badge-orange",
        location: "Casa",
    },
    {
        date: "07 Fev",
        opponent: "ABC Braga",
        result: "31-18 V",
        badge: "badge-green",
        location: "Casa",
    },
];

export default function Games() {
    return (
        <div className="w-full px-4">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 text-orange-700">
                            Jogos
                        </h2>
                        <p className="text-muted text-base">
                            Planeie e acompanhe jogos e competições.
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700">
                        ＋ Novo Jogo
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card border border-orange-400 bg-orange-50 rounded-lg shadow">
                    <div className="card-title text-orange-700">
                        Jogos Realizados
                    </div>
                    <div className="card-value text-orange-700">12</div>
                    <div className="card-sub">8V · 2E · 2D</div>
                </div>
                <div className="card border border-green-400 bg-green-50 rounded-lg shadow">
                    <div className="card-title text-green-700">
                        Próximo Jogo
                    </div>
                    <div className="card-value text-green-700 text-base">
                        Dom 16h
                    </div>
                    <div className="card-sub">vs Belenenses · Fora</div>
                </div>
            </div>
            <div className="section mb-8">
                <div className="section-title text-2xl font-bold mb-4 text-orange-700">
                    🏅 Últimos Jogos
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left">Data</th>
                                <th className="py-3 px-4 text-left">
                                    Adversário
                                </th>
                                <th className="py-3 px-4 text-left">
                                    Resultado
                                </th>
                                <th className="py-3 px-4 text-left">Local</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gamesData.map((g, idx) => (
                                <tr key={idx} className="hover:bg-gray-100">
                                    <td className="py-3 px-4 font-medium">
                                        {g.date}
                                    </td>
                                    <td className="py-3 px-4">{g.opponent}</td>
                                    <td className="py-3 px-4">
                                        <span className={`badge ${g.badge}`}>
                                            {g.result}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{g.location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
