// Componente delete user danger zone.
"use client";

import { useState, useTransition } from "react";
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

const REQUIRED_CONFIRM_TEXT = "deletarconta";

export function AdminDeleteUserDangerZone({
    deleteAction,
}: {
    deleteAction: (formData: FormData) => Promise<void>;
}) {
    const [showModal, setShowModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isPending, startTransition] = useTransition();
    const [done, setDone] = useState(false);

    function handleSubmit() {
        const fd = new FormData();
        fd.set("deleteConfirmation", confirmText);

        startTransition(async () => {
            try {
                await deleteAction(fd);
            } catch {
                // redirect() do server action lança NEXT_REDIRECT — é esperado.
            }
            // Se não houve redirect (cenário improvável), mostrar sucesso.
            setDone(true);
        });
    }

    return (
        <section className="rounded-xl border border-rose-800 bg-rose-300 p-5 dark:border-rose-900 dark:bg-rose-900/80">
            <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-rose-600 dark:text-rose-400" />
                <div className="space-y-2">
                    <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">
                        Zona de{" "}
                        <span className="text-rose-600 dark:text-rose-400">
                            PERIGO
                        </span>
                    </h2>
                    <p className="text-sm text-rose-800 dark:text-rose-300">
                        ALERTA: Excluir este utilizador removerá permanentemente
                        a conta e todos os dados vinculados na base de dados.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
                    >
                        Excluir utilizador
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-xl border border-rose-300 bg-white p-5 shadow-2xl dark:border-rose-900/60 dark:bg-gray-900">
                        {/* Estado: a apagar */}
                        {isPending && (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <svg
                                    className="h-10 w-10 animate-spin text-rose-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    A apagar todos os dados do utilizador...
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Por favor aguarde, esta operação pode
                                    demorar alguns segundos.
                                </p>
                            </div>
                        )}

                        {/* Estado: concluído (fallback se redirect não ocorreu) */}
                        {done && !isPending && (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Todos os dados foram apagados com sucesso.
                                </p>
                            </div>
                        )}

                        {/* Estado: confirmação */}
                        {!isPending && !done && (
                            <>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Confirmar exclusão permanente
                                </h3>
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                    Esta ação é irreversível. Todos os dados
                                    vinculados a este utilizador serão excluídos
                                    da base de dados.
                                </p>

                                <p className="mt-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Para confirmar, digite
                                    <span className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-rose-700 dark:bg-gray-800 dark:text-rose-300">
                                        {REQUIRED_CONFIRM_TEXT}
                                    </span>
                                </p>

                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(event) =>
                                        setConfirmText(event.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                    placeholder="Digite deletarconta"
                                />

                                <div className="mt-5 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setConfirmText("");
                                        }}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            confirmText !==
                                            REQUIRED_CONFIRM_TEXT
                                        }
                                        onClick={handleSubmit}
                                        className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Excluir permanentemente
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
