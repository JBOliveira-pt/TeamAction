"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";

type Equipa = { id: string; nome: string };

type Jogo = {
    id: string;
    adversario: string;
    data: string;
    casa_fora: string;
    local: string | null;
    estado: string;
    resultado_nos: number | null;
    resultado_adv: number | null;
    equipa_id: string | null;
    equipa_nome: string | null;
};

type Clube = { id: string; name: string; cidade: string | null; desporto: string | null };

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
const hojeISO = hoje.toISOString().split("T")[0];

/* ── Toast ────────────────────────────────────────────────────────────── */
function Toast({ msg, tipo }: { msg: string; tipo: "ok" | "erro" }) {
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 ${tipo === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {tipo === "ok" ? "✓" : "✕"} {msg}
        </div>
    );
}

/* ── Badge de estado ──────────────────────────────────────────────────── */
function EstadoBadge({ estado }: { estado: string }) {
    const map: Record<string, string> = {
        agendado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        realizado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        cancelado: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    };
    const label: Record<string, string> = { agendado: "Agendado", realizado: "Realizado", cancelado: "Cancelado" };
    return (
        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${map[estado] ?? map.agendado}`}>
            {label[estado] ?? estado}
        </span>
    );
}

/* ── Resultado badge ──────────────────────────────────────────────────── */
function ResultadoBadge({ nos, adv }: { nos: number; adv: number }) {
    const cor = nos > adv ? "bg-green-600" : nos < adv ? "bg-red-600" : "bg-yellow-500";
    const letra = nos > adv ? "V" : nos < adv ? "D" : "E";
    return (
        <span className={`px-3 py-1 rounded-lg font-bold text-xs text-white ${cor}`}>
            {nos}-{adv} {letra}
        </span>
    );
}

function formatData(iso: string) {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Modal Registar Resultado ──────────────────────────────────────────── */
function ModalResultado({ jogo, onSave, onClose }: {
    jogo: Jogo;
    onSave: (id: string, nos: number, adv: number) => Promise<void>;
    onClose: () => void;
}) {
    const [nos, setNos] = useState(jogo.resultado_nos?.toString() ?? "");
    const [adv, setAdv] = useState(jogo.resultado_adv?.toString() ?? "");
    const [saving, setSaving] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const n = parseInt(nos), a = parseInt(adv);
        if (isNaN(n) || isNaN(a) || n < 0 || a < 0) return;
        setSaving(true);
        await onSave(jogo.id, n, a);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">🏆 Registar Resultado</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold">×</button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    vs <strong className="text-gray-800 dark:text-gray-100">{jogo.adversario}</strong> · {formatData(jogo.data)}
                </p>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nós</label>
                            <input
                                type="number" min="0" max="99"
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-3 bg-gray-50 dark:bg-gray-800 text-center text-2xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                value={nos}
                                onChange={(e) => setNos(e.target.value)}
                                required autoFocus
                            />
                        </div>
                        <span className="text-2xl font-bold text-gray-400 mt-5">—</span>
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Adversário</label>
                            <input
                                type="number" min="0" max="99"
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-3 bg-gray-50 dark:bg-gray-800 text-center text-2xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                value={adv}
                                onChange={(e) => setAdv(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all">
                            {saving ? "A guardar..." : "Guardar"}
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Modal Novo Jogo (fluxo em passos) ─────────────────────────────────── */
function ModalNovoJogo({ equipas, onCreate, onClose }: {
    equipas: Equipa[];
    onCreate: (data: { adversario: string; data: string; casa_fora: string; local: string; equipa_id: string }) => Promise<void>;
    onClose: () => void;
}) {
    // Passo 1: perguntar se adversário está na plataforma
    // Passo 2: pesquisar (se sim) ou escrever nome (se não)
    // Passo 3: restante info
    const [passo, setPasso] = useState<1 | 2 | 3>(1);
    const [adversarioNaPlataforma, setAdversarioNaPlataforma] = useState<boolean | null>(null);

    // Pesquisa de clube
    const [pesquisa, setPesquisa] = useState("");
    const [resultados, setResultados] = useState<Clube[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [clubeSelecionado, setClubeSelecionado] = useState<Clube | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Nome manual
    const [nomeManual, setNomeManual] = useState("");

    // Dados do jogo
    const [dataJogo, setDataJogo] = useState("");
    const [casaFora, setCasaFora] = useState("casa");
    const [local, setLocal] = useState("");
    const [equipaId, setEquipaId] = useState("");
    const [saving, setSaving] = useState(false);
    const [erroData, setErroData] = useState("");

    // Pesquisa com debounce
    useEffect(() => {
        if (!adversarioNaPlataforma) return;
        if (pesquisa.trim().length < 2) { setResultados([]); return; }
        if (searchTimer.current) clearTimeout(searchTimer.current);
        setBuscando(true);
        searchTimer.current = setTimeout(async () => {
            const res = await fetch(`/api/clubes?q=${encodeURIComponent(pesquisa.trim())}`);
            if (res.ok) setResultados(await res.json());
            setBuscando(false);
        }, 350);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [pesquisa, adversarioNaPlataforma]);

    const adversarioFinal = adversarioNaPlataforma
        ? (clubeSelecionado?.name ?? "")
        : nomeManual.trim();

    const validarEAvancar = () => {
        if (!adversarioFinal || adversarioFinal.length < 2) return;
        setPasso(3);
    };

    const submitJogo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adversarioFinal || !dataJogo) return;

        // Validar data não passada
        const d = new Date(dataJogo);
        d.setHours(0, 0, 0, 0);
        if (d < hoje) {
            setErroData("Não é possível agendar um jogo em data já passada.");
            return;
        }
        setErroData("");
        setSaving(true);
        await onCreate({ adversario: adversarioFinal, data: dataJogo, casa_fora: casaFora, local, equipa_id: equipaId });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        {passo > 1 && (
                            <button onClick={() => setPasso((p) => (p - 1) as 1 | 2 | 3)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-lg">
                                ←
                            </button>
                        )}
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">🏆 Novo Jogo</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Passo {passo} de 3</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold">×</button>
                </div>

                {/* Barra de progresso */}
                <div className="h-1 bg-gray-100 dark:bg-gray-800">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${(passo / 3) * 100}%` }} />
                </div>

                <div className="p-5 flex flex-col gap-5">

                    {/* ── Passo 1: adversário na plataforma? ── */}
                    {passo === 1 && (
                        <>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">O adversário está cadastrado na plataforma?</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Se o clube adversário também usa o TeamAction, pode pesquisá-lo. Caso contrário, introduz o nome manualmente.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setAdversarioNaPlataforma(true); setPasso(2); }}
                                    className="flex-1 border-2 border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1"
                                >
                                    <span className="text-xl">🔍</span>
                                    <span>Sim, pesquisar</span>
                                </button>
                                <button
                                    onClick={() => { setAdversarioNaPlataforma(false); setPasso(2); }}
                                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1"
                                >
                                    <span className="text-xl">✏️</span>
                                    <span>Não, escrever</span>
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Passo 2a: pesquisar clube ── */}
                    {passo === 2 && adversarioNaPlataforma && (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pesquisar clube adversário <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    placeholder="Nome do clube..."
                                    value={pesquisa}
                                    onChange={(e) => { setPesquisa(e.target.value); setClubeSelecionado(null); }}
                                />
                            </div>

                            {buscando && <p className="text-xs text-gray-400 text-center">A pesquisar...</p>}

                            {!buscando && resultados.length > 0 && (
                                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                                    {resultados.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setClubeSelecionado(c); setPesquisa(c.name); setResultados([]); }}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${clubeSelecionado?.id === c.id ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                                        >
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{c.name}</p>
                                            {(c.cidade || c.desporto) && (
                                                <p className="text-xs text-gray-400">{[c.desporto, c.cidade].filter(Boolean).join(" · ")}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!buscando && pesquisa.trim().length >= 2 && resultados.length === 0 && !clubeSelecionado && (
                                <p className="text-sm text-gray-400 text-center py-2">Nenhum clube encontrado na plataforma.</p>
                            )}

                            <button
                                onClick={validarEAvancar}
                                disabled={!clubeSelecionado}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                            >
                                Continuar →
                            </button>
                        </>
                    )}

                    {/* ── Passo 2b: nome manual ── */}
                    {passo === 2 && !adversarioNaPlataforma && (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nome do clube adversário <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    placeholder="Ex: FC Maia"
                                    value={nomeManual}
                                    onChange={(e) => setNomeManual(e.target.value)}
                                    maxLength={100}
                                    onKeyDown={(e) => e.key === "Enter" && nomeManual.trim().length >= 2 && validarEAvancar()}
                                />
                                <p className="text-xs text-gray-400 text-right">{nomeManual.length}/100</p>
                            </div>
                            <button
                                onClick={validarEAvancar}
                                disabled={nomeManual.trim().length < 2}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                            >
                                Continuar →
                            </button>
                        </>
                    )}

                    {/* ── Passo 3: detalhes do jogo ── */}
                    {passo === 3 && (
                        <form onSubmit={submitJogo} className="flex flex-col gap-4">
                            <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm font-semibold text-amber-800 dark:text-amber-300">
                                vs {adversarioFinal}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Data <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    min={hojeISO}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    value={dataJogo}
                                    onChange={(e) => { setDataJogo(e.target.value); setErroData(""); }}
                                    required
                                />
                                {erroData && <p className="text-xs text-red-500">{erroData}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Casa / Fora <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                        value={casaFora}
                                        onChange={(e) => setCasaFora(e.target.value)}
                                    >
                                        <option value="casa">Casa</option>
                                        <option value="fora">Fora</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Equipa</label>
                                    <select
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                        value={equipaId}
                                        onChange={(e) => setEquipaId(e.target.value)}
                                    >
                                        <option value="">Nenhuma</option>
                                        {equipas.map((eq) => (
                                            <option key={eq.id} value={eq.id}>{eq.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Local</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    placeholder="Ex: Pavilhão Municipal"
                                    value={local}
                                    onChange={(e) => setLocal(e.target.value)}
                                    maxLength={100}
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button type="submit" disabled={saving} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow">
                                    {saving ? "A agendar..." : "Agendar Jogo"}
                                </button>
                                <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Componente principal ─────────────────────────────────────────────── */
export default function Jogos({ equipas }: { equipas: Equipa[] }) {
    const [jogos, setJogos] = useState<Jogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNovoJogo, setShowNovoJogo] = useState(false);
    const [modalResultado, setModalResultado] = useState<Jogo | null>(null);
    const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);

    const showToast = useCallback((msg: string, tipo: "ok" | "erro" = "ok") => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 2500);
    }, []);

    useEffect(() => {
        fetch("/api/jogos")
            .then((r) => r.ok ? r.json() : [])
            .then((data: Jogo[]) => setJogos(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    /* ── Stats ── */
    const realizados = jogos.filter((j) => j.estado === "realizado" && j.resultado_nos !== null);
    const vitorias = realizados.filter((j) => j.resultado_nos! > j.resultado_adv!).length;
    const empates = realizados.filter((j) => j.resultado_nos === j.resultado_adv).length;
    const derrotas = realizados.filter((j) => j.resultado_nos! < j.resultado_adv!).length;
    const proximoJogo = jogos.find((j) => j.estado === "agendado" && new Date(j.data) >= hoje);

    /* ── Criar jogo ── */
    const criarJogo = async (data: { adversario: string; data: string; casa_fora: string; local: string; equipa_id: string }) => {
        const res = await fetch("/api/jogos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const novo: Jogo = await res.json();
            setJogos((prev) => [novo, ...prev]);
            setShowNovoJogo(false);
            showToast("Jogo agendado com sucesso!");
        } else {
            showToast(await res.text(), "erro");
        }
    };

    /* ── Registar resultado ── */
    const registarResultado = async (id: string, nos: number, adv: number) => {
        const res = await fetch(`/api/jogos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resultado_nos: nos, resultado_adv: adv, estado: "realizado" }),
        });
        if (res.ok) {
            setJogos((prev) => prev.map((j) => j.id === id ? { ...j, resultado_nos: nos, resultado_adv: adv, estado: "realizado" } : j));
            setModalResultado(null);
            showToast("Resultado registado!");
        } else {
            showToast("Erro ao registar resultado.", "erro");
        }
    };

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-6">

            {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

            {showNovoJogo && (
                <ModalNovoJogo
                    equipas={equipas}
                    onCreate={criarJogo}
                    onClose={() => setShowNovoJogo(false)}
                />
            )}

            {modalResultado && (
                <ModalResultado
                    jogo={modalResultado}
                    onSave={registarResultado}
                    onClose={() => setModalResultado(null)}
                />
            )}

            {/* ── Cabeçalho ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center gap-3">
                        <span>🏆</span> Jogos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Planeie e acompanhe jogos e competições.
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow transition-all flex items-center gap-2"
                    onClick={() => setShowNovoJogo(true)}
                >
                    <span className="text-base">＋</span> Novo Jogo
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-xl p-5 shadow-sm flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Jogos Realizados</span>
                    <span className="text-3xl font-bold text-orange-600">{realizados.length}</span>
                    {realizados.length > 0 && (
                        <span className="text-xs text-gray-400">{vitorias}V · {empates}E · {derrotas}D</span>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl p-5 shadow-sm flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Próximo Jogo</span>
                    {proximoJogo ? (
                        <>
                            <span className="text-lg font-bold text-green-600 truncate">vs {proximoJogo.adversario}</span>
                            <span className="text-xs text-gray-400">{formatData(proximoJogo.data)} · {proximoJogo.casa_fora === "casa" ? "Casa" : "Fora"}</span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-400 mt-1">Sem jogos agendados</span>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-xl p-5 shadow-sm flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Agendados</span>
                    <span className="text-3xl font-bold text-blue-600">{jogos.filter((j) => j.estado === "agendado").length}</span>
                    <span className="text-xs text-gray-400">jogos por realizar</span>
                </div>
            </div>

            {/* ── Lista de jogos ── */}
            <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
                    <span>🏅</span> Todos os Jogos
                </h3>

                {loading ? (
                    <div className="flex justify-center py-12 text-gray-400 text-sm">A carregar...</div>
                ) : jogos.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                        <span className="text-5xl">🏟️</span>
                        <p className="text-base font-medium">Nenhum jogo registado.</p>
                        <button
                            onClick={() => setShowNovoJogo(true)}
                            className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all"
                        >
                            Agendar primeiro jogo
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Data</th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Adversário</th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Local</th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Resultado</th>
                                    <th className="p-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {jogos.map((j) => {
                                    const dataPassada = new Date(j.data) < hoje;
                                    const semResultado = j.estado !== "cancelado" && j.resultado_nos === null && dataPassada;
                                    return (
                                        <tr key={j.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all">
                                            <td className="p-3 font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                {formatData(j.data)}
                                            </td>
                                            <td className="p-3">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{j.adversario}</p>
                                                {j.equipa_nome && <p className="text-xs text-gray-400">{j.equipa_nome}</p>}
                                            </td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">
                                                {j.casa_fora === "casa" ? "🏠 Casa" : "✈️ Fora"}
                                                {j.local && <span className="text-xs text-gray-400 block">{j.local}</span>}
                                            </td>
                                            <td className="p-3"><EstadoBadge estado={j.estado} /></td>
                                            <td className="p-3">
                                                {j.resultado_nos !== null && j.resultado_adv !== null ? (
                                                    <ResultadoBadge nos={j.resultado_nos} adv={j.resultado_adv} />
                                                ) : semResultado ? (
                                                    <span className="text-xs text-gray-400">Sem resultado</span>
                                                ) : (
                                                    <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {semResultado && (
                                                    <button
                                                        onClick={() => setModalResultado(j)}
                                                        className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all whitespace-nowrap"
                                                    >
                                                        + Resultado
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
