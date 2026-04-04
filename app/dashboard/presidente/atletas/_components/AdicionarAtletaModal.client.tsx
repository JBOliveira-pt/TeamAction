"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { adicionarAtleta } from "@/app/lib/actions";
import { X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

type Equipa = { id: string; nome: string };

const POSICOES = [
    "Guarda-Redes",
    "Defesa Central",
    "Defesa Esquerdo",
    "Defesa Direito",
    "Médio Defensivo",
    "Médio Centro",
    "Médio Ofensivo",
    "Extremo Esquerdo",
    "Extremo Direito",
    "Avançado Centro",
    "Outro",
];

const ESTADOS = [
    { value: "ativo", label: "Ativo" },
    { value: "suspenso", label: "Suspenso" },
    { value: "inativo", label: "Inativo" },
];

const MAOS = [
    { value: "direita", label: "Direita" },
    { value: "esquerda", label: "Esquerda" },
    { value: "ambidestro", label: "Ambidestro" },
];

export default function AdicionarAtletaModal({
    equipas,
}: {
    equipas: Equipa[];
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                + Adicionar Atleta
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Adicionar Atleta
                            </h2>
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
                            {/* Nome */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nome Completo{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="nome"
                                    type="text"
                                    placeholder="Ex: João Silva"
                                    required
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Equipa + Estado */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Equipa
                                    </label>
                                    <select
                                        name="equipa_id"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Sem equipa</option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Estado{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="estado"
                                        required
                                        defaultValue="ativo"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
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

                            {/* Mão Dominante */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Mão Dominante
                                </label>
                                <select
                                    name="mao_dominante"
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Seleciona</option>
                                    {MAOS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Federado */}
                            <div className="flex items-center gap-3 py-1">
                                <input
                                    id="federado"
                                    name="federado"
                                    type="checkbox"
                                    className="w-4 h-4 rounded accent-blue-600"
                                />
                                <label
                                    htmlFor="federado"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Atleta Federado
                                </label>
                            </div>

                            {/* Nº Federado */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nº Federado
                                </label>
                                <input
                                    name="numero_federado"
                                    type="text"
                                    placeholder="Ex: FPF-12345"
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                />
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
