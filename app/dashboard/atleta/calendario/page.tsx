import {
    fetchJogosAtleta,
    fetchSessoesAtleta,
    fetchDatasComNotas,
} from "@/app/lib/data";
import Calendario from "./calendario";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
    const [jogos, sessoes, datasComNotas] = await Promise.all([
        fetchJogosAtleta().catch(() => []),
        fetchSessoesAtleta().catch(() => []),
        fetchDatasComNotas().catch(() => []),
    ]);
    return (
        <Calendario
            jogos={jogos}
            sessoes={sessoes}
            datasComNotas={datasComNotas}
        />
    );
}
