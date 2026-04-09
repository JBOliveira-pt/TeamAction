"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarComunicado } from "@/app/lib/actions";

type State = { error?: string; success?: boolean } | null;

const DESTINATARIOS = [
    { value: "todos", label: "Todos" },
    { value: "atletas", label: "Atletas" },
    { value: "treinadores", label: "Treinadores" },
    { value: "staff", label: "Staff" },
    { value: "pais", label: "Pais / Encarregados" },
];

export default function ComunicadoForm() {
    const [state, action, isPending] = useActionState<State, FormData>(
        criarComunicado,
        null
    );
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) formRef.current?.reset();
    }, [state]);

    return (
        <form ref={formRef} action={action} className="space-y-4">
            {state?.error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {state.error}
                </div>
            )}
            {state?.success && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                    Comunicado enviado com sucesso!
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Título <span className="text-red-400">*</span>
                </label>
                <input
                    name="titulo"
                    type="text"
                    placeholder="Ex: Convocatória para treino"
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Destinatários <span className="text-red-400">*</span>
                </label>
                <select
                    name="destinatarios"
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                    <option value="">Seleciona os destinatários</option>
                    {DESTINATARIOS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Conteúdo <span className="text-red-400">*</span>
                </label>
                <textarea
                    name="conteudo"
                    rows={5}
                    placeholder="Escreve a mensagem do comunicado..."
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    {isPending ? "A enviar..." : "Enviar Comunicado"}
                </button>
            </div>
        </form>
    );
}



