'use client';

import { ShieldCheck } from 'lucide-react';

function StatCard({
    title,
    value,
    sub,
    valueColor,
}: {
    title: string;
    value: string;
    sub?: string;
    valueColor?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {title}
            </span>
            <span
                className={`text-2xl font-bold ${valueColor ?? 'text-gray-900 dark:text-white'}`}
            >
                {value}
            </span>
            {sub && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {sub}
                </span>
            )}
        </div>
    );
}

export default function PaiMedicoPage() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Médico
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Lesões, doenças e histórico médico do teu filho.
                    </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full font-medium">
                    Só leitura
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Status médico"
                    value="Disponível"
                    valueColor="text-emerald-500"
                />
                <StatCard
                    title="Lesões e doenças"
                    value="0"
                    sub="0 ativas, 0 resolvidas"
                />
                <StatCard
                    title="Dias inativo"
                    value="0"
                    sub="Na temporada ativa"
                />
                <StatCard
                    title="Lesão mais comum"
                    value="Nenhum"
                    sub="0 em todas as temporadas"
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Lesões e doenças em andamento
                    </span>
                    <span className="text-sm text-gray-400">0</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                        <ShieldCheck size={28} className="text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-base">
                            Nenhuma lesão ou doença ativa
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            O teu filho está sem lesões e disponível para todas
                            as atividades.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
