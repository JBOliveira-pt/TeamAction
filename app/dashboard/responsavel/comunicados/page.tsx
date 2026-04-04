'use client';

import { Bell } from 'lucide-react';

const comunicadosMock: {
    titulo: string;
    conteudo: string;
    data: string;
    tipo: 'info' | 'aviso' | 'urgente';
}[] = [];

const tipoConfig = {
    info: {
        label: 'Info',
        cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    aviso: {
        label: 'Aviso',
        cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    urgente: {
        label: 'Urgente',
        cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

export default function PaiComunicadosPage() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Comunicados
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Avisos e notícias do clube.
                </p>
            </div>

            <div className="space-y-3">
                {comunicadosMock.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                            <Bell size={28} className="text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Nenhum comunicado
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Os comunicados do clube aparecerão aqui.
                            </p>
                        </div>
                    </div>
                ) : (
                    comunicadosMock.map((c, i) => {
                        const cfg = tipoConfig[c.tipo];
                        return (
                            <div
                                key={i}
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex flex-col gap-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {c.titulo}
                                    </span>
                                    <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.cls}`}
                                    >
                                        {cfg.label}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {c.conteudo}
                                </p>
                                <span className="text-xs text-gray-400 mt-1">
                                    {c.data}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
