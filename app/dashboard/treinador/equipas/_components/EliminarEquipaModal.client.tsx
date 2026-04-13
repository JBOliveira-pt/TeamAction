// Componente cliente de eliminar equipa (treinador).
"use client";

import { useState, useTransition } from "react";
import { eliminarEquipaTreinador } from "@/app/lib/actions";
import { Trash2, X } from "lucide-react";

export default function EliminarEquipaModal({
    equipaId,
    equipaNome,
    totalAtletas,
}: {
    equipaId: string;
    equipaNome: string;
    totalAtletas: number;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [erro, setErro] = useState("");

    const handleEliminar = () => {
        setErro("");
        startTransition(async () => {
            const result = await eliminarEquipaTreinador(equipaId);
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
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Eliminar equipa"
            >
                <Trash2 size={15} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isPending && setOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-red-400">
                                Eliminar Equipa
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Tens a certeza que queres eliminar a equipa{" "}
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {equipaNome}
                                </span>
                                ?
                            </p>
                            {totalAtletas > 0 && (
                                <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                                    ⚠️ Esta equipa tem {totalAtletas} atleta
                                    {totalAtletas !== 1 ? "s" : ""}. Os atletas
                                    permanecerão associados a ti, mas sem equipa
                                    atribuída.
                                </div>
                            )}
                            <p className="text-xs text-gray-400">
                                Esta ação não pode ser desfeita.
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
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleEliminar}
                                disabled={isPending}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                {isPending ? "A eliminar..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
