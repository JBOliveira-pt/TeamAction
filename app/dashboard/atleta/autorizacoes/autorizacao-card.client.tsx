// Componente cliente de autorizacoes (atleta).
"use client";

import { ReactNode, useState } from "react";
import { Check, X } from "lucide-react";
import {
    responderConviteEquipaAtleta,
    responderConviteClubeAtleta,
    responderConviteTreinadorAtleta,
} from "@/app/lib/actions/convites-atleta";

type Props = {
    id: string;
    tipo: "convite_equipa" | "convite_clube" | "convite_treinador";
    titulo: string;
    descricao: string;
    createdAt: string;
    icon: ReactNode;
};

export default function AutorizacaoAtletaCard({
    id,
    tipo,
    titulo,
    descricao,
    createdAt,
    icon,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<"aceite" | "recusado" | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    async function handleDecisao(decisao: "aceitar" | "rejeitar") {
        setLoading(true);
        setError(null);

        let result: { error?: string } | null = null;

        if (tipo === "convite_equipa") {
            result = await responderConviteEquipaAtleta(id, decisao);
        } else if (tipo === "convite_clube") {
            result = await responderConviteClubeAtleta(id, decisao);
        } else if (tipo === "convite_treinador") {
            result = await responderConviteTreinadorAtleta(id, decisao);
        }

        setLoading(false);

        if (result?.error) {
            setError(result.error);
        } else {
            setResultado(decisao === "aceitar" ? "aceite" : "recusado");
        }
    }

    const dateStr = new Date(createdAt).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    if (resultado) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex items-start justify-between gap-4 opacity-60">
                <div className="flex items-start gap-3">
                    {icon}
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {titulo}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {descricao}
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
                {icon}
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {titulo}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {descricao}
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
                    onClick={() => handleDecisao("rejeitar")}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                >
                    Rejeitar
                </button>
                <button
                    onClick={() => handleDecisao("aceitar")}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    Aceitar
                </button>
            </div>
        </div>
    );
}
