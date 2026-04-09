import {
    fetchJogos,
    fetchEpocaAtiva,
    fetchSessoesPresidente,
    fetchDatasComNotas,
} from "@/app/lib/data";
import CalendarioPresidente from "./calendario.client";

export const dynamic = "force-dynamic";

export default async function CalendarioPresidentePage() {
    const [jogos, epoca, sessoes, datasComNotas] = await Promise.all([
        fetchJogos().catch(() => []),
        fetchEpocaAtiva().catch(() => null),
        fetchSessoesPresidente().catch(() => []),
        fetchDatasComNotas().catch(() => []),
    ]);
    return (
        <CalendarioPresidente
            jogos={jogos}
            epoca={epoca}
            sessoes={sessoes}
            datasComNotas={datasComNotas}
        />
    );
}
