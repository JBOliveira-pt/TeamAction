'use client';

import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const autorizacoesMock: {
    titulo: string;
    descricao: string;
    prazo: string;
    estado: 'pendente' | 'assinado';
}[] = [];

export default function PaiAutorizacoesPage() {
    const [assinados, setAssinados] = useState<Set<number>>(new Set());

    function assinar(i: number) {
        setAssinados((prev) => new Set([...prev, i]));
    }

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Autorizações
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Documentos pendentes de assinatura (saídas, eventos,
                    declarações).
                </p>
            </div>

            <div className="space-y-3">
                {autorizacoesMock.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                            <ShieldCheck
                                size={28}
                                className="text-emerald-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Sem autorizações pendentes
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Quando o clube enviar documentos para assinar,
                                aparecerão aqui.
                            </p>
                        </div>
                    </div>
                ) : (
                    autorizacoesMock.map((a, i) => {
                        const signed =
                            assinados.has(i) || a.estado === 'assinado';
                        return (
                            <div
                                key={i}
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex items-start justify-between gap-4"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {a.titulo}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {a.descricao}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        Prazo: {a.prazo}
                                    </span>
                                </div>
                                {signed ? (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full shrink-0">
                                        <ShieldCheck size={12} /> Assinado
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => assinar(i)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0"
                                    >
                                        Assinar
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
