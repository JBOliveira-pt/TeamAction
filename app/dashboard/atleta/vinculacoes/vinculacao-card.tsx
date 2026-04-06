"use client";

import { useState } from "react";
import { Check, X, UserCheck } from "lucide-react";

type Vinculacao = {
    id: string;
    alvo_email: string;
    alvo_nome: string | null;
    status: string;
    created_at: string;
};

export default function VinculacaoCard({ v }: { v: Vinculacao }) {
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<"aceite" | "recusado" | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    async function handleDecisao(estado: "aceite" | "recusado") {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/vinculacoes-responsavel/${v.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado }),
            });
            if (!res.ok) {
                const text = await res.text();
                setError(text || "Erro ao processar pedido.");
            } else {
                setResultado(estado);
            }
        } catch {
            setError("Erro de rede.");
        } finally {
            setLoading(false);
        }
    }

    const dateStr = new Date(v.created_at).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    if (resultado) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex items-start justify-between gap-4 opacity-60">
                <div className="flex items-start gap-3">
                    <UserCheck
                        size={20}
                        className="text-violet-500 mt-0.5 shrink-0"
                    />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {v.alvo_nome ?? v.alvo_email}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {v.alvo_email}
                        </span>
                    </div>
                </div>
                <span
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shrink-0 ${
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
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                <UserCheck
                    size={20}
                    className="text-violet-500 mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pedido de Vinculação — Responsável
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        <strong>{v.alvo_nome ?? v.alvo_email}</strong> (
                        {v.alvo_email}) pretende vincular-se ao seu perfil como
                        encarregado de educação.
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                        {dateStr}
                    </span>
                    {error && (
                        <span className="text-xs text-red-500 mt-1">
                            {error}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-2 shrink-0">
                <button
                    onClick={() => handleDecisao("recusado")}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                >
                    Recusar
                </button>
                <button
                    onClick={() => handleDecisao("aceite")}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    Aceitar
                </button>
            </div>
        </div>
    );
}
