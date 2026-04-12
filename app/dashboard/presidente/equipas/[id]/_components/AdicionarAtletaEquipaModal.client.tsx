// Componente cliente de equipas (presidente).
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { adicionarAtleta } from "@/app/lib/actions";
import { X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

const POSICOES = [
    "Guarda-Redes",
    "Central",
    "Lateral Esquerdo",
    "Lateral Direito",
    "Ponta Esquerdo",
    "Ponta Direito",
    "Pivot",
];

export default function AdicionarAtletaEquipaModal({
    equipaId,
    equipaNome,
}: {
    equipaId: string;
    equipaNome: string;
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        adicionarAtleta,
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
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
                + Adicionar Atleta
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        {/* Cabeçalho */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Adicionar Atleta
                                </h2>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    Equipa: {equipaNome}
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

                        <form
                            ref={formRef}
                            action={action}
                            className="space-y-4"
                        >
                            {/* equipa_id hidden e pré-preenchido */}
                            <input
                                type="hidden"
                                name="equipa_id"
                                value={equipaId}
                            />

                            {/* Nome */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nome <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="nome"
                                    type="text"
                                    placeholder="Ex: João Silva"
                                    required
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Posição + Nº Camisola */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Posição
                                    </label>
                                    <select
                                        name="posicao"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Seleciona</option>
                                        {POSICOES.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Nº Camisola
                                    </label>
                                    <input
                                        name="numero_camisola"
                                        type="number"
                                        min="1"
                                        max="99"
                                        placeholder="Ex: 10"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Estado + Mão Dominante */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Estado
                                    </label>
                                    <select
                                        name="estado"
                                        defaultValue="ativo"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="suspenso">
                                            Suspenso
                                        </option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Mão Dominante
                                    </label>
                                    <select
                                        name="mao_dominante"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">—</option>
                                        <option value="direita">Direita</option>
                                        <option value="esquerda">
                                            Esquerda
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Federado */}
                            <div className="flex items-center gap-3">
                                <input
                                    id="federado_equipa"
                                    name="federado"
                                    type="checkbox"
                                    className="w-4 h-4 rounded accent-blue-600"
                                />
                                <label
                                    htmlFor="federado_equipa"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Federado
                                </label>
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
                                    {isPending
                                        ? "A adicionar..."
                                        : "Adicionar Atleta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
