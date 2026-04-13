// Componente de escolha: reativar conta ou iniciar nova.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, UserPlus, Loader2, AlertTriangle } from "lucide-react";

const ACCOUNT_LABELS: Record<string, string> = {
    presidente: "Presidente",
    treinador: "Treinador",
    atleta: "Atleta",
    responsavel: "Responsável",
};

export default function ReactivateAccountChoice({
    email,
    accountType,
}: {
    email: string;
    accountType: string | null;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState<"reactivate" | "fresh" | null>(null);
    const [error, setError] = useState("");

    const handleReactivate = async () => {
        setLoading("reactivate");
        setError("");
        try {
            const res = await fetch("/api/user-actions/reactivate-account", {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Erro ao reativar conta.");
                setLoading(null);
                return;
            }
            const data = await res.json();
            if (data.accountType) {
                const path =
                    data.accountType === "presidente"
                        ? "/dashboard/presidente"
                        : data.accountType === "treinador"
                          ? "/dashboard/treinador"
                          : data.accountType === "atleta"
                            ? "/dashboard/atleta"
                            : "/dashboard/responsavel";
                router.push(path);
            } else {
                router.push("/signup");
            }
        } catch {
            setError("Erro de rede. Tente novamente.");
            setLoading(null);
        }
    };

    const handleFreshStart = async () => {
        setLoading("fresh");
        setError("");
        try {
            const res = await fetch("/api/user-actions/fresh-start", {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Erro ao iniciar conta nova.");
                setLoading(null);
                return;
            }
            // Conta limpa — redirecionar para completar o registo
            router.push("/signup");
            router.refresh();
        } catch {
            setError("Erro de rede. Tente novamente.");
            setLoading(null);
        }
    };

    return (
        <div className="w-full max-w-md rounded-2xl bg-gray-900/90 backdrop-blur-sm border border-gray-800 shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle size={28} className="text-amber-400" />
                </div>
                <h1 className="text-xl font-bold text-white">
                    Conta anterior encontrada
                </h1>
                <p className="text-sm text-gray-400">
                    Encontrámos uma conta associada a{" "}
                    <span className="font-semibold text-gray-200">{email}</span>{" "}
                    que foi eliminada recentemente.
                </p>
                {accountType && ACCOUNT_LABELS[accountType] && (
                    <p className="text-xs text-gray-500">
                        Perfil anterior:{" "}
                        <span className="font-medium text-gray-300">
                            {ACCOUNT_LABELS[accountType]}
                        </span>
                    </p>
                )}
            </div>

            <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-300 text-center">
                    O que pretende fazer?
                </p>

                <button
                    onClick={handleReactivate}
                    disabled={loading !== null}
                    className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 transition-all disabled:opacity-50"
                >
                    {loading === "reactivate" ? (
                        <Loader2 size={22} className="animate-spin" />
                    ) : (
                        <RefreshCcw size={22} />
                    )}
                    <div className="text-left">
                        <p className="font-bold text-sm">
                            Reativar conta anterior
                        </p>
                        <p className="text-xs text-emerald-400/70">
                            Recuperar todos os dados e continuar a utilizar a
                            plataforma.
                        </p>
                    </div>
                </button>

                <button
                    onClick={handleFreshStart}
                    disabled={loading !== null}
                    className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-gray-600/50 bg-gray-800/30 hover:bg-gray-700/40 text-gray-300 transition-all disabled:opacity-50"
                >
                    {loading === "fresh" ? (
                        <Loader2 size={22} className="animate-spin" />
                    ) : (
                        <UserPlus size={22} />
                    )}
                    <div className="text-left">
                        <p className="font-bold text-sm">
                            Criar uma conta nova
                        </p>
                        <p className="text-xs text-gray-400/70">
                            Os dados anteriores serão apagados permanentemente.
                            Começará do zero.
                        </p>
                    </div>
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-400 text-center bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                De acordo com a nossa{" "}
                <a
                    href="/privacidade"
                    className="underline hover:text-gray-300"
                    target="_blank"
                >
                    Política de Privacidade
                </a>
                , os dados de contas eliminadas são conservados durante 30 dias
                antes de serem apagados definitivamente.
            </p>
        </div>
    );
}
