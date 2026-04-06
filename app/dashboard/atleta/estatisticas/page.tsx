import { fetchAtletaAtual } from "@/app/lib/data";
import EstatisticasTreinoClient from "./estatisticas-client";

export const dynamic = "force-dynamic";

export default async function EstatisticasTreinoPage() {
    const atleta = await fetchAtletaAtual();

    const semEquipa = !atleta?.equipa_nome;
    const semTreinos =
        !atleta?.assiduidade || atleta.assiduidade.total_treinos === 0;

    return (
        <EstatisticasTreinoClient
            semEquipa={semEquipa}
            semTreinos={semTreinos}
            estatisticas={atleta?.estatisticas ?? null}
            assiduidade={atleta?.assiduidade ?? null}
        />
    );
}
