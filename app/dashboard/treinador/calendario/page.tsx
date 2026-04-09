import {
    fetchJogosTreinador,
    fetchEpocaAtiva,
    fetchSessoesTreinador,
    fetchDatasComNotas,
} from "@/app/lib/data";
import Calendario from "./calendario.client";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
    const [jogos, epoca, sessoes, datasComNotas] = await Promise.all([
        fetchJogosTreinador().catch(() => []),
        fetchEpocaAtiva().catch(() => null),
        fetchSessoesTreinador().catch(() => []),
        fetchDatasComNotas().catch(() => []),
    ]);
    return (
        <Calendario
            jogos={jogos}
            epoca={epoca}
            sessoes={sessoes}
            datasComNotas={datasComNotas}
        />
    );
}
