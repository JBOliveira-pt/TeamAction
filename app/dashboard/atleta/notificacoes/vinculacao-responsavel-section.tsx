"use client";

import { useState, useEffect } from "react";
import { Check, X, UserCheck, AlertTriangle, Mail } from "lucide-react";

type Vinculacao = {
    id: string;
    alvo_email: string;
    alvo_nome: string | null;
    status: string;
    created_at: string;
};

export default function VinculacaoResponsavelSection() {
    const [vinculacoes, setVinculacoes] = useState<Vinculacao[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/vinculacoes-responsavel")
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setVinculacoes(data))
            .catch(() => setVinculacoes([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (vinculacoes.length === 0) return null;

    return (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Vinculação de Responsável
            </h2>
            {vinculacoes.map((v) => (
                <VinculacaoCard
                    key={v.id}
                    vinculacao={v}
                    onResolved={() =>
                        setVinculacoes((prev) =>
                            prev.filter((x) => x.id !== v.id),
                        )
                    }
                />
            ))}
        </div>
    );
}

function VinculacaoCard({
    vinculacao,
    onResolved,
}: {
    vinculacao: Vinculacao;
    onResolved: () => void;
}) {
    const [modo, setModo] = useState<"idle" | "recusar" | "resolvido">("idle");
    const [resultado, setResultado] = useState<"aceite" | "recusado" | null>(
        null,
    );
    const [novoEmail, setNovoEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const nomeResp = vinculacao.alvo_nome || vinculacao.alvo_email;

    async function handleAceitar() {
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/vinculacoes-responsavel/${vinculacao.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estado: "aceite" }),
                },
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Erro ao aceitar.");
            }
            setResultado("aceite");
            setModo("resolvido");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao aceitar.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRecusar() {
        const emailTrimmed = novoEmail.trim().toLowerCase();
        if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
            setError("Introduza um e-mail válido.");
            return;
        }
        if (emailTrimmed === vinculacao.alvo_email.toLowerCase()) {
            setError("O novo e-mail deve ser diferente do responsável atual.");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/vinculacoes-responsavel/${vinculacao.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        estado: "recusado",
                        novoEmail: emailTrimmed,
                    }),
                },
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Erro ao recusar.");
            }
            setResultado("recusado");
            setModo("resolvido");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao recusar.");
        } finally {
            setSubmitting(false);
        }
    }

    if (modo === "resolvido") {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 opacity-60">
                <div className="flex items-center gap-3">
                    <UserCheck size={20} className="text-gray-400" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Vinculação com {nomeResp}
                        </p>
                    </div>
                    <span
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                            resultado === "aceite"
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                        }`}
                    >
                        {resultado === "aceite" ? (
                            <Check size={12} />
                        ) : (
                            <X size={12} />
                        )}
                        {resultado === "aceite" ? "Aceite" : "Recusado"}
                    </span>
                </div>
                {resultado === "recusado" && novoEmail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-8">
                        Um convite foi enviado para <strong>{novoEmail}</strong>
                        . O teu perfil permanecerá limitado até o novo
                        responsável criar a conta.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-violet-300 dark:border-violet-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-violet-50 dark:bg-violet-900/20 px-5 py-3 flex items-center gap-3 border-b border-violet-200 dark:border-violet-800">
                <UserCheck
                    size={18}
                    className="text-violet-600 dark:text-violet-400"
                />
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    Pedido de Vinculação — Responsável
                </span>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{nomeResp}</strong>{" "}
                        <span className="text-gray-500 dark:text-gray-400">
                            ({vinculacao.alvo_email})
                        </span>{" "}
                        registou-se como teu responsável. Concordas com esta
                        associação?
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(vinculacao.created_at).toLocaleDateString(
                            "pt-PT",
                            { day: "2-digit", month: "short", year: "numeric" },
                        )}
                    </p>
                </div>

                {modo === "idle" && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setModo("recusar")}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                        >
                            Não concordo
                        </button>
                        <button
                            onClick={handleAceitar}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? "A processar…" : "Sim, aceitar"}
                        </button>
                    </div>
                )}

                {modo === "recusar" && (
                    <div className="space-y-3">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle
                                    size={16}
                                    className="text-amber-500 mt-0.5 shrink-0"
                                />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                        Atenção
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">
                                        Ao recusar, é obrigatório indicar o
                                        e-mail de um novo responsável (diferente
                                        de{" "}
                                        <strong>{vinculacao.alvo_email}</strong>
                                        ). O teu perfil permanecerá limitado até
                                        o novo responsável criar a conta na
                                        plataforma.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                E-mail do novo responsável
                            </label>
                            <div className="relative">
                                <Mail
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="email"
                                    value={novoEmail}
                                    onChange={(e) => {
                                        setNovoEmail(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="novo.responsavel@email.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setModo("idle");
                                    setError(null);
                                    setNovoEmail("");
                                }}
                                disabled={submitting}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleRecusar}
                                disabled={submitting || !novoEmail.trim()}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {submitting
                                    ? "A processar…"
                                    : "Recusar e indicar novo responsável"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
