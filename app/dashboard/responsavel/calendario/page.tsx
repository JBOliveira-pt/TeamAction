import {
    fetchJogosResponsavel,
    fetchSessoesResponsavel,
    fetchDatasComNotas,
} from "@/app/lib/data";
import Calendario from "@/app/dashboard/atleta/calendario/calendario.client";

export const dynamic = "force-dynamic";

export default async function PaiCalendarioPage() {
    const [jogos, sessoes, datasComNotas] = await Promise.all([
        fetchJogosResponsavel().catch(() => []),
        fetchSessoesResponsavel().catch(() => []),
        fetchDatasComNotas().catch(() => []),
    ]);
    return (
        <main className="p-3">
            <Calendario
                jogos={jogos}
                sessoes={sessoes}
                datasComNotas={datasComNotas}
            />
        </main>
    );
}
