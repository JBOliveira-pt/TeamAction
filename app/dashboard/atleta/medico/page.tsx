'use client';

import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

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

export default function MedicoPage() {
    const [showLesaoModal, setShowLesaoModal] = useState(false);
    const [showDoencaModal, setShowDoencaModal] = useState(false);

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            {/* header */}
            <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gerencia lesões, doenças e o histórico médico do jogador.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowLesaoModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        + Adicionar lesão
                    </button>
                    <button
                        onClick={() => setShowDoencaModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        + Adicionar doença
                    </button>
                </div>
            </div>

            {/* stat cards */}
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

            {/* active injuries/illnesses */}
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
                            Boas notícias! Atualmente está sem lesões e
                            disponível para todas as atividades. Novas lesões
                            podem ser adicionadas aqui se ocorrerem.
                        </p>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                        <button
                            onClick={() => setShowLesaoModal(true)}
                            className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                        >
                            + Adicionar nova lesão
                        </button>
                        <button
                            onClick={() => setShowDoencaModal(true)}
                            className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                        >
                            + Adicionar nova doença
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal — lesão */}
            {showLesaoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Adicionar lesão
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Tipo de lesão
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Entorse do tornozelo"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Data início
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Data prevista retorno
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Notas
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Observações adicionais..."
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowLesaoModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setShowLesaoModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal — doença */}
            {showDoencaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Adicionar doença
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Tipo de doença
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Gripe"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Data início
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Data prevista recuperação
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Notas
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Observações adicionais..."
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowDoencaModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setShowDoencaModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
