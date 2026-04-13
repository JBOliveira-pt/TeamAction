// Componente de eliminação de conta com confirmação em vários passos.
"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Trash2, AlertTriangle, ShieldAlert, X, Loader2 } from "lucide-react";

type Step = "idle" | "warn1" | "warn2" | "confirm";

const CONFIRM_TEXT = "ELIMINAR MINHA CONTA";

export default function DeleteAccountSection() {
    const { signOut } = useClerk();
    const [step, setStep] = useState<Step>("idle");
    const [typed, setTyped] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setStep("idle");
        setTyped("");
        setError("");
        setLoading(false);
    };

    const handleDelete = async () => {
        if (typed !== CONFIRM_TEXT) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/user-actions/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmation: CONFIRM_TEXT }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Erro ao eliminar conta.");
                setLoading(false);
                return;
            }
            // Conta eliminada — sign out
            await signOut({ redirectUrl: "/" });
        } catch {
            setError("Erro de rede. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <>
            {/* Secção — Zona de Perigo */}
            <div className="rounded-2xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <ShieldAlert
                        size={20}
                        className="text-red-500 dark:text-red-400"
                    />
                    <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
                        Zona de Perigo
                    </h2>
                </div>

                <p className="text-sm text-red-700 dark:text-red-400">
                    A eliminação da conta é uma ação grave. Todos os teus dados
                    serão guardados durante 30&nbsp;dias e, caso não reatives a
                    conta nesse período, serão apagados definitivamente.
                </p>

                <button
                    onClick={() => setStep("warn1")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                    <Trash2 size={16} />
                    Eliminar a minha conta
                </button>
            </div>

            {/* Modal de confirmação (overlay) */}
            {step !== "idle" && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-gray-200 dark:border-gray-800">
                        {/* Botão fechar */}
                        <button
                            onClick={reset}
                            disabled={loading}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={20} />
                        </button>

                        {/* ── Passo 1: Aviso geral ── */}
                        {step === "warn1" && (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                        <AlertTriangle
                                            size={24}
                                            className="text-amber-600 dark:text-amber-400"
                                        />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Tens a certeza?
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ao eliminares a tua conta:
                                </p>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                                    <li>
                                        Perderás o acesso à plataforma de
                                        imediato.
                                    </li>
                                    <li>
                                        Os teus dados serão conservados durante
                                        30&nbsp;dias.
                                    </li>
                                    <li>
                                        Se não reativares a conta nesse período,
                                        tudo será apagado permanentemente.
                                    </li>
                                </ul>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={reset}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => setStep("warn2")}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── Passo 2: Consequências detalhadas ── */}
                        {step === "warn2" && (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                        <ShieldAlert
                                            size={24}
                                            className="text-red-600 dark:text-red-400"
                                        />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Consequências da eliminação
                                    </h3>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                                        O que será afetado:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>
                                            O teu perfil, fotografias e dados
                                            pessoais.
                                        </li>
                                        <li>
                                            As equipas e clubes que administras
                                            (se fores presidente).
                                        </li>
                                        <li>
                                            Planos de treino, avaliações e
                                            sessões (se fores treinador).
                                        </li>
                                        <li>
                                            Vinculações a atletas (se fores
                                            responsável).
                                        </li>
                                    </ul>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 pt-1">
                                        O que será preservado:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>
                                            Resultados de jogos e dados
                                            partilhados com outros utilizadores.
                                        </li>
                                        <li>
                                            Registos administrativos (logs).
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setStep("warn1")}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={() => setStep("confirm")}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    >
                                        Entendo, quero continuar
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── Passo 3: Digitar confirmação ── */}
                        {step === "confirm" && (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                        <Trash2
                                            size={24}
                                            className="text-red-600 dark:text-red-400"
                                        />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Confirmar eliminação
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Para confirmar, escreve{" "}
                                    <span className="font-mono font-bold text-red-600 dark:text-red-400 select-all">
                                        {CONFIRM_TEXT}
                                    </span>{" "}
                                    no campo abaixo.
                                </p>
                                <input
                                    type="text"
                                    value={typed}
                                    onChange={(e) => setTyped(e.target.value)}
                                    placeholder={CONFIRM_TEXT}
                                    autoFocus
                                    disabled={loading}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:border-red-500 dark:focus:border-red-500 disabled:opacity-50"
                                />
                                {error && (
                                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setStep("warn2");
                                            setTyped("");
                                            setError("");
                                        }}
                                        disabled={loading}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={
                                            typed !== CONFIRM_TEXT || loading
                                        }
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        Eliminar permanentemente
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
