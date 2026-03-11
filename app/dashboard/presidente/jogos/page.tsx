import { fetchJogos } from "@/app/lib/data";
import JogosTable from "./jogos-table";

export default async function JogosPage() {
    const jogos = await fetchJogos();

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jogos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Época 2024/2025 · Todos os escalões</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Agendar Jogo
                </button>
            </div>

            <JogosTable jogos={jogos} />
        </div>
    );
}

