// Componente curso treinador card.
"use client";

import { useActionState, useEffect, useState } from "react";
import { atualizarCursoTreinador } from "@/app/lib/actions";
import { Pencil, X, GraduationCap, BookOpen, Award } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

type SelectOption = { value: string; label: string };

interface Props {
    cursoAtual: {
        modality_id: number;
        modality_name: string;
        level_id: number;
        level_code: string;
        level_name: string;
        level_description: string;
    } | null;
}

export default function CursoTreinadorCard({ cursoAtual }: Props) {
    const [editing, setEditing] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        atualizarCursoTreinador,
        null,
    );
    const [showSuccess, setShowSuccess] = useState(false);

    // Options carregadas da API
    const [modalityOptions, setModalityOptions] = useState<SelectOption[]>([]);
    const [levelsByModality, setLevelsByModality] = useState<
        Record<string, SelectOption[]>
    >({});
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Seleções do formulário
    const [selectedModality, setSelectedModality] = useState(
        cursoAtual ? String(cursoAtual.modality_id) : "",
    );
    const [selectedLevel, setSelectedLevel] = useState(
        cursoAtual ? String(cursoAtual.level_id) : "",
    );

    useEffect(() => {
        if (state?.success) {
            const show = setTimeout(() => {
                setEditing(false);
                setShowSuccess(true);
            }, 0);
            const hide = setTimeout(() => setShowSuccess(false), 3000);
            return () => {
                clearTimeout(show);
                clearTimeout(hide);
            };
        }
    }, [state?.success]);

    // Carregar opções ao entrar em modo edição
    useEffect(() => {
        if (!editing) return;
        let cancelled = false;
        fetch("/api/perfil-treinador/options")
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                setModalityOptions(data.courseModalityOptions ?? []);
                setLevelsByModality(data.technicalLevelOptionsByModality ?? {});
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoadingOptions(false);
            });
        return () => {
            cancelled = true;
        };
    }, [editing]);

    function handleStartEdit() {
        setSelectedModality(cursoAtual ? String(cursoAtual.modality_id) : "");
        setSelectedLevel(cursoAtual ? String(cursoAtual.level_id) : "");
        setLoadingOptions(true);
        setEditing(true);
    }

    const availableLevels = levelsByModality[selectedModality] ?? [];

    const labelClass =
        "text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5";
    const valueClass =
        "text-sm font-medium text-gray-900 dark:text-white mt-0.5";

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <GraduationCap size={18} className="text-violet-500" />
                    Curso de Treinador
                </h3>
                {!editing && (
                    <button
                        onClick={handleStartEdit}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Editar curso"
                    >
                        <Pencil size={14} />
                    </button>
                )}
            </div>

            {/* Success toast */}
            {showSuccess && (
                <div className="absolute top-4 right-4 text-xs text-emerald-500 font-medium animate-in fade-in">
                    ✓ Curso atualizado
                </div>
            )}

            {/* ── Vista de leitura ── */}
            {!editing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className={labelClass}>
                            <BookOpen size={14} />
                            Modalidade
                        </p>
                        <p className={valueClass}>
                            {cursoAtual?.modality_name ?? (
                                <span className="text-gray-400 italic">
                                    Sem curso registado
                                </span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className={labelClass}>
                            <Award size={14} />
                            Grau Técnico
                        </p>
                        <p className={valueClass}>
                            {cursoAtual ? (
                                <>
                                    {cursoAtual.level_name}{" "}
                                    <span className="text-xs text-gray-400">
                                        — {cursoAtual.level_description}
                                    </span>
                                </>
                            ) : (
                                <span className="text-gray-400 italic">—</span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Vista de edição ── */}
            {editing && (
                <form action={action} className="space-y-4">
                    {loadingOptions ? (
                        <p className="text-xs text-gray-400 py-2">
                            A carregar opções…
                        </p>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Modalidade{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="modality_id"
                                    required
                                    value={selectedModality}
                                    onChange={(e) => {
                                        setSelectedModality(e.target.value);
                                        setSelectedLevel("");
                                    }}
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                                >
                                    <option value="">
                                        Selecionar modalidade…
                                    </option>
                                    {modalityOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedModality && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Grau Técnico{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="level_id"
                                        required
                                        value={selectedLevel}
                                        onChange={(e) =>
                                            setSelectedLevel(e.target.value)
                                        }
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                                    >
                                        <option value="">
                                            Selecionar grau…
                                        </option>
                                        {availableLevels.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    {state?.error && (
                        <p className="text-xs text-red-400">{state.error}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={
                                isPending || !selectedModality || !selectedLevel
                            }
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            {isPending ? "A guardar…" : "Guardar"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={14} className="inline mr-1" />
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
