"use client";

import { useState, useTransition } from "react";
import { X, Trash2, UserMinus } from "lucide-react";
import {
    eliminarAtletaFicticio,
    desvincularAtletaReal,
} from "@/app/lib/actions";

type Atleta = {
    id: string;
    nome: string;
    user_id: string | null;
};

export default function RemoverAtletaModal({ atleta }: { atleta: Atleta }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [erro, setErro] = useState<string | null>(null);

    const isFicticio = !atleta.user_id;

    const handleConfirm = () => {
        setErro(null);
        startTransition(async () => {
            const result = isFicticio
                ? await eliminarAtletaFicticio(atleta.id)
                : await desvincularAtletaReal(atleta.id);
            if (result.error) {
                setErro(result.error);
            } else {
                setOpen(false);
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={`text-xs font-medium transition-colors ${
                    isFicticio
                        ? "text-red-400 hover:text-red-300"
                        : "text-orange-400 hover:text-orange-300"
                }`}
                title={
                    isFicticio
                        ? "Eliminar atleta fictício"
                        : "Desvincular atleta"
                }
            >
                {isFicticio ? "Eliminar" : "Desvincular"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isPending && setOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isFicticio ? (
                                    <Trash2
                                        size={18}
                                        className="text-red-400"
                                    />
                                ) : (
                                    <UserMinus
                                        size={18}
                                        className="text-orange-400"
                                    />
                                )}
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {isFicticio
                                        ? "Eliminar Atleta"
                                        : "Desvincular Atleta"}
                                </h2>
                            </div>
                            <button
                                onClick={() => !isPending && setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div
                            className={`rounded-xl p-3 ${
                                isFicticio
                                    ? "bg-red-500/10 border border-red-500/20"
                                    : "bg-orange-500/10 border border-orange-500/20"
                            }`}
                        >
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {isFicticio ? (
                                    <>
                                        Tens a certeza que queres eliminar o
                                        atleta fictício{" "}
                                        <strong>{atleta.nome}</strong>? Esta
                                        ação é irreversível.
                                    </>
                                ) : (
                                    <>
                                        Tens a certeza que queres desvincular{" "}
                                        <strong>{atleta.nome}</strong> do clube?
                                        O atleta será notificado.
                                    </>
                                )}
                            </p>
                        </div>

                        {erro && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {erro}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => !isPending && setOpen(false)}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className={`px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isFicticio
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-orange-600 hover:bg-orange-700"
                                }`}
                            >
                                {isPending
                                    ? "A processar..."
                                    : isFicticio
                                      ? "Eliminar"
                                      : "Desvincular"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
