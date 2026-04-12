// Componente estatisticas client.
"use client";

import { AlertTriangle } from "lucide-react";

type Estatisticas = {
    total_jogos: number;
    total_golos: number;
    total_assistencias: number;
    total_minutos: number;
};

type Assiduidade = {
    total_treinos: number;
    presencas: number;
};

function AlertaBanner({ mensagem }: { mensagem: string }) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle size={16} className="shrink-0" />
            {mensagem}
        </div>
    );
}

function StatCard({
    label,
    value,
    alerta,
}: {
    label: string;
    value: string;
    alerta?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
            </span>
            {alerta && <AlertaBanner mensagem={alerta} />}
        </div>
    );
}

export default function EstatisticasTreinoClient({
    semEquipa,
    semTreinos,
    estatisticas,
    assiduidade,
}: {
    semEquipa: boolean;
    semTreinos: boolean;
    estatisticas: Estatisticas | null;
    assiduidade: Assiduidade | null;
}) {
    const alertaEquipa = semEquipa
        ? "Ainda não tens uma equipa associada."
        : undefined;
    const alertaTreino = semTreinos
        ? "Ainda não tens treinos registados."
        : undefined;

    const taxaPresenca =
        assiduidade && assiduidade.total_treinos > 0
            ? Math.round(
                  (assiduidade.presencas / assiduidade.total_treinos) * 100,
              )
            : null;

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    Estatísticas
                </h1>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Jogos disputados"
                    value={
                        estatisticas ? String(estatisticas.total_jogos) : "0"
                    }
                    alerta={alertaEquipa}
                />
                <StatCard
                    label="Golos marcados"
                    value={
                        estatisticas ? String(estatisticas.total_golos) : "0"
                    }
                    alerta={alertaEquipa}
                />
                <StatCard
                    label="Assistências"
                    value={
                        estatisticas
                            ? String(estatisticas.total_assistencias)
                            : "0"
                    }
                    alerta={alertaEquipa}
                />
                <StatCard
                    label="Minutos jogados"
                    value={
                        estatisticas ? String(estatisticas.total_minutos) : "0"
                    }
                    alerta={alertaEquipa}
                />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="Treinos registados"
                    value={
                        assiduidade ? String(assiduidade.total_treinos) : "0"
                    }
                    alerta={alertaTreino}
                />
                <StatCard
                    label="Presenças"
                    value={assiduidade ? String(assiduidade.presencas) : "0"}
                    alerta={alertaTreino}
                />
                <StatCard
                    label="Taxa de presença"
                    value={taxaPresenca !== null ? `${taxaPresenca}%` : "—"}
                    alerta={alertaTreino}
                />
            </div>
        </main>
    );
}
