import {
    fetchAtletaAtual,
    fetchJogosAtleta,
    fetchSessoesAtleta,
    fetchDatasComNotas,
} from "@/app/lib/data";
import Calendario from "./calendario";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
    const [jogos, sessoes, datasComNotas, dadosAtleta] = await Promise.all([
        fetchJogosAtleta().catch(() => []),
        fetchSessoesAtleta().catch(() => []),
        fetchDatasComNotas().catch(() => []),
        fetchAtletaAtual(),
    ]);

    const contaPendente =
        (dadosAtleta?.menor_idade ?? false) &&
        (dadosAtleta?.responsavel_pendente ?? false);

    return (
        <Calendario
            jogos={jogos}
            sessoes={sessoes}
            datasComNotas={datasComNotas}
            contaPendente={contaPendente}
        />
    );
}
