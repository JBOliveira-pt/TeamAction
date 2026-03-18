"use client";

import { useActionState, useEffect, useRef } from "react";
import { atualizarOrganizacao } from "@/app/lib/actions";

type State = { error?: string; success?: boolean } | null;

type Org = {
    name:          string;
    desporto:      string | null;
    cidade:        string | null;
    pais:          string | null;
    website:       string | null;
    plano:         string | null;
    nif:           string | null;
    telefone:      string | null;
    morada:        string | null;
    codigo_postal: string | null;
};

export default function DefinicoesForm({ org }: { org: Org }) {
    const [state, action, isPending] = useActionState<State, FormData>(
        atualizarOrganizacao,
        null
    );
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [state]);

    return (
        <form ref={formRef} action={action} className="space-y-6">
            {state?.error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {state.error}
                </div>
            )}
            {state?.success && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                    Alterações guardadas com sucesso!
                </div>
            )}

            {/* Identificação */}
            <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    Identificação
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Nome do Clube <span className="text-red-400">*</span>
                        </label>
                        <input
                            name="name"
                            type="text"
                            defaultValue={org.name}
                            placeholder="Ex: Sporting CP Andebol"
                            required
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            NIF do Clube
                        </label>
                        <input
                            name="nif"
                            type="text"
                            defaultValue={org.nif ?? ""}
                            placeholder="Ex: 500123456"
                            maxLength={9}
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Modalidade</label>
                        <input
                            name="desporto"
                            type="text"
                            defaultValue={org.desporto ?? ""}
                            placeholder="Ex: Andebol"
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Telefone</label>
                        <input
                            name="telefone"
                            type="tel"
                            defaultValue={org.telefone ?? ""}
                            placeholder="Ex: 213 456 789"
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Website</label>
                        <input
                            name="website"
                            type="url"
                            defaultValue={org.website ?? ""}
                            placeholder="https://www.exemplo.pt"
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Localização */}
            <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    Localização
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Morada</label>
                        <input
                            name="morada"
                            type="text"
                            defaultValue={org.morada ?? ""}
                            placeholder="Ex: Rua do Clube, 123"
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Código Postal</label>
                        <input
                            name="codigo_postal"
                            type="text"
                            defaultValue={org.codigo_postal ?? ""}
                            placeholder="Ex: 1000-001"
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cidade</label>
                        <input
                            name="cidade"
                            type="text"
                            defaultValue={org.cidade ?? ""}
                            placeholder="Ex: Lisboa"
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">País</label>
                        <input
                            name="pais"
                            type="text"
                            defaultValue={org.pais ?? ""}
                            placeholder="Ex: Portugal"
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    {isPending ? "A guardar..." : "Guardar Alterações"}
                </button>
            </div>
        </form>
    );
}

