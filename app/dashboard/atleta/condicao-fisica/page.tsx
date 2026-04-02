import { fetchCondicaoFisica } from '@/app/lib/data';
import CondicaoFisicaClient from './condicao-fisica-client';

export const dynamic = 'force-dynamic';

export default async function AtletaCondicaoFisicaPage() {
    const medidas = await fetchCondicaoFisica();
    return <CondicaoFisicaClient medidas={medidas} />;
}
