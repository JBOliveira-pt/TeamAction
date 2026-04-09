"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const POLL_INTERVAL_MS = 10_000; // 10 seconds

export function AguardarValidacaoClient() {
    const router = useRouter();
    const [checking, setChecking] = useState(false);

    const handleCheck = useCallback(() => {
        setChecking(true);
        router.refresh();
        setTimeout(() => setChecking(false), 2000);
    }, [router]);

    // Auto-poll every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={handleCheck}
                disabled={checking}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/35 transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
            >
                {checking ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />A
                        verificar...
                    </>
                ) : (
                    "Verificar estado"
                )}
            </button>
            <p className="text-xs text-slate-500">
                A página verifica automaticamente a cada 10 segundos, ou clique
                para verificar agora.
            </p>
            <Link
                href="/"
                className="inline-flex items-center justify-center text-sm text-slate-400 hover:text-white transition-colors"
            >
                ← Voltar à página inicial
            </Link>
        </div>
    );
}
