"use client";

import { useState } from "react";

type Props = {
    athleteUserId: string;
    athleteName: string;
    responsibleEmail: string;
};

export default function SendResponsibleInviteButton({
    athleteUserId,
    athleteName,
    responsibleEmail,
}: Props) {
    const [status, setStatus] = useState<
        "idle" | "sending" | "opened" | "sent" | "error"
    >("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [sentAt, setSentAt] = useState<Date | null>(null);

    async function handleSend() {
        if (
            !confirm(
                `Abrir e-mail de convite para ${responsibleEmail} (responsável de ${athleteName})?`,
            )
        )
            return;

        setStatus("sending");
        setErrorMsg("");

        try {
            const res = await fetch("/api/admin/send-responsible-invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    athleteUserId,
                    athleteName,
                    responsibleEmail,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus("error");
                setErrorMsg(data.error || "Erro desconhecido");
                return;
            }

            const { to, subject, body: bodyText } = data.mailto;
            const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
            window.location.href = mailtoUrl;

            setStatus("opened");
        } catch {
            setStatus("error");
            setErrorMsg("Falha de ligação ao servidor");
        }
    }

    if (status === "opened") {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        setSentAt(new Date());
                        setStatus("sent");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                    <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Marcar como enviado
                </button>
                <button
                    onClick={handleSend}
                    className="text-xs text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                >
                    Reabrir e-mail
                </button>
            </div>
        );
    }

    if (status === "sent") {
        return (
            <div className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    E-mail enviado (aguardando)
                </span>
                {sentAt && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 text-right">
                        {sentAt.toLocaleString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleSend}
                disabled={status === "sending"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
                <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
                {status === "sending" ? "A gerar…" : "Enviar convite"}
            </button>
            {status === "error" && (
                <span className="text-xs text-rose-600 dark:text-rose-400">
                    {errorMsg}
                </span>
            )}
        </div>
    );
}
