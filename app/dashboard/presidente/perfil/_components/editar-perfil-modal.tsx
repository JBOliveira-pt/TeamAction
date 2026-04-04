"use client";

import { useActionState, useState } from "react";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { atualizarMeuPerfil } from "@/app/lib/actions";

interface Props {
    firstName: string;
    lastName: string;
    iban: string | null;
}

export function EditarPerfilModal({ firstName, lastName, iban }: Props) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState(atualizarMeuPerfil, null);
    const [prevState, setPrevState] = useState(state);

    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) setOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
                <PencilSquareIcon className="w-4 h-4" />
                Editar Perfil
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setOpen(false);
                    }}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4 p-6 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Editar Perfil
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form action={action} className="space-y-4">
                            {/* Nome + Apelido */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nome
                                    </label>
                                    <input
                                        name="firstName"
                                        defaultValue={firstName}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Apelido
                                    </label>
                                    <input
                                        name="lastName"
                                        defaultValue={lastName}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* IBAN */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    IBAN
                                </label>
                                <input
                                    name="iban"
                                    defaultValue={iban ?? ""}
                                    placeholder="PT50..."
                                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Sem espaços — ex: PT50000201231234567890154
                                </p>
                            </div>

                            {/* Erro */}
                            {state?.error && (
                                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                    {state.error}
                                </p>
                            )}

                            {/* Botões */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isPending ? "A guardar..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
