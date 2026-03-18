"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Comunicado = {
    id: string;
    titulo: string;
    conteudo: string;
    destinatarios: string;
    created_at: string;
};

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit", month: "long", year: "numeric",
    });

export default function ComunicadoModal({ comunicado }: { comunicado: Comunicado }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
                Ver →
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{comunicado.titulo}</h2>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formatData(comunicado.created_at)} · Para: {comunicado.destinatarios}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Conteúdo */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {comunicado.conteudo}
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
