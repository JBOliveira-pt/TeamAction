"use client";

import { useActionState, useEffect, useState } from "react";
import { atualizarInfoDesportiva } from "@/app/lib/actions";
import {
    Pencil,
    X,
    Trophy,
    Ruler,
    Weight,
    Hand,
    Users,
    UserCheck,
} from "lucide-react";

type State = { error?: string; success?: boolean } | null;

interface Props {
    pesoKg: number | null;
    alturaCm: number | null;
    maoDominante: string | null;
    equipaNome: string | null;
    federado: boolean | null;
    treinadorNome: string | null;
}

const MAO_OPTIONS = [
    { value: "direita", label: "Direita" },
    { value: "esquerda", label: "Esquerda" },
    { value: "ambidestro", label: "Ambidestro" },
];

export default function InfoDesportivaCard({
    pesoKg,
    alturaCm,
    maoDominante,
    equipaNome,
    federado,
    treinadorNome,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        atualizarInfoDesportiva,
        null,
    );
    const [showSuccess, setShowSuccess] = useState(false);

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
    }, [state]);

    const maoDominanteLabel = maoDominante
        ? maoDominante.charAt(0).toUpperCase() + maoDominante.slice(1)
        : null;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Trophy size={18} className="text-blue-500" />
                    Informações Desportivas
                </h3>
                <button
                    onClick={() => {
                        setEditing((v) => !v);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                    {editing ? (
                        <>
                            <X size={14} />
                            Cancelar
                        </>
                    ) : (
                        <>
                            <Pencil size={14} />
                            Editar
                        </>
                    )}
                </button>
            </div>

            {showSuccess && (
                <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 animate-fade-out">
                    Informações atualizadas com sucesso!
                </div>
            )}
            {state?.error && (
                <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                    {state.error}
                </div>
            )}

            {editing ? (
                <form action={action} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Altura (cm)
                            </label>
                            <input
                                name="altura_cm"
                                type="number"
                                defaultValue={alturaCm ?? ""}
                                min={100}
                                max={300}
                                placeholder="170"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Peso (kg)
                            </label>
                            <input
                                name="peso_kg"
                                type="number"
                                step="0.1"
                                defaultValue={pesoKg ?? ""}
                                min={10}
                                max={300}
                                placeholder="70"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mão dominante
                        </label>
                        <select
                            name="mao_dominante"
                            defaultValue={maoDominante ?? ""}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <option value="">— Não definida —</option>
                            {MAO_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Equipa e Treinador — read-only */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ReadOnlyField
                            label="Equipa"
                            value={
                                federado
                                    ? (equipaNome ?? "Sem equipa")
                                    : "Não federado"
                            }
                        />
                        <ReadOnlyField
                            label="Treinador"
                            value={treinadorNome ?? "—"}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {isPending ? "A guardar..." : "Guardar alterações"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                        icon={<Ruler size={16} />}
                        label="Altura"
                        value={alturaCm ? `${alturaCm} cm` : null}
                    />
                    <InfoRow
                        icon={<Weight size={16} />}
                        label="Peso"
                        value={pesoKg ? `${pesoKg} kg` : null}
                    />
                    <InfoRow
                        icon={<Hand size={16} />}
                        label="Mão dominante"
                        value={maoDominanteLabel}
                    />
                    <InfoRow
                        icon={<Users size={16} />}
                        label="Equipa"
                        value={federado ? equipaNome : null}
                        empty={federado ? "Sem equipa" : "Não federado"}
                    />
                    <InfoRow
                        icon={<UserCheck size={16} />}
                        label="Treinador"
                        value={treinadorNome}
                    />
                </div>
            )}
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
    empty,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number | null | undefined;
    empty?: string;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0">
                {icon}
            </span>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {value ?? (
                        <span className="text-gray-400">{empty ?? "—"}</span>
                    )}
                </p>
            </div>
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                {value}
            </p>
        </div>
    );
}
