"use client";

import { useActionState, useState } from "react";
import { registarResultado } from "@/app/lib/actions";
import { X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

type Jogo = {
    id: string;
    adversario: string;
    data: string;
};

export default function RegistarResultadoModal({ jogo }: { jogo: Jogo }) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        registarResultado,
        null,
    );
    const [prevState, setPrevState] = useState(state);

    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) setOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
                Registar resultado
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Registar Resultado
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    vs {jogo.adversario} ·{" "}
                                    {new Date(jogo.data).toLocaleDateString(
                                        "pt-PT",
                                        { day: "2-digit", month: "short" },
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {state?.error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {state.error}
                            </div>
                        )}

                        <form action={action} className="space-y-4">
                            <input type="hidden" name="id" value={jogo.id} />

                            {/* Resultado */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Nós{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="resultado_nos"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-2xl font-bold text-center text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <span className="text-2xl font-bold text-gray-400 mt-5">
                                    —
                                </span>
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {jogo.adversario}{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="resultado_adv"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-2xl font-bold text-center text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                ℹ️ O jogo vai ser marcado automaticamente como{" "}
                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                    Realizado
                                </span>
                                .
                            </p>

                            {/* Botões */}
                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending
                                        ? "A guardar..."
                                        : "Guardar Resultado"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
