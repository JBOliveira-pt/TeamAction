"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Autorizacao = {
    id: string;
    autorizado_a: string;
    tipo_acao: string;
    notas: string | null;
    created_at: string;
};

const tipoStyle: Record<string, string> = {
    "Aprovação":     "bg-emerald-500/10 text-emerald-400",
    "Recusa":        "bg-red-500/10 text-red-400",
    "Transferência": "bg-blue-500/10 text-blue-400",
    "Suspensão":     "bg-amber-500/10 text-amber-400",
    "Outro":         "bg-gray-500/10 text-gray-400",
};

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit", month: "long", year: "numeric",
    });

export default function AutorizacaoModal({ autorizacao }: { autorizacao: Autorizacao }) {
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
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoStyle[autorizacao.tipo_acao] ?? "bg-gray-500/10 text-gray-400"}`}>
                                    {autorizacao.tipo_acao}
                                </span>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    {formatData(autorizacao.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Autorizado a */}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Autorizado a</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{autorizacao.autorizado_a}</p>
                        </div>

                        {/* Notas */}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notas</p>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {autorizacao.notas ?? "Sem notas adicionais."}
                            </div>
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
