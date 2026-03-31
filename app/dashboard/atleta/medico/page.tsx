import { fetchRegistosMedicos } from '@/app/lib/data';
import MedicoClientWrapper from './medico-client';

export const dynamic = 'force-dynamic';

export default async function MedicoPage() {
    const registos = await fetchRegistosMedicos();
    return <MedicoClientWrapper registos={registos} />;
}
