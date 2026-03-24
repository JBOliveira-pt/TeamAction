import { fetchJogos } from "@/app/lib/data";
import Calendario from "./calendario";

export default async function CalendarioPage() {
    let jogos: Awaited<ReturnType<typeof fetchJogos>> = [];
    try {
        jogos = await fetchJogos();
    } catch {
        jogos = [];
    }

    return <Calendario jogos={jogos} />;
}
