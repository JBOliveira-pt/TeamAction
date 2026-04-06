"use client";

import { toggleNotificacaoLida } from "@/app/lib/actions";
import { useTransition } from "react";

interface Props {
    id: string;
    lida: boolean;
}

export default function ToggleLidaButton({ id, lida }: Props) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() =>
                startTransition(() => toggleNotificacaoLida(id, lida))
            }
            disabled={isPending}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
        >
            {isPending ? "..." : lida ? "Marcar não lida" : "Marcar lida"}
        </button>
    );
}
