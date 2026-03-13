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

const alturaMock = [
    { mes: 'Set', valor: 170 },
    { mes: 'Out', valor: 170 },
    { mes: 'Nov', valor: 171 },
    { mes: 'Dez', valor: 171 },
    { mes: 'Jan', valor: 172 },
    { mes: 'Fev', valor: 172 },
];

const pesoMock = [
    { mes: 'Set', valor: 65 },
    { mes: 'Out', valor: 64 },
    { mes: 'Nov', valor: 65 },
    { mes: 'Dez', valor: 66 },
    { mes: 'Jan', valor: 65 },
    { mes: 'Fev', valor: 64 },
];

function ChartCard({
    title,
    data,
    color,
    unit,
}: {
    title: string;
    data: { mes: string; valor: number }[];
    color: string;
    unit: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {title}
            </span>
            <ResponsiveContainer width="100%" height={240}>
                <LineChart
                    data={data}
                    margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
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
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        unit={unit}
                    />
                    <Tooltip
                        formatter={(v) => [`${v}${unit}`, title]}
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

function StatCard({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
            </span>
            <span className="text-xs text-gray-400">{sub}</span>
        </div>
    );
}

export default function PaiCondicaoFisicaPage() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Condição Física
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Evolução de peso e altura do teu filho.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Altura atual"
                    value="172 cm"
                    sub="Atualizado em fev."
                />
                <StatCard
                    label="Peso atual"
                    value="64 kg"
                    sub="Atualizado em fev."
                />
                <StatCard label="IMC" value="21.6" sub="Peso normal" />
                <StatCard
                    label="Variação peso"
                    value="-1 kg"
                    sub="Desde o início da época"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                    title="Evolução da altura (cm)"
                    data={alturaMock}
                    color="#3b82f6"
                    unit=" cm"
                />
                <ChartCard
                    title="Evolução do peso (kg)"
                    data={pesoMock}
                    color="#10b981"
                    unit=" kg"
                />
            </div>
        </main>
    );
}
