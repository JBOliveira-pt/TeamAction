"use client";
import React, { useState, useEffect, useMemo } from "react";

/* ── Tipos ─────────────────────────────────────────────────────────────── */
type Estado = "P" | "F" | "J";

type Sessao = {
    id: string;
    data: string;
    tipo: string;
    duracao_min: number;
};

type Atleta = {
    id: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
};

type Registo = {
    atleta_id: string;
    sessao_id: string;
    estado: Estado;
    comentario: string | null;
};

type DadosAssiduidade = {
    sessoes: Sessao[];
    atletas: Atleta[];
    registos: Registo[];
};

/* ── Helpers visuais ───────────────────────────────────────────────────── */
const ESTADO_LABEL: Record<Estado, string> = { P: "Presente", F: "Falta", J: "Justificado" };
const ESTADO_BG: Record<Estado, string> = {
    P: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    F: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    J: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
};

function formatData(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

/* ── Componente principal ──────────────────────────────────────────────── */
export default function Assiduidade({
    sessoes: sessoesProp,
    atletas: atletasProp,
}: {
    sessoes: Sessao[];
    atletas: Atleta[];
}) {
    const [dados, setDados] = useState<DadosAssiduidade>({ sessoes: [], atletas: atletasProp, registos: [] });
    const [loadingDados, setLoadingDados] = useState(true);

    // Modal Registar Sessão
    const [showModal, setShowModal] = useState(false);
    const [sessaoSelecionada, setSessaoSelecionada] = useState<string>("");
    const [linhas, setLinhas] = useState<{ atleta_id: string; estado: Estado; comentario: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [erroModal, setErroModal] = useState("");

    // Fetch tabela de assiduidade
    useEffect(() => {
        fetch("/api/assiduidade")
            .then((r) => r.json())
            .then((d: DadosAssiduidade) => { setDados(d); setLoadingDados(false); })
            .catch(() => setLoadingDados(false));
    }, []);

    // Abrir modal → pré-preencher linhas com todos os atletas
    function abrirModal() {
        setSessaoSelecionada(sessoesProp[0]?.id ?? "");
        setLinhas(
            atletasProp.map((a) => ({ atleta_id: a.id, estado: "P" as Estado, comentario: "" })),
        );
        setErroModal("");
        setShowModal(true);
    }

    // Quando muda a sessão seleccionada, carregar registos existentes (se houver)
    function onChangeSessao(id: string) {
        setSessaoSelecionada(id);
        const existentes = dados.registos.filter((r) => r.sessao_id === id);
        setLinhas(
            atletasProp.map((a) => {
                const ex = existentes.find((r) => r.atleta_id === a.id);
                return {
                    atleta_id: a.id,
                    estado: (ex?.estado as Estado) ?? "P",
                    comentario: ex?.comentario ?? "",
                };
            }),
        );
    }

    async function submeterAssiduidade(e: React.FormEvent) {
        e.preventDefault();
        if (!sessaoSelecionada) { setErroModal("Selecione uma sessão."); return; }
        if (atletasProp.length === 0) { setErroModal("Sem atletas activos na organização."); return; }
        setSaving(true);
        setErroModal("");
        try {
            const res = await fetch("/api/assiduidade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessao_id: sessaoSelecionada, registos: linhas }),
            });
            if (res.ok) {
                // Actualizar dados locais
                const novosRegistos = linhas.map((l) => ({
                    atleta_id: l.atleta_id,
                    sessao_id: sessaoSelecionada,
                    estado: l.estado,
                    comentario: l.comentario || null,
                }));
                setDados((prev) => {
                    const semSessao = prev.registos.filter((r) => r.sessao_id !== sessaoSelecionada);
                    const sessaoInfo = sessoesProp.find((s) => s.id === sessaoSelecionada);
                    const sessoesExistentes = prev.sessoes.some((s) => s.id === sessaoSelecionada);
                    return {
                        ...prev,
                        sessoes: sessoesExistentes
                            ? prev.sessoes
                            : sessaoInfo
                            ? [sessaoInfo, ...prev.sessoes].slice(0, 10)
                            : prev.sessoes,
                        registos: [...semSessao, ...novosRegistos],
                    };
                });
                setShowModal(false);
            } else {
                setErroModal(await res.text());
            }
        } finally {
            setSaving(false);
        }
    }

    // ── Tabela de assiduidade ──────────────────────────────────────────────
    const sessoesTabela = dados.sessoes; // já ordenadas DESC, máx 10
    const atletasTabela = dados.atletas.length > 0 ? dados.atletas : atletasProp;

    const registoMap = useMemo(() => {
        const m: Record<string, Record<string, Registo>> = {};
        for (const r of dados.registos) {
            if (!m[r.atleta_id]) m[r.atleta_id] = {};
            m[r.atleta_id][r.sessao_id] = r;
        }
        return m;
    }, [dados.registos]);

    // Estatísticas
    const stats = useMemo(() => {
        if (sessoesTabela.length === 0 || atletasTabela.length === 0) return null;
        const total = sessoesTabela.length * atletasTabela.length;
        const presencas = dados.registos.filter((r) => r.estado === "P").length;
        const faltas = dados.registos.filter((r) => r.estado === "F").length;
        const percentGeral = total > 0 ? Math.round((presencas / total) * 100) : 0;

        // Atleta mais assíduo
        let maisAssiduo: { nome: string; pct: number } | null = null;
        for (const a of atletasTabela) {
            const registosAtleta = sessoesTabela.map((s) => registoMap[a.id]?.[s.id]?.estado ?? null).filter(Boolean);
            if (registosAtleta.length === 0) continue;
            const pct = Math.round((registosAtleta.filter((e) => e === "P").length / registosAtleta.length) * 100);
            if (!maisAssiduo || pct > maisAssiduo.pct) maisAssiduo = { nome: a.nome, pct };
        }

        return { percentGeral, presencas, faltas, maisAssiduo };
    }, [dados, sessoesTabela, atletasTabela, registoMap]);

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">

            {/* ── MODAL REGISTAR SESSÃO ─────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
                        {/* Cabeçalho */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Registar Assiduidade</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Selecione a sessão e marque as presenças</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xl font-bold transition-all"
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={submeterAssiduidade} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
                                {erroModal && (
                                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">
                                        {erroModal}
                                    </p>
                                )}

                                {/* Selecionar sessão */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Sessão de Treino <span className="text-red-500">*</span>
                                    </label>
                                    {sessoesProp.length === 0 ? (
                                        <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-2">
                                            Não há sessões registadas. Crie uma sessão primeiro em <strong>Sessões</strong>.
                                        </p>
                                    ) : (
                                        <select
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-400 focus:outline-none transition-all"
                                            value={sessaoSelecionada}
                                            onChange={(e) => onChangeSessao(e.target.value)}
                                        >
                                            {sessoesProp.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {formatData(s.data)} — {s.tipo} ({s.duracao_min} min)
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Lista de atletas */}
                                {atletasProp.length === 0 ? (
                                    <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-2">
                                        Não há atletas activos na organização.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                Presenças ({atletasProp.length} atletas)
                                            </label>
                                            <div className="flex gap-2">
                                                {(["P", "F", "J"] as Estado[]).map((e) => (
                                                    <button
                                                        key={e}
                                                        type="button"
                                                        onClick={() => setLinhas((prev) => prev.map((l) => ({ ...l, estado: e })))}
                                                        className={`text-xs font-bold px-2 py-1 rounded-lg border transition-all ${ESTADO_BG[e]} border-transparent`}
                                                    >
                                                        Todos {e}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Atleta</th>
                                                        <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                                        <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Comentário</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {linhas.map((linha, i) => {
                                                        const atleta = atletasProp.find((a) => a.id === linha.atleta_id);
                                                        return (
                                                            <tr key={linha.atleta_id} className={`border-t border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/30"}`}>
                                                                <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-100">
                                                                    <div className="flex items-center gap-1.5">
                                                                        {atleta?.numero_camisola && (
                                                                            <span className="text-xs text-gray-400 font-mono w-5 text-center">
                                                                                {atleta.numero_camisola}
                                                                            </span>
                                                                        )}
                                                                        <span>{atleta?.nome}</span>
                                                                        {atleta?.posicao && (
                                                                            <span className="text-xs text-gray-400">· {atleta.posicao}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    <div className="flex justify-center gap-1">
                                                                        {(["P", "F", "J"] as Estado[]).map((e) => (
                                                                            <button
                                                                                key={e}
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setLinhas((prev) =>
                                                                                        prev.map((l, idx) =>
                                                                                            idx === i ? { ...l, estado: e } : l,
                                                                                        ),
                                                                                    )
                                                                                }
                                                                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all border-2 ${
                                                                                    linha.estado === e
                                                                                        ? `${ESTADO_BG[e]} border-current scale-110`
                                                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 border-transparent hover:border-gray-300"
                                                                                }`}
                                                                                title={ESTADO_LABEL[e]}
                                                                            >
                                                                                {e}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    <input
                                                                        type="text"
                                                                        maxLength={200}
                                                                        placeholder="Comentário opcional..."
                                                                        className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-green-400 focus:outline-none"
                                                                        value={linha.comentario}
                                                                        onChange={(e) =>
                                                                            setLinhas((prev) =>
                                                                                prev.map((l, idx) =>
                                                                                    idx === i ? { ...l, comentario: e.target.value } : l,
                                                                                ),
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer do modal */}
                            <div className="p-6 pt-0 shrink-0 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={saving || sessoesProp.length === 0 || atletasProp.length === 0}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all"
                                >
                                    {saving ? "A guardar..." : "Guardar Assiduidade"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── CABEÇALHO ─────────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 flex items-center gap-3">
                        <span>✅</span> Assiduidade
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Registo de presenças por sessão de treino
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow font-bold flex items-center gap-2 transition-all"
                    onClick={abrirModal}
                >
                    <span className="text-xl">＋</span> Registar Assiduidade
                </button>
            </div>

            {/* ── ESTATÍSTICAS ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-green-300 dark:border-green-800 shadow-sm flex flex-col gap-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Assiduidade Geral</span>
                    <span className="text-3xl font-bold text-green-600">{stats?.percentGeral ?? "—"}%</span>
                    <span className="text-xs text-gray-400">Últimas sessões</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Presenças</span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.presencas ?? "—"}</span>
                    <span className="text-xs text-gray-400">Total registadas</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-yellow-300 dark:border-yellow-800 shadow-sm flex flex-col gap-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Faltas</span>
                    <span className="text-3xl font-bold text-yellow-600">{stats?.faltas ?? "—"}</span>
                    <span className="text-xs text-gray-400">Total registadas</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Atleta + Assíduo</span>
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                        {stats?.maisAssiduo?.nome ?? "—"}
                    </span>
                    <span className="text-xs text-gray-400">{stats?.maisAssiduo?.pct ?? "—"}% presença</span>
                </div>
            </div>

            {/* ── TABELA ────────────────────────────────────────────────── */}
            {loadingDados ? (
                <div className="text-center py-16 text-gray-400">A carregar assiduidade...</div>
            ) : sessoesTabela.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400">
                    Ainda não há assiduidade registada. Clique em <strong className="text-green-600">Registar Assiduidade</strong> para começar.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-100 dark:bg-gray-900">Atleta</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Pos.</th>
                                {sessoesTabela.map((s) => (
                                    <th key={s.id} className="py-3 px-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                                        <div>{formatData(s.data)}</div>
                                        <div className="font-normal text-gray-400 normal-case">{s.tipo}</div>
                                    </th>
                                ))}
                                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {atletasTabela.map((a, idx) => {
                                const registosAtleta = sessoesTabela.map((s) => registoMap[a.id]?.[s.id] ?? null);
                                const comRegisto = registosAtleta.filter(Boolean);
                                const pct = comRegisto.length > 0
                                    ? Math.round((comRegisto.filter((r) => r!.estado === "P").length / comRegisto.length) * 100)
                                    : null;

                                return (
                                    <tr key={a.id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/30"}`}>
                                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800">
                                            {a.nome}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                                            {a.posicao ?? "—"}
                                        </td>
                                        {registosAtleta.map((r, i) => (
                                            <td key={i} className="py-3 px-3 text-center" title={r?.comentario ?? ""}>
                                                {r ? (
                                                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${ESTADO_BG[r.estado as Estado]}`}>
                                                        {r.estado}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-full text-xs text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-700">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="py-3 px-4 text-center">
                                            {pct !== null ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-1.5 rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-400"}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {(["P", "F", "J"] as Estado[]).map((e) => (
                    <div key={e} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl ${ESTADO_BG[e]}`}>
                        <span className="font-bold">{e}</span> — {ESTADO_LABEL[e]}
                    </div>
                ))}
            </div>
        </div>
    );
}
