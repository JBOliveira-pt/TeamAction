import { fetchOrganizacao, fetchEpocaAtiva } from "@/app/lib/data";
import DefinicoesForm from "./_components/DefinicoesForm.client";

export const dynamic = "force-dynamic";

const planoStyle: Record<string, string> = {
    free: "bg-gray-500/10 text-gray-400",
    pro: "bg-violet-500/10 text-violet-400",
    premium: "bg-amber-500/10 text-amber-400",
};

export default async function ClubePage() {
    const [org, epoca] = await Promise.all([
        fetchOrganizacao(),
        fetchEpocaAtiva(),
    ]);

    if (!org) {
        return (
            <div className="p-6">
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Organização não encontrada.
                </p>
            </div>
        );
    }

    const formatData = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Clube
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Informações e configurações do clube
                </p>
            </div>

            {/* Dados do Clube */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        🏛️ Dados do Clube
                    </h2>
                    {org.plano && (
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${planoStyle[org.plano] ?? "bg-gray-500/10 text-gray-400"}`}
                        >
                            Plano {org.plano}
                        </span>
                    )}
                </div>
                <DefinicoesForm org={org} />
            </div>

            {/* Época Ativa */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        📅 Época Ativa
                    </h2>
                    <a
                        href="/dashboard/presidente/epoca"
                        className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                        Gerir Épocas →
                    </a>
                </div>
                {epoca ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Nome
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                                {epoca.nome}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Início
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                                {formatData(epoca.data_inicio)}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Fim
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                                {formatData(epoca.data_fim)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                        <p className="text-sm text-amber-400">
                            Nenhuma época ativa definida.
                        </p>
                        <a
                            href="/dashboard/presidente/epoca"
                            className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                        >
                            Criar época →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
