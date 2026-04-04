"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registarPagamento } from "@/app/lib/actions";
import { X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

const MESES = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
];

const ESTADOS = [
    { value: "pago", label: "Pago" },
    { value: "pendente", label: "Pendente" },
    { value: "em_atraso", label: "Em Atraso" },
];

export default function RegistarPagamentoModal({
    atletaId,
}: {
    atletaId: string;
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        registarPagamento,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);

    const anoAtual = new Date().getFullYear();
    const mesAtual = String(new Date().getMonth() + 1);

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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
                Registar Pagamento
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Registar Pagamento
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
                            {/* atleta_id hidden */}
                            <input
                                type="hidden"
                                name="atleta_id"
                                value={atletaId}
                            />

                            {/* Mês + Ano */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Mês{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="mes"
                                        defaultValue={mesAtual}
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {MESES.map((m) => (
                                            <option
                                                key={m.value}
                                                value={m.value}
                                            >
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Ano{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="ano"
                                        defaultValue={String(anoAtual)}
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {[
                                            anoAtual - 1,
                                            anoAtual,
                                            anoAtual + 1,
                                        ].map((a) => (
                                            <option key={a} value={String(a)}>
                                                {a}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Valor + Estado */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Valor (€){" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                            €
                                        </span>
                                        <input
                                            name="valor"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            required
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Estado{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="estado"
                                        defaultValue="pago"
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {ESTADOS.map((e) => (
                                            <option
                                                key={e.value}
                                                value={e.value}
                                            >
                                                {e.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Data de Pagamento */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Data de Pagamento
                                </label>
                                <input
                                    name="data_pagamento"
                                    type="date"
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                                    {isPending ? "A registar..." : "Registar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
