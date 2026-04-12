// Componente cliente de newsletter.
"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

export function SendThankYouButton({
    subscriberId,
    subscriberName,
}: {
    subscriberId: number;
    subscriberName: string;
}) {
    const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
        "idle",
    );
    const [errorMsg, setErrorMsg] = useState("");

    async function handleSend() {
        if (!confirm(`Enviar e-mail de agradecimento para ${subscriberName}?`))
            return;

        setStatus("loading");
        setErrorMsg("");

        try {
            const res = await fetch("/api/admin/newsletter-thank", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriberId }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus("error");
                setErrorMsg(data.error || "Erro ao enviar.");
                return;
            }

            setStatus("sent");
        } catch {
            setStatus("error");
            setErrorMsg("Erro de rede.");
        }
    }

    if (status === "sent") {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" />
                Enviado
            </span>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={handleSend}
                disabled={status === "loading"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
                {status === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Send className="h-3.5 w-3.5" />
                )}
                Agradecer
            </button>
            {status === "error" && (
                <span className="text-[10px] text-rose-500">{errorMsg}</span>
            )}
        </div>
    );
}
