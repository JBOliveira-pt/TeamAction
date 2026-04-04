import { fetchJogosAtleta, fetchSessoesAtleta } from '@/app/lib/data';
import Calendario from '../../atleta/calendario/calendario';

export const dynamic = 'force-dynamic';

export default async function PaiCalendarioPage() {
    const [jogos, sessoes] = await Promise.all([
        fetchJogosAtleta().catch(() => []),
        fetchSessoesAtleta().catch(() => []),
    ]);
    return (
        <main className="p-4">
            <Calendario jogos={jogos} sessoes={sessoes} />
        </main>
    );
}
