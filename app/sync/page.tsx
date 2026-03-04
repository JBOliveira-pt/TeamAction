"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSync = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/sync-current-user", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Erro ao sincronizar");
                return;
            }

            setResult(data);

            // Redirecionar para dashboard após 2 segundos
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-6 rounded-lg bg-slate-900 p-8 shadow-xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Sincronizar Usuário
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Vincule sua conta Clerk ao banco de dados Neon
                    </p>
                </div>

                {!result && !error && (
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Sincronizando..." : "Sincronizar Agora"}
                    </button>
                )}

                {error && (
                    <div className="rounded-lg bg-red-900/20 border border-red-700 p-4">
                        <h3 className="font-semibold text-red-400 mb-2">
                            Erro
                        </h3>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="rounded-lg bg-green-900/20 border border-green-700 p-4 space-y-3">
                        <h3 className="font-semibold text-green-400 mb-2">
                            ✓ Sucesso!
                        </h3>
                        <p className="text-green-300 text-sm">
                            {result.message}
                        </p>

                        {result.user && (
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between text-slate-300">
                                    <span className="font-medium">Email:</span>
                                    <span>{result.user.email}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span className="font-medium">Role:</span>
                                    <span className="capitalize">
                                        {result.user.role}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span className="font-medium">Ação:</span>
                                    <span className="capitalize">
                                        {result.action}
                                    </span>
                                </div>
                            </div>
                        )}

                        <p className="text-slate-400 text-xs mt-4">
                            Redirecionando para o dashboard...
                        </p>
                    </div>
                )}

                <div className="text-center">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                        ← Voltar ao Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
