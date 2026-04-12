// Página de notas do atleta.
import { fetchAtletaAtual } from "@/app/lib/data";
import NotasUnificadas from "@/app/ui/components/notas-unificadas";

export const dynamic = "force-dynamic";

export default async function AtletaNotasPage() {
    const dadosAtleta = await fetchAtletaAtual();
    const contaPendente =
        (dadosAtleta?.menor_idade ?? false) &&
        (dadosAtleta?.responsavel_pendente ?? false);

    return <NotasUnificadas contaPendente={contaPendente} />;
}
