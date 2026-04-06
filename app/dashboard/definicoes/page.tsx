import {
    fetchPedidoPlano,
    fetchPlanoAtual,
    fetchIsMinor,
} from "@/app/lib/actions/planos";
import PlanoSelector from "./_components/PlanoSelector.client";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
    const [planoAtual, pedidoPendente, isMinor] = await Promise.all([
        fetchPlanoAtual().catch(() => "rookie"),
        fetchPedidoPlano().catch(() => null),
        fetchIsMinor().catch(() => false),
    ]);

    const planoLabels: Record<string, string> = {
        rookie: "Rookie",
        team: "Team",
        club_pro: "Club Pro",
        legend: "Legend",
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Definições
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Gere a tua conta e o teu plano na plataforma
                </p>
            </div>

            {isMinor ? (
                <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-blue-500" />
                        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                            Plano atual: {planoLabels[planoAtual] ?? planoAtual}
                        </h2>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Como atleta menor de idade, a alteração do plano só pode
                        ser feita pelo teu encarregado de educação.
                    </p>
                </div>
            ) : (
                <PlanoSelector
                    planoAtual={planoAtual}
                    pedidoPendente={
                        pedidoPendente
                            ? {
                                  plano: pedidoPendente.plano_solicitado,
                                  criadoEm: pedidoPendente.created_at,
                              }
                            : null
                    }
                />
            )}
        </div>
    );
}
