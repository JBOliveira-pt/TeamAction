// Página de medico do responsável.
import { fetchRegistosMedicosResponsavel } from "@/app/lib/data";
import MedicoResponsavelClient from "./medico-responsavel-client";

export const dynamic = "force-dynamic";

export default async function ResponsavelMedicoPage() {
    const registos = await fetchRegistosMedicosResponsavel();

    return <MedicoResponsavelClient registos={registos} />;
}
