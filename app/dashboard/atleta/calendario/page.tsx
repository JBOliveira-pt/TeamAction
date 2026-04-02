import { fetchJogosAtleta, fetchSessoesAtleta } from '@/app/lib/data';
import Calendario from './calendario';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
    const [jogos, sessoes] = await Promise.all([
        fetchJogosAtleta().catch(() => []),
        fetchSessoesAtleta().catch(() => []),
    ]);
    return <Calendario jogos={jogos} sessoes={sessoes} />;
}
