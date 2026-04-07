"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { adicionarMembro } from "@/app/lib/actions";
import { X } from "lucide-react";

type Equipa = { id: string; nome: string; escalao: string };

const FUNCOES = [
    "Fisioterapeuta",
    "Preparador Físico",
    "Team Manager",
    "Médico",
    "Nutricionista",
    "Delegado",
    "Outro",
];

export function AdicionarMembroModal({ equipas }: { equipas: Equipa[] }) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState(adicionarMembro, null);
    const formRef = useRef<HTMLFormElement>(null);

    const [funcao, setFuncao] = useState("");
    const [prevState, setPrevState] = useState(state);

    const filteredEquipas = equipas;

    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            setOpen(false);
            setFuncao("");
        }
    }

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
        }
    }, [state]);

    function resetState() {
        setFuncao("");
    }

    function handleFuncaoChange(val: string) {
        setFuncao(val);
    }

    const isSubmitDisabled = isPending || !funcao;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                + Novo Membro
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => {
                            setOpen(false);
                            resetState();
                        }}
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Adicionar Membro de Staff
                            </h2>
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    resetState();
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                            {/* Função */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Função{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="funcao"
                                    required
                                    value={funcao}
                                    onChange={(e) =>
                                        handleFuncaoChange(e.target.value)
                                    }
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">
                                        Seleciona uma função...
                                    </option>
                                    {FUNCOES.map((f) => (
                                        <option key={f} value={f}>
                                            {f}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Nome */}
                            {funcao && (
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
                            )}

                            {/* Equipa */}
                            {funcao && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Equipa
                                    </label>
                                    <select
                                        name="equipa_id"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Sem equipa</option>
                                        {filteredEquipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                                {e.escalao
                                                    ? ` — ${e.escalao}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        resetState();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitDisabled}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending
                                        ? "A adicionar..."
                                        : "Adicionar Membro"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
