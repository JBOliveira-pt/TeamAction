// Página de jogos do presidente.
import {
    fetchJogos,
    fetchEquipas,
    fetchPresidenteDashboard,
} from "@/app/lib/data";
import JogosPageClient from "./jogos-page.client";

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
        <JogosPageClient
            jogosIniciais={jogos}
            equipas={equipas.map((e) => ({
                id: e.id,
                nome: e.nome,
                escalao: e.escalao,
            }))}
            meuClubeId={dashboard.organizationId}
            epocaNome={dashboard.epocaNome}
            defaultOpen={abrirModal}
            defaultData={dataInicial}
        />
    );
}
