// Página de condicao fisica do responsável.
import {
    fetchCondicaoFisicaResponsavel,
    fetchAtletaDoResponsavel,
} from "@/app/lib/data";
import CondicaoFisicaResponsavelClient from "./condicao-fisica-responsavel-client";

export const dynamic = "force-dynamic";

export default async function ResponsavelCondicaoFisicaPage() {
    const [medidas, dadosAtleta] = await Promise.all([
        fetchCondicaoFisicaResponsavel(),
        fetchAtletaDoResponsavel(),
    ]);

    const nomeEducando = dadosAtleta?.atleta?.nome ?? "educando";

    return (
        <CondicaoFisicaResponsavelClient
            medidas={medidas}
            nomeEducando={nomeEducando}
        />
    );
}
