import { fetchJogos, fetchEpocaAtiva } from "@/app/lib/data";
import CalendarioPresidente from "./calendario";

export const dynamic = "force-dynamic";

export default async function CalendarioPresidentePage() {
    const [jogos, epoca] = await Promise.all([
        fetchJogos().catch(() => []),
        fetchEpocaAtiva().catch(() => null),
    ]);
    return <CalendarioPresidente jogos={jogos} epoca={epoca} />;
}
