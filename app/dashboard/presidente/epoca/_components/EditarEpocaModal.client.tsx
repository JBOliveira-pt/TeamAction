// Modal para editar datas da época (presidente).
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { editarEpoca } from "@/app/lib/actions";
import { Pencil, X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

export default function EditarEpocaModal({
    epocaId,
    dataInicio,
    dataFim,
}: {
    epocaId: string;
    dataInicio: string;
    dataFim: string;
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        editarEpoca,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);

    const [prevState, setPrevState] = useState(state);
    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) setOpen(false);
    }
    useEffect(() => {
        if (state?.success) formRef.current?.reset();
    }, [state]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                <Pencil size={15} />
                Editar Datas
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        {/* Cabeçalho */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Editar Datas da Época
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Todos os treinadores e atletas federados serão
                            notificados da alteração.
                        </p>

                        {state?.error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {state.error}
                            </div>
                        )}

                        <form
                            ref={formRef}
                            action={action}
                            className="space-y-4"
                        >
                            <input
                                type="hidden"
                                name="epoca_id"
                                value={epocaId}
                            />

                            {/* Data Início + Data Fim */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Data de Início{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="data_inicio"
                                        type="date"
                                        required
                                        defaultValue={dataInicio}
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Data de Fim{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="data_fim"
                                        type="date"
                                        required
                                        defaultValue={dataFim}
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Botões */}
                            <div className="flex justify-end gap-3 pt-2">
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
                                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending
                                        ? "A guardar..."
                                        : "Guardar Alterações"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
