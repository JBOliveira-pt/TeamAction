'use client';

import { useActionState, useEffect, useState } from 'react';
import { editarMembro } from '@/app/lib/actions';
import { X } from 'lucide-react';

type State = { error?: string; success?: boolean } | null;
type Equipa = { id: string; nome: string };
type Membro = {
    id:        string;
    nome:      string;
    funcao:    string;
    equipa_id: string | null;
};

const FUNCOES = [
    { value: "treinador",         label: "Treinador Principal" },
    { value: "treinador_adjunto", label: "Treinador Adjunto" },
    { value: "fisioterapeuta",    label: "Fisioterapeuta" },
    { value: "medico",            label: "Equipa Médica" },
    { value: "preparador_fisico", label: "Preparador Físico" },
];

export default function EditarMembroModal({ membro, equipas }: { membro: Membro; equipas: Equipa[] }) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(editarMembro, null);

    useEffect(() => {
        if (state?.success) setOpen(false);
    }, [state]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
                Editar
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Editar Membro</h2>
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

                        <form action={action} className="space-y-4">
                            <input type="hidden" name="id" value={membro.id} />

                            {/* Nome */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nome Completo <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="nome"
                                    type="text"
                                    defaultValue={membro.nome}
                                    required
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Função + Equipa */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Função <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="funcao"
                                        defaultValue={membro.funcao}
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Seleciona</option>
                                        {FUNCOES.map((f) => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Equipa</label>
                                    <select
                                        name="equipa_id"
                                        defaultValue={membro.equipa_id ?? ''}
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Todas</option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>{e.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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
                                    {isPending ? 'A guardar...' : 'Guardar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
