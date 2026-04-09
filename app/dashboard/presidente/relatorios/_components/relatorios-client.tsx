"use client";

import { useState } from "react";

type Epoca = { id: string; nome: string; ativa: boolean };

type Metadata = {
    epocas: Epoca[];
    staffCount: number;
    treinosCount: number;
    atletasCount: number;
};

const categoriaStyle: Record<string, string> = {
    Atletas: "bg-cyan-500/10 text-cyan-400",
    Financeiro: "bg-emerald-500/10 text-emerald-400",
    Treinos: "bg-amber-500/10 text-amber-400",
    Staff: "bg-blue-500/10 text-blue-400",
};

export default function RelatoriosClient({ metadata }: { metadata: Metadata }) {
    const { epocas, staffCount, treinosCount, atletasCount } = metadata;

    const [epochaSelecionada, setEpocaSelecionada] = useState<string>(
        epocas.find((e) => e.ativa)?.id ?? epocas[0]?.id ?? "",
    );
    const [downloading, setDownloading] = useState<number | null>(null);
    const [erros, setErros] = useState<Record<number, string>>({});

    // ✅ fetch+blob: resolve o problema do ficheiro corrompido (o <a download> falha
    // quando a rota é protegida por autenticação ou devolve headers errados)
    async function handleDownload(id: number, endpoint: string, filename: string) {
        setDownloading(id);
        setErros((prev) => ({ ...prev, [id]: "" }));
        try {
            const url =
                id === 1 && epochaSelecionada
                    ? `${endpoint}?epoca_id=${epochaSelecionada}`
                    : endpoint;

            const res = await fetch(url);
            if (!res.ok) {
                const msg = await res.text().catch(() => "Erro desconhecido");
                setErros((prev) => ({ ...prev, [id]: `Erro ao exportar: ${msg}` }));
                return;
            }
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch {
            setErros((prev) => ({
                ...prev,
                [id]: "Falha na ligação. Tenta novamente.",
            }));
        } finally {
            setDownloading(null);
        }
    }

    // Lógica de bloqueio por relatório
    const semEpoca = epocas.length === 0;
    const semStaff = staffCount === 0;
    const semTreinos = treinosCount === 0;
    const semAtletas = atletasCount === 0;

    const relatorios = [
        {
            id: 1,
            nome: semEpoca
                ? "Relatório de Atletas"
                : `Relatório de Atletas — ${epocas.find((e) => e.id === epochaSelecionada)?.nome ?? ""}`,
            descricao: "Lista completa de atletas, posições, equipas e estado.",
            icone: "👥",
            categoria: "Atletas",
            endpoint: "/api/relatorios/atletas",
            filename: "atletas.csv",
            bloqueado: semEpoca || semAtletas,
            aviso: semEpoca
                ? "Cria uma época antes de emitir este relatório."
                : semAtletas
                  ? "Ainda não há atletas cadastrados."
                  : null,
        },
        {
            id: 2,
            nome: "Relatório de Mensalidades — Mês Atual",
            descricao: "Estado de pagamentos de todos os atletas no mês corrente.",
            icone: "💶",
            categoria: "Financeiro",
            endpoint: "/api/relatorios/mensalidades",
            filename: `mensalidades-${new Date().toLocaleDateString("pt-PT", { month: "2-digit", year: "numeric" }).replace("/", "-")}.csv`,
            bloqueado: false,
            aviso: null,
        },
        {
            id: 3,
            nome: "Relatório de Assiduidade",
            descricao: "Taxa de presença nos treinos por atleta e por equipa.",
            icone: "📋",
            categoria: "Treinos",
            endpoint: "/api/relatorios/assiduidade",
            filename: "assiduidade.csv",
            bloqueado: semTreinos,
            aviso: semTreinos
                ? "Ainda não há treinos registados. Regista sessões antes de emitir."
                : null,
        },
        {
            id: 4,
            nome: "Relatório de Staff",
            descricao: "Lista de treinadores, funções e equipas associadas.",
            icone: "👨‍💼",
            categoria: "Staff",
            endpoint: "/api/relatorios/staff",
            filename: "staff.csv",
            bloqueado: semStaff,
            aviso: semStaff
                ? "Ainda não há staff cadastrado. Adiciona membros antes de emitir."
                : null,
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Relatórios
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Exporta dados do clube em CSV
                </p>
            </div>

            {/* Seletor de época — só aparece se houver mais do que uma época */}
            {epocas.length > 1 && (
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        📅 Época para relatórios de atletas:
                    </span>
                    <select
                        value={epochaSelecionada}
                        onChange={(e) => setEpocaSelecionada(e.target.value)}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        {epocas.map((ep) => (
                            <option key={ep.id} value={ep.id}>
                                {ep.nome} {ep.ativa ? "(ativa)" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatorios.map((r) => (
                    <div
                        key={r.id}
                        className={`bg-white dark:bg-gray-900 border rounded-xl p-5 flex items-start gap-4 transition-colors ${
                            r.bloqueado
                                ? "border-gray-200 dark:border-gray-800 opacity-70"
                                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                    >
                        <span className="text-3xl">{r.icone}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {r.nome}
                                </p>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoriaStyle[r.categoria]}`}
                                >
                                    {r.categoria}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {r.descricao}
                            </p>

                            {/* Aviso quando bloqueado */}
                            {r.aviso && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                                    <span>⚠️</span>
                                    <span>{r.aviso}</span>
                                </div>
                            )}

                            {/* Erro de download */}
                            {erros[r.id] && (
                                <p className="mt-2 text-xs text-red-400">
                                    ❌ {erros[r.id]}
                                </p>
                            )}

                            <div className="flex items-center gap-2 mt-3">
                                {r.bloqueado ? (
                                    <span className="text-xs text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg cursor-not-allowed">
                                        📊 Exportar CSV
                                    </span>
                                ) : (
                                    <button
                                        onClick={() =>
                                            handleDownload(
                                                r.id,
                                                r.endpoint,
                                                r.filename,
                                            )
                                        }
                                        disabled={downloading === r.id}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {downloading === r.id
                                            ? "⏳ A exportar..."
                                            : "📊 Exportar CSV"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}