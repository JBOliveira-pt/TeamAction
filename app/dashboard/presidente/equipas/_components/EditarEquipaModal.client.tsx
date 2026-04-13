// Componente cliente de equipas (presidente).
"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { editarEquipa } from "@/app/lib/actions";
import { Pencil, X, UserPlus } from "lucide-react";

type State = { error?: string; success?: boolean } | null;
type Escalao = { id: number; nome: string };
type Treinador = {
    staff_id: string;
    user_id: string | null;
    name: string;
    email: string | null;
    funcao: string;
    is_fake: boolean;
    equipa_id: string | null;
};

const ESTADOS = [
    { value: "ativa", label: "Ativa" },
    { value: "periodo_off", label: "Período Off" },
    { value: "inativa", label: "Inativa" },
];

export default function EditarEquipaModal({
    equipa,
    escaloes,
    treinadores,
}: {
    equipa: {
        id: string;
        nome: string;
        escalao: string;
        estado: string;
        staff_treinador_principal_id: string | null;
        staff_adjunto_id: string | null;
    };
    escaloes: Escalao[];
    treinadores: Treinador[];
}) {
    const disponiveis = treinadores;
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        editarEquipa,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);

    const [treinadorId, setTreinadorId] = useState(
        equipa.staff_treinador_principal_id ?? "",
    );
    const [adjuntoId, setAdjuntoId] = useState(equipa.staff_adjunto_id ?? "");

    const resetState = useCallback(() => {
        setTreinadorId(equipa.staff_treinador_principal_id ?? "");
        setAdjuntoId(equipa.staff_adjunto_id ?? "");
    }, [equipa.staff_treinador_principal_id, equipa.staff_adjunto_id]);

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resetState();
        setOpen(true);
    };

    const [prevState, setPrevState] = useState(state);
    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            setOpen(false);
        }
    }

    const inputClass =
        "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors";
    const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

    return (
        <>
            <button
                onClick={handleOpen}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Editar equipa"
            >
                <Pencil size={15} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Editar Equipa
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
                            className="space-y-5"
                        >
                            <input type="hidden" name="id" value={equipa.id} />
                            <input
                                type="hidden"
                                name="treinador_staff_id"
                                value={treinadorId}
                            />
                            <input
                                type="hidden"
                                name="adjunto_staff_id"
                                value={adjuntoId}
                            />

                            {/* === Dados da Equipa === */}
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className={labelClass}>
                                        Nome da Equipa{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="nome"
                                        type="text"
                                        defaultValue={equipa.nome}
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            Escalão{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="escalao"
                                            required
                                            defaultValue={equipa.escalao}
                                            className={inputClass}
                                        >
                                            <option value="">Seleciona</option>
                                            {escaloes.map((e) => (
                                                <option
                                                    key={e.id}
                                                    value={e.nome}
                                                >
                                                    {e.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            Estado{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="estado"
                                            required
                                            defaultValue={equipa.estado}
                                            className={inputClass}
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
                            </div>

                            {/* === Treinador Principal === */}
                            <div className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                                <div className="flex items-center gap-2">
                                    <UserPlus
                                        size={16}
                                        className="text-violet-400"
                                    />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Treinador Principal
                                    </span>
                                    <span className="text-xs text-red-400">
                                        *
                                    </span>
                                </div>

                                {disponiveis.length === 0 ? (
                                    <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <p className="text-xs text-amber-400 font-medium">
                                            ⚠️ Nenhum treinador disponível.
                                        </p>
                                        <p className="text-xs text-amber-400/80 mt-1">
                                            Adicione primeiro um treinador na
                                            página <strong>Staff</strong>.
                                        </p>
                                    </div>
                                ) : (
                                    <select
                                        value={treinadorId}
                                        onChange={(e) =>
                                            setTreinadorId(e.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="">
                                            Seleciona treinador
                                        </option>
                                        {disponiveis.map((t) => (
                                            <option
                                                key={t.staff_id}
                                                value={t.staff_id}
                                            >
                                                {t.name}
                                                {t.is_fake ? " (fictício)" : ""}
                                                {t.email ? ` — ${t.email}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* === Treinador Adjunto === */}
                            <div className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                                <div className="flex items-center gap-2">
                                    <UserPlus
                                        size={16}
                                        className="text-blue-400"
                                    />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Treinador Adjunto
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        (opcional)
                                    </span>
                                </div>

                                {disponiveis.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-2">
                                        Nenhum treinador disponível.
                                    </p>
                                ) : (
                                    <select
                                        value={adjuntoId}
                                        onChange={(e) =>
                                            setAdjuntoId(e.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="">Nenhum</option>
                                        {disponiveis
                                            .filter(
                                                (t) =>
                                                    t.staff_id !== treinadorId,
                                            )
                                            .map((t) => (
                                                <option
                                                    key={t.staff_id}
                                                    value={t.staff_id}
                                                >
                                                    {t.name}
                                                    {t.is_fake
                                                        ? " (fictício)"
                                                        : ""}
                                                    {t.email
                                                        ? ` — ${t.email}`
                                                        : ""}
                                                </option>
                                            ))}
                                    </select>
                                )}
                            </div>

                            {/* Botões */}
                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
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
                                    {isPending ? "A guardar..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
