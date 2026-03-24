import { fetchJogos } from "@/app/lib/data";
import Calendario from "./calendario";

export default async function CalendarioPage() {
    const jogos = await fetchJogos().catch(() => []);
    return <Calendario jogos={jogos} />;
}
