"use client";

import { useActionState, useEffect, useRef } from "react";
import { registarAutorizacao } from "@/app/lib/actions";

type State = { error?: string; success?: boolean } | null;
type User = { id: string; name: string };

const TIPOS = ["Aprovação", "Recusa", "Transferência", "Suspensão", "Outro"];

export default function AutorizacaoForm({ users }: { users: User[] }) {
    const [state, action, isPending] = useActionState<State, FormData>(
        registarAutorizacao,
        null,
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
                    Autorização registada com sucesso!
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Autorizado a <span className="text-red-400">*</span>
                    </label>
                    {/* MUDANÇA: select em vez de input de texto */}
                    <select
                        name="autorizado_a"
                        required
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                    >
                        <option value="">Seleciona o usuário</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Tipo de Ação <span className="text-red-400">*</span>
                    </label>
                    <select
                        name="tipo_acao"
                        required
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                    >
                        <option value="">Seleciona o tipo</option>
                        {TIPOS.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Notas
                </label>
                <textarea
                    name="notas"
                    rows={3}
                    placeholder="Observações adicionais (opcional)..."
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    {isPending ? "A registar..." : "Registar Autorização"}
                </button>
            </div>
        </form>
    );
}
