"use client";

import { useTransition } from "react";
import { marcarNotificacaoComoLida } from "@/app/lib/actions";

interface Props {
    id: string;
    lida: boolean;
}

export default function MarcarLidaButton({ id, lida }: Props) {
    const [isPending, startTransition] = useTransition();

    if (lida) return null;

    return (
        <button
            onClick={() => startTransition(() => marcarNotificacaoComoLida(id))}
            disabled={isPending}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50 flex-shrink-0"
        >
            {isPending ? "..." : "Marcar lida"}
        </button>
    );
}
