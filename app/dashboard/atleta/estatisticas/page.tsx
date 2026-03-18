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

// mock – substituir por fetch real
const desempenhomock: { mes: string; valor: number }[] = [];
const presencaMock: { sessao: number; presenca: number }[] = [];

function ChartCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {title}
            </span>
            {children}
        </div>
    );
}

export default function EstatisticasTreinoPage() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    Estatísticas de treino
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Desempenho do jogador */}
                <ChartCard title="Desempenho do jogador">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart
                            data={desempenhomock}
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
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
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
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#3b82f6' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Presença */}
                <ChartCard title="Presença">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart
                            data={presencaMock}
                            margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="sessao"
                                type="number"
                                domain={[0, 4]}
                                ticks={[0, 1, 2, 3, 4]}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
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
                                dataKey="presenca"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#10b981' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </main>
    );
}
