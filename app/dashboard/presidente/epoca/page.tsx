// Página de epoca do presidente.
import { fetchEpocaAtiva } from "@/app/lib/data";
import NovaEpocaModal from "./_components/NovaEpocaModal.client";

export const dynamic = 'force-dynamic';

export default async function EpocaAtualPage() {
    const epoca = await fetchEpocaAtiva();

    if (!epoca) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhuma época registada ainda.</p>
                <NovaEpocaModal />
            </div>
        );
    }

    const dataInicio = new Date(epoca.data_inicio);
    const dataFim = new Date(epoca.data_fim);
    const hoje = new Date();

    const totalDias = Math.max(1, Math.round((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
    const diasPassados = Math.min(totalDias, Math.max(0, Math.round((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))));
    const progresso = Math.round((diasPassados / totalDias) * 100);

    const mesesRestantes = Math.max(0, Math.round((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    const estado = hoje < dataInicio ? "Por iniciar" : hoje > dataFim ? "Concluída" : "Em curso";

    const estadoCor = {
        "Em curso":    "text-violet-400",
        "Concluída":   "text-emerald-400",
        "Por iniciar": "text-amber-400",
    }[estado] ?? "text-gray-400";

    const formatData = (date: Date) =>
        date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Época Atual</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{epoca.nome} · {estado}</p>
                </div>
                <NovaEpocaModal />
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Início</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-2">{formatData(dataInicio)}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fim</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatData(dataFim)}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {estado === "Em curso" ? "Meses Restantes" : "Duração Total"}
                    </p>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">
                        {estado === "Em curso" ? `${mesesRestantes} meses` : `${Math.round(totalDias / 30)} meses`}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-violet-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado</p>
                    <p className={`text-2xl font-bold mt-2 ${estadoCor}`}>{estado}</p>
                </div>
            </div>

            {/* Progresso da época */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">📅 Progresso da Época</h2>
                    <span className="text-sm font-bold text-violet-400">{progresso}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${progresso}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>{formatData(dataInicio)}</span>
                    <span>{diasPassados} de {totalDias} dias</span>
                    <span>{formatData(dataFim)}</span>
                </div>
            </div>

            {/* Detalhes da época */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">📋 Detalhes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Nome da Época</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{epoca.nome}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Estado</p>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-0.5 ${
                            estado === "Em curso"    ? "bg-violet-500/10 text-violet-400" :
                            estado === "Concluída"   ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-amber-500/10 text-amber-400"
                        }`}>
                            {estado}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Data de Início</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{formatData(dataInicio)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Data de Fim</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{formatData(dataFim)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Dias Decorridos</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{diasPassados} dias</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Duração Total</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{totalDias} dias</p>
                    </div>
                </div>
            </div>
        </div>
    );
}



