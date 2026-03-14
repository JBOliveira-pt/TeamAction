"use client";

import { useEffect, useState } from "react";

type Notificacao = {
    id: string;
    titulo: string;
    descricao: string;
    tipo: string;
    lida: boolean;
};

export function LoginAvisoPopup() {
    const [aviso, setAviso] = useState<Notificacao | null>(null);

    useEffect(() => {
        const loadAvisos = async () => {
            try {
                const response = await fetch("/api/notificacoes", {
                    cache: "no-store",
                });
                const data = (await response.json()) as {
                    notificacoes?: Notificacao[];
                };
                const avisoNaoLido = (data.notificacoes || []).find(
                    (item) => item.tipo === "Aviso" && !item.lida,
                );

                if (!avisoNaoLido) return;

                const key = `aviso_popup_seen:${avisoNaoLido.id}`;
                if (sessionStorage.getItem(key)) return;

                sessionStorage.setItem(key, "1");
                setAviso(avisoNaoLido);
            } catch {
                // Ignore popup errors
            }
        };

        loadAvisos();
    }, []);

    const close = async () => {
        if (!aviso) return;

        try {
            await fetch(`/api/notificacoes/${aviso.id}/read`, {
                method: "PATCH",
            });
        } catch {
            // Ignore mark-as-read errors
        }

        setAviso(null);
    };

    if (!aviso) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl border border-amber-300 bg-white shadow-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-500 text-xl">⚠️</span>
                    <h3 className="text-lg font-semibold text-slate-900">
                        {aviso.titulo}
                    </h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                    {aviso.descricao}
                </p>
                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
}
