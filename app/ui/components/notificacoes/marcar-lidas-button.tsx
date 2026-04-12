// Componente marcar lidas button.
"use client";

import { marcarTodasComoLidas } from "@/app/lib/actions";
import { useActionState } from "react";

type State = { error?: string; success?: boolean } | null;

export default function MarcarLidasButton() {
    const [, action, isPending] = useActionState<State, FormData>(
        marcarTodasComoLidas,
        null,
    );

    return (
        <form action={action}>
            <button
                type="submit"
                disabled={isPending}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isPending ? "A atualizar..." : "Marcar todas como lidas"}
            </button>
        </form>
    );
}
