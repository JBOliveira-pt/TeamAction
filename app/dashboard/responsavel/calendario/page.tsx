import { fetchJogosResponsavel, fetchSessoesResponsavel } from "@/app/lib/data";
import Calendario from "../../atleta/calendario/calendario";

export const dynamic = "force-dynamic";

export default async function PaiCalendarioPage() {
    const [jogos, sessoes] = await Promise.all([
        fetchJogosResponsavel().catch(() => []),
        fetchSessoesResponsavel().catch(() => []),
    ]);
    return (
        <main className="p-4">
            <Calendario jogos={jogos} sessoes={sessoes} />
        </main>
    );
}
