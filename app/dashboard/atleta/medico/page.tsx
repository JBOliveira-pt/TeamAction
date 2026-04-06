import { fetchAtletaAtual, fetchRegistosMedicos } from "@/app/lib/data";
import MedicoClientWrapper from "./medico-client";

export const dynamic = "force-dynamic";

export default async function MedicoPage() {
    const [registos, dadosAtleta] = await Promise.all([
        fetchRegistosMedicos(),
        fetchAtletaAtual(),
    ]);

    const contaPendente =
        (dadosAtleta?.menor_idade ?? false) &&
        (dadosAtleta?.responsavel_pendente ?? false);

    return (
        <MedicoClientWrapper
            registos={registos}
            contaPendente={contaPendente}
        />
    );
}
