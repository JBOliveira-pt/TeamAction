import {
    fetchJogos,
    fetchEpocaAtiva,
    fetchSessoesPresidente,
} from "@/app/lib/data";
import CalendarioPresidente from "./calendario";

export const dynamic = "force-dynamic";

export default async function CalendarioPresidentePage() {
    const [jogos, epoca, sessoes] = await Promise.all([
        fetchJogos().catch(() => []),
        fetchEpocaAtiva().catch(() => null),
        fetchSessoesPresidente().catch(() => []),
    ]);
    return (
        <CalendarioPresidente jogos={jogos} epoca={epoca} sessoes={sessoes} />
    );
}
