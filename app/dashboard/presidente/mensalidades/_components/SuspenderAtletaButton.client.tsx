"use client";

import { useActionState } from "react";
import { suspenderAtleta } from "@/app/lib/actions";

type State = { error?: string; success?: boolean } | null;

export default function SuspenderAtletaButton({ atletaId }: { atletaId: string }) {
    const [state, action, isPending] = useActionState<State, FormData>(
        suspenderAtleta,
        null
    );

    return (
        <form action={action}>
            <input type="hidden" name="atleta_id" value={atletaId} />
            <button
                type="submit"
                disabled={isPending}
                className="text-xs text-red-400 hover:text-red-300 font-medium border border-red-500/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? "..." : state?.error ? "Erro" : "Suspender atleta"}
            </button>
        </form>
    );
}
