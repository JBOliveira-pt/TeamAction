import { fetchAtletaAtual, fetchCondicaoFisica } from "@/app/lib/data";
import CondicaoFisicaClient from "./condicao-fisica-client";

export const dynamic = "force-dynamic";

export default async function AtletaCondicaoFisicaPage() {
    const [medidas, dadosAtleta] = await Promise.all([
        fetchCondicaoFisica(),
        fetchAtletaAtual(),
    ]);

    const contaPendente =
        (dadosAtleta?.menor_idade ?? false) &&
        (dadosAtleta?.responsavel_pendente ?? false);

    return (
        <CondicaoFisicaClient medidas={medidas} contaPendente={contaPendente} />
    );
}
