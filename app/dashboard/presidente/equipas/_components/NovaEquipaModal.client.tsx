"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarEquipa } from "@/app/lib/actions";
import { X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

const ESCALOES = [
    "Sub-8", "Sub-10", "Sub-12", "Sub-14",
    "Sub-16", "Sub-18", "Sub-20", "Juniores", "Seniores",
];

const DESPORTOS = [
    "Futebol", "Futsal", "Basquetebol",
    "Andebol", "Voleibol", "Rugby", "Outro",
];

const ESTADOS = [
    { value: "ativa",        label: "Ativa" },
    { value: "periodo_off",  label: "Período Off" },
    { value: "inativa",      label: "Inativa" },
];

export default function NovaEquipaModal() {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        criarEquipa,
        null
    );
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            setOpen(false);
        }
    }, [state]);

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
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nova Equipa</h2>
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

                        <form ref={formRef} action={action} className="space-y-4">
                            {/* Nome */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nome da Equipa <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="nome"
                                    type="text"
                                    placeholder="Ex: Futebol Seniores A"
                                    required
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Escalão + Desporto */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Escalão <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="escalao"
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Seleciona</option>
                                        {ESCALOES.map((e) => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Desporto <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="desporto"
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Seleciona</option>
                                        {DESPORTOS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Estado <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="estado"
                                    required
                                    defaultValue="ativa"
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    {ESTADOS.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
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
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
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
