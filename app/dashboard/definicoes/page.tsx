import {
    fetchPedidoPlano,
    fetchPlanoAtual,
    fetchIsMinor,
    fetchIsResponsavel,
} from "@/app/lib/actions/planos";
import PlanoSelector from "./_components/PlanoSelector.client";
import { AlertTriangle, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
    const [planoAtual, pedidoPendente, isMinor, isResponsavel] =
        await Promise.all([
            fetchPlanoAtual().catch(() => "rookie"),
            fetchPedidoPlano().catch(() => null),
            fetchIsMinor().catch(() => false),
            fetchIsResponsavel().catch(() => false),
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
                    {isResponsavel
                        ? "Gere o plano do teu educando na plataforma"
                        : "Gere a tua conta e o teu plano na plataforma"}
                </p>
            </div>

            {isResponsavel && (
                <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4 flex items-start gap-3">
                    <Info
                        size={18}
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Enquanto responsável, o plano que selecionares será
                        partilhado com o teu educando.
                    </p>
                </div>
            )}

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
