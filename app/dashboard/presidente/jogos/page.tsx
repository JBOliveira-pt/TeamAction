import {
    fetchJogos,
    fetchEquipas,
    fetchPresidenteDashboard,
} from "@/app/lib/data";
import JogosTable from "./jogos-table.client";
import AgendarJogoModal from "./_components/AgendarJogoModal.client";

export const dynamic = "force-dynamic";

export default async function JogosPage({
    searchParams,
}: {
    searchParams?: Promise<{ new?: string; data?: string }>;
}) {
    const params = await searchParams;
    const [jogos, equipas, dashboard] = await Promise.all([
        fetchJogos(),
        fetchEquipas(),
        fetchPresidenteDashboard(),
    ]);

    const abrirModal = params?.new === "true";
    const dataInicial = params?.data ?? "";

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Jogos
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {dashboard.epocaNome
                            ? `Época ${dashboard.epocaNome}`
                            : "Sem época ativa"}{" "}
                        · Todos os escalões
                    </p>
                </div>
                <AgendarJogoModal
                    equipas={equipas.map((e) => ({ id: e.id, nome: e.nome }))}
                    meuClubeId={dashboard.organizationId}
                    defaultOpen={abrirModal}
                    defaultData={dataInicial}
                />
            </div>

            <JogosTable jogos={jogos} />
        </div>
    );
}