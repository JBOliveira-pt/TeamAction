import { fetchNotasAtleta } from '@/app/lib/data';  
import NotasClientWrapper from './notas-client';  
  
export const dynamic = 'force-dynamic';  
  
export default async function NotasPage() {  
    const notas = await fetchNotasAtleta();  
    return <NotasClientWrapper notas={notas} />;  
} 
