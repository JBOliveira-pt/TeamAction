// Banner fixo de convite de clube pendente (treinador).
"use client";

import { useState } from "react";
import { Building2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Convite = {
    id: string;
    titulo: string;
    descricao: string;
    created_at: string;
};

export default function ConviteClubeBanner({
    convites,
}: {
    convites: Convite[];
}) {
    const [items, setItems] = useState(convites);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    if (items.length === 0) return null;

    async function handleDecisao(id: string, decisao: "aceitar" | "rejeitar") {
        setLoadingId(id);
        setErrors((prev) => ({ ...prev, [id]: "" }));

        const estado = decisao === "aceitar" ? "aceite" : "recusado";

        try {
            const res = await fetch(`/api/convites-clube/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado }),
            });

            if (!res.ok) {
                const text = await res
                    .text()
                    .catch(() => "Erro ao processar o convite.");
                setErrors((prev) => ({ ...prev, [id]: text }));
                setLoadingId(null);
                return;
            }

            if (estado === "aceite") {
                // Org muda ao aceitar — recarregar tudo
                router.refresh();
            } else {
                setItems((prev) => prev.filter((c) => c.id !== id));
            }
        } catch {
            setErrors((prev) => ({
                ...prev,
                [id]: "Erro de rede ao processar o convite.",
            }));
        }

        setLoadingId(null);
    }

    return (
        <div className="space-y-3">
            {items.map((c) => (
                <div
                    key={c.id}
                    className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl p-5 shadow-lg shadow-blue-600/20"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-white/15 shrink-0">
                            <Building2 size={22} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">
                                {c.titulo}
                            </p>
                            <p className="text-sm text-blue-100 mt-1">
                                {c.descricao}
                            </p>
                            {errors[c.id] && (
                                <p className="text-xs text-red-200 mt-1">
                                    {errors[c.id]}
                                </p>
                            )}
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() =>
                                        handleDecisao(c.id, "rejeitar")
                                    }
                                    disabled={loadingId === c.id}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <X size={14} />
                                    Rejeitar
                                </button>
                                <button
                                    onClick={() =>
                                        handleDecisao(c.id, "aceitar")
                                    }
                                    disabled={loadingId === c.id}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Check size={14} />
                                    Aceitar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
