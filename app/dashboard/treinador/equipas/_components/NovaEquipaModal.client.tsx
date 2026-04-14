// Componente cliente de criar equipa (treinador).
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarEquipaTreinador } from "@/app/lib/actions";
import { X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;
type Escalao = { id: number; nome: string };

const ESTADOS = [
    { value: "ativa", label: "Ativa" },
    { value: "periodo_off", label: "Período Off" },
    { value: "inativa", label: "Inativa" },
];

export default function NovaEquipaModal({
    escaloes,
    desporto,
    defaultOpen = false,
}: {
    escaloes: Escalao[];
    desporto: string;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [state, action, isPending] = useActionState<State, FormData>(
        criarEquipaTreinador,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const [prevState, setPrevState] = useState(state);
    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            setOpen(false);
            setLocalError(null);
        } else if (state?.error) {
            setLocalError(state.error);
        }
    }
    useEffect(() => {
        if (state?.success) formRef.current?.reset();
    }, [state]);

    function handleClose() {
        setOpen(false);
        setLocalError(null);
    }

    const inputClass =
        "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors";
    const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                + Nova Equipa
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Nova Equipa
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {desporto && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                <span className="text-xs text-violet-400 font-medium">
                                    Desporto:
                                </span>
                                <span className="text-xs text-violet-300 font-semibold">
                                    {desporto}
                                </span>
                            </div>
                        )}

                        {localError && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {localError}
                            </div>
                        )}

                        <form
                            ref={formRef}
                            action={action}
                            className="space-y-5"
                        >
                            <input
                                type="hidden"
                                name="desporto"
                                value={desporto}
                            />

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className={labelClass}>
                                        Nome da Equipa{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="nome"
                                        type="text"
                                        placeholder="Ex: Sub-15 A"
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            Escalão{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="escalao"
                                            required
                                            className={inputClass}
                                        >
                                            <option value="">Seleciona</option>
                                            {escaloes.map((e) => (
                                                <option
                                                    key={e.id}
                                                    value={e.nome}
                                                >
                                                    {e.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            Estado{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="estado"
                                            required
                                            defaultValue="ativa"
                                            className={inputClass}
                                        >
                                            {ESTADOS.map((s) => (
                                                <option
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending ? "A criar..." : "Criar Equipa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
