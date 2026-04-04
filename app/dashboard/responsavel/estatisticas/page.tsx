'use client';

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const avaliacoesMock = [
    { mes: 'Out', valor: 82 },
    { mes: 'Nov', valor: 78 },
    { mes: 'Dez', valor: 85 },
    { mes: 'Jan', valor: 80 },
    { mes: 'Fev', valor: 88 },
    { mes: 'Mar', valor: 84 },
];

const presencaMock = [
    { mes: 'Out', valor: 90 },
    { mes: 'Nov', valor: 85 },
    { mes: 'Dez', valor: 70 },
    { mes: 'Jan', valor: 95 },
    { mes: 'Fev', valor: 88 },
    { mes: 'Mar', valor: 92 },
];

function ChartCard({
    title,
    data,
    color,
}: {
    title: string;
    data: { mes: string; valor: number }[];
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {title}
            </span>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart
                    data={data}
                    margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[50, 100]}
                        ticks={[50, 75, 100]}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            fontSize: '12px',
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="valor"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 4, fill: color }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function PaiEstatisticasPage() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Estatísticas de treino
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Desempenho e presença do teu filho nos treinos.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                    title="Avaliações nos treinos desta temporada"
                    data={avaliacoesMock}
                    color="#3b82f6"
                />
                <ChartCard
                    title="Presença nos treinos desta temporada"
                    data={presencaMock}
                    color="#10b981"
                />
            </div>
        </main>
    );
}
