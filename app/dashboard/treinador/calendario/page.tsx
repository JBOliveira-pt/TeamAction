import {
    fetchJogosTreinador,
    fetchEpocaAtiva,
    fetchSessoesTreinador,
} from "@/app/lib/data";
import Calendario from "./calendario";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
    const [jogos, epoca, sessoes] = await Promise.all([
        fetchJogosTreinador().catch(() => []),
        fetchEpocaAtiva().catch(() => null),
        fetchSessoesTreinador().catch(() => []),
    ]);
    return <Calendario jogos={jogos} epoca={epoca} sessoes={sessoes} />;
}
