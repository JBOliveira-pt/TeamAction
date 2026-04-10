"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useClerk } from "@clerk/nextjs";
import { Loader2, LogOut } from "lucide-react";
import Link from "next/link";

const POLL_INTERVAL_MS = 10_000; // 10 seconds

export function AguardarValidacaoClient() {
    const router = useRouter();
    const { signOut } = useClerk();
    const [checking, setChecking] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const handleCheck = useCallback(() => {
        setChecking(true);
        router.refresh();
        setTimeout(() => setChecking(false), 2000);
    }, [router]);

    const handleSignOut = useCallback(async () => {
        setSigningOut(true);
        await signOut({ redirectUrl: "/signup" });
    }, [signOut]);

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
            <div className="flex flex-col items-center gap-2 pt-2">
                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600/50 bg-slate-800/60 px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-500/50 hover:bg-slate-700/60 hover:text-white disabled:opacity-60"
                >
                    {signingOut ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />A
                            sair...
                        </>
                    ) : (
                        <>
                            <LogOut className="h-4 w-4" />
                            Terminar sessão e criar outra conta
                        </>
                    )}
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center text-sm text-slate-400 hover:text-white transition-colors"
                >
                    ← Voltar à página inicial
                </Link>
            </div>
        </div>
    );
}
