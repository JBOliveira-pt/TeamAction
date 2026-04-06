"use client";

import { atribuirTreinadorEquipa } from "@/app/lib/actions";
import { X } from "lucide-react";
import { useActionState, useState } from "react";

type State = { error?: string; success?: boolean } | null;
type Treinador = { id: string; name: string; email: string };

export default function AtribuirTreinadorModal({
    equipaId,
    equipaNome,
    treinadorAtualId,
    treinadores,
}: {
    equipaId: string;
    equipaNome: string;
    treinadorAtualId: string | null;
    treinadores: Treinador[];
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        atribuirTreinadorEquipa,
        null,
    );
    const [prevState, setPrevState] = useState(state);
    const [mode, setMode] = useState<"real" | "fake">(
        treinadorAtualId ? "real" : "fake",
    );
    const [fakeNome, setFakeNome] = useState("");
    const [fakeEmail, setFakeEmail] = useState("");

    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            setOpen(false);
            setFakeNome("");
            setFakeEmail("");
        }
    }

    const inputClass =
        "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
                {treinadorAtualId ? "Alterar" : "Atribuir treinador"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Atribuir Treinador
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {equipaNome}
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

                        <form action={action} className="space-y-4">
                            <input
                                type="hidden"
                                name="equipa_id"
                                value={equipaId}
                            />
                            <input
                                type="hidden"
                                name="treinador_mode"
                                value={mode}
                            />
                            <input
                                type="hidden"
                                name="treinador_nome_fake"
                                value={mode === "fake" ? fakeNome : ""}
                            />
                            <input
                                type="hidden"
                                name="treinador_email_fake"
                                value={mode === "fake" ? fakeEmail : ""}
                            />

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode("real")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                        mode === "real"
                                            ? "bg-violet-600 text-white border-violet-600"
                                            : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-violet-500"
                                    }`}
                                >
                                    Existente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("fake")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                        mode === "fake"
                                            ? "bg-violet-600 text-white border-violet-600"
                                            : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-violet-500"
                                    }`}
                                >
                                    Novo (nome)
                                </button>
                            </div>

                            {mode === "real" && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Treinador
                                    </label>
                                    {treinadores.length === 0 ? (
                                        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
                                            Nenhum treinador registado na
                                            organização.
                                        </p>
                                    ) : (
                                        <select
                                            name="treinador_id"
                                            defaultValue={
                                                treinadorAtualId ?? ""
                                            }
                                            className={inputClass}
                                        >
                                            <option value="">
                                                Seleciona treinador
                                            </option>
                                            {treinadores.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} — {t.email}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {mode === "fake" && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={fakeNome}
                                        onChange={(e) =>
                                            setFakeNome(e.target.value)
                                        }
                                        placeholder="Nome do treinador"
                                        className={inputClass}
                                    />
                                    <input
                                        type="email"
                                        value={fakeEmail}
                                        onChange={(e) =>
                                            setFakeEmail(e.target.value)
                                        }
                                        placeholder="Email do treinador (opcional)"
                                        className={inputClass}
                                    />
                                    <p className="text-[10px] text-gray-400">
                                        Se o email pertencer a um treinador
                                        registado, será enviado um convite. Caso
                                        contrário, o admin será notificado.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isPending ||
                                        (mode === "real" &&
                                            treinadores.length === 0) ||
                                        (mode === "fake" && !fakeNome.trim())
                                    }
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
                                >
                                    {isPending ? "A guardar…" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
