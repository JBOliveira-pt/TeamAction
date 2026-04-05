import { fetchPedidoPlano, fetchPlanoAtual } from "@/app/lib/actions/planos";
import PlanoSelector from "./_components/PlanoSelector.client";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
    const [planoAtual, pedidoPendente] = await Promise.all([
        fetchPlanoAtual(),
        fetchPedidoPlano(),
    ]);

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
        </div>
    );
}
