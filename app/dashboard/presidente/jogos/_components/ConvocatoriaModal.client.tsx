"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

type Atleta = {
    id: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
};

type Convocado = {
    id?: string;
    atleta_id: string;
    estado: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
};

type Props = {
    jogoId: string;
    equipaId: string;
    adversario: string;
    data: string;
};

const ESTADOS = [
    {
        value: "convocado",
        label: "Convocado",
        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    {
        value: "suplente",
        label: "Suplente",
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    {
        value: "dispensado",
        label: "Dispensado",
        color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
    {
        value: "lesionado",
        label: "Lesionado",
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
];

export default function ConvocatoriaModal({
    jogoId,
    equipaId,
    adversario,
    data,
}: Props) {
    const [open, setOpen] = useState(false);
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [convocados, setConvocados] = useState<Convocado[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [atletasRes, convocRes] = await Promise.all([
                fetch(`/api/atletas?equipa_id=${equipaId}`),
                fetch(`/api/convocatorias?jogo_id=${jogoId}`),
            ]);

            const atletasData: Atleta[] = atletasRes.ok
                ? await atletasRes.json()
                : [];
            const convocData: {
                id: string;
                atleta_id: string;
                estado: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
            }[] = convocRes.ok ? await convocRes.json() : [];

            setAtletas(atletasData);

            if (convocData.length > 0) {
                // Existing convocatória - load it
                setConvocados(
                    convocData.map((c) => ({
                        id: c.id,
                        atleta_id: c.atleta_id,
                        estado: c.estado ?? "convocado",
                        nome: c.nome,
                        posicao: c.posicao,
                        numero_camisola: c.numero_camisola,
                    })),
                );
            } else {
                // No existing convocatória - default all athletes as convocado
                setConvocados(
                    atletasData.map((a) => ({
                        atleta_id: a.id,
                        estado: "convocado",
                        nome: a.nome,
                        posicao: a.posicao,
                        numero_camisola: a.numero_camisola,
                    })),
                );
            }
        } catch {
            setAtletas([]);
            setConvocados([]);
        } finally {
            setLoading(false);
        }
    }, [jogoId, equipaId]);

    useEffect(() => {
        if (open) fetchData();
    }, [open, fetchData]);

    const setEstado = (atletaId: string, estado: string) => {
        setConvocados((prev) =>
            prev.map((c) => (c.atleta_id === atletaId ? { ...c, estado } : c)),
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/convocatorias", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jogo_id: jogoId,
                    atletas: convocados.map((c) => ({
                        atleta_id: c.atleta_id,
                        estado: c.estado,
                    })),
                }),
            });
            if (res.ok) {
                setToast("Convocatória publicada! Atletas notificados.");
                setTimeout(() => {
                    setToast(null);
                    setOpen(false);
                }, 2000);
            } else {
                const msg = await res.text();
                setToast("Erro: " + msg);
                setTimeout(() => setToast(null), 3000);
            }
        } finally {
            setSaving(false);
        }
    };

    const estadoOf = (value: string) => ESTADOS.find((e) => e.value === value);

    const counts = {
        convocado: convocados.filter((c) => c.estado === "convocado").length,
        suplente: convocados.filter((c) => c.estado === "suplente").length,
        dispensado: convocados.filter((c) => c.estado === "dispensado").length,
        lesionado: convocados.filter((c) => c.estado === "lesionado").length,
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
            >
                📋 Convocatória
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    📋 Convocatória
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    vs {adversario} ·{" "}
                                    {new Date(data).toLocaleDateString(
                                        "pt-PT",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        },
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Summary badges */}
                        <div className="px-6 py-3 flex gap-3 flex-wrap border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                {counts.convocado} Convocados
                            </span>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                {counts.suplente} Suplentes
                            </span>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                {counts.dispensado} Dispensados
                            </span>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                {counts.lesionado} Lesionados
                            </span>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="text-center text-gray-400 py-10">
                                    A carregar atletas...
                                </div>
                            ) : convocados.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">
                                    Nenhum atleta encontrado nesta equipa.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {convocados.map((c) => {
                                        const est = estadoOf(c.estado);
                                        return (
                                            <div
                                                key={c.atleta_id}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50"
                                            >
                                                {/* Athlete info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                        {c.numero_camisola !=
                                                            null && (
                                                            <span className="text-gray-400 dark:text-gray-500 mr-1">
                                                                #
                                                                {
                                                                    c.numero_camisola
                                                                }
                                                            </span>
                                                        )}
                                                        {c.nome}
                                                    </p>
                                                    {c.posicao && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {c.posicao}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Estado buttons */}
                                                <div className="flex gap-1 flex-wrap">
                                                    {ESTADOS.map((e) => (
                                                        <button
                                                            key={e.value}
                                                            onClick={() =>
                                                                setEstado(
                                                                    c.atleta_id,
                                                                    e.value,
                                                                )
                                                            }
                                                            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                                                                c.estado ===
                                                                e.value
                                                                    ? `${e.color} border-current ring-1 ring-current/20`
                                                                    : "bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                            }`}
                                                        >
                                                            {e.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || convocados.length === 0}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm shadow"
                            >
                                {saving
                                    ? "A publicar..."
                                    : "Publicar Convocatória"}
                            </button>
                        </div>

                        {/* Toast */}
                        {toast && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-xl shadow-lg">
                                {toast}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
