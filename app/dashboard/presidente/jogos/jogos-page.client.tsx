// Componente cliente de jogos (presidente).
"use client";

import { useRouter } from "next/navigation";
import JogosTable from "./jogos-table.client";
import AgendarJogoModal from "./_components/AgendarJogoModal.client";

type Jogo = {
    id: string;
    adversario: string;
    data: string;
    casa_fora: string;
    resultado_nos: number | null;
    resultado_adv: number | null;
    estado: string;
    equipa_id: string;
    equipa_nome: string;
    hora_inicio: string | null;
    hora_fim: string | null;
    adversario_fake?: boolean;
    mirror_game_id?: string | null;
    resposta_adversario?: string | null;
    proposta_data?: string | null;
    proposta_hora?: string | null;
};

type Equipa = { id: string; nome: string; escalao?: string };

export default function JogosPageClient({
    jogosIniciais,
    equipas,
    meuClubeId,
    epocaNome,
    defaultOpen,
    defaultData,
}: {
    jogosIniciais: Jogo[];
    equipas: Equipa[];
    meuClubeId?: string;
    epocaNome?: string;
    defaultOpen: boolean;
    defaultData: string;
}) {
    const router = useRouter();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Jogos
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {epocaNome ? `Época ${epocaNome}` : "Sem época ativa"} ·
                        Todos os escalões
                    </p>
                </div>
                <AgendarJogoModal
                    equipas={equipas}
                    meuClubeId={meuClubeId}
                    defaultOpen={defaultOpen}
                    defaultData={defaultData}
                    onCreated={() => router.refresh()}
                />
            </div>

            <JogosTable jogos={jogosIniciais} />
        </div>
    );
}
