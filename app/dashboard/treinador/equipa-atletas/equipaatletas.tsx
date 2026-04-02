"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

type Atleta = {
    id: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
    estado: string;
    equipa_id: string | null;
    equipa_nome: string | null;
};

type AtletaResultado = {
    id: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
    estado: string;
    equipa_id: string | null;
    equipa_nome: string | null;
    user_id: string | null;
    image_url: string | null;
};

type Equipa = { id: string; nome: string };

type ConvitePendente = {
    id: string;
    atleta_nome: string;
    equipa_nome: string | null;
    created_at: string;
};

const estadoCor: Record<string, string> = {
    Ativo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Lesionado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Suspenso:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Inativo: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

/* ── Toast ── */
function Toast({ msg, tipo }: { msg: string; tipo: "ok" | "erro" }) {
    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 ${tipo === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
        >
            {tipo === "ok" ? "✓" : "✕"} {msg}
        </div>
    );
}

/* ── Modal Todos os Atletas ── */
function ModalTodosAtletas({
    equipas,
    onClose,
    onConviteEnviado,
}: {
    equipas: Equipa[];
    onClose: () => void;
    onConviteEnviado: (atletaNome: string) => void;
}) {
    const [todos, setTodos] = useState<AtletaResultado[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("");
    const [atletaSelecionado, setAtletaSelecionado] = useState<AtletaResultado | null>(null);
    const [equipaId, setEquipaId] = useState(equipas[0]?.id ?? "");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        fetch("/api/atletas/todos")
            .then((r) => r.ok ? r.json() : [])
            .then((data) => { setTodos(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const visiveis = todos.filter((a) =>
        a.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    const enviarConvite = async () => {
        if (!atletaSelecionado) return;
        setErro("");
        setEnviando(true);
        const equipa = equipas.find((e) => e.id === equipaId);
        const res = await fetch("/api/convites-equipa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                atleta_id: atletaSelecionado.id,
                equipa_id: equipaId || undefined,
                equipa_nome: equipa?.nome,
            }),
        });
        setEnviando(false);
        if (res.ok) {
            onConviteEnviado(atletaSelecionado.nome);
            onClose();
        } else {
            setErro(await res.text());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Todos os Atletas</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Seleciona um atleta para convidar</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                    <input
                        autoFocus
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Filtrar por nome..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1.5">
                    {loading && <p className="text-xs text-gray-400 text-center py-4">A carregar...</p>}
                    {!loading && visiveis.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">Nenhum atleta encontrado.</p>
                    )}
                    {visiveis.map((a) => (
                        <button
                            key={a.id}
                            onClick={() => { setAtletaSelecionado(a); setErro(""); }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${atletaSelecionado?.id === a.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                        >
                            <div className="flex items-center gap-3">
                                {a.image_url ? (
                                    <img
                                        src={a.image_url}
                                        alt={a.nome}
                                        className="w-9 h-9 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                                            {a.nome.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{a.nome}</p>
                                    <p className="text-xs text-gray-400">
                                        {a.posicao ?? "—"}
                                        {a.numero_camisola ? ` · #${a.numero_camisola}` : ""}
                                        {a.equipa_nome ? ` · ${a.equipa_nome}` : ""}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${estadoCor[a.estado] ?? estadoCor.Inativo}`}>
                                    {a.estado}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
                {atletaSelecionado && (
                    <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                        <div className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-semibold text-blue-800 dark:text-blue-300">
                            ✓ {atletaSelecionado.nome} selecionado
                        </div>
                        {equipas.length > 0 && (
                            <select
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={equipaId}
                                onChange={(e) => setEquipaId(e.target.value)}
                            >
                                <option value="">Sem equipa definida</option>
                                {equipas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                            </select>
                        )}
                        {erro && <p className="text-xs text-red-500">{erro}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={enviarConvite}
                                disabled={enviando}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all"
                            >
                                {enviando ? "A enviar..." : "Enviar Convite"}
                            </button>
                            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-all">
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Modal Adicionar Atleta (pesquisa + convite) ── */
function ModalAdicionarAtleta({
    equipas,
    onClose,
    onConviteEnviado,
}: {
    equipas: Equipa[];
    onClose: () => void;
    onConviteEnviado: (atletaNome: string) => void;
}) {
    const [pesquisa, setPesquisa] = useState("");
    const [resultados, setResultados] = useState<AtletaResultado[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [atletaSelecionado, setAtletaSelecionado] =
        useState<AtletaResultado | null>(null);
    const [equipaId, setEquipaId] = useState(equipas[0]?.id ?? "");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        if (pesquisa.trim().length < 2) {
            timer.current = setTimeout(() => setResultados([]), 0);
        } else {
            timer.current = setTimeout(async () => {
                setBuscando(true);
                const res = await fetch(
                    `/api/atletas/pesquisar?q=${encodeURIComponent(pesquisa.trim())}`,
                );
                if (res.ok) setResultados(await res.json());
                setBuscando(false);
            }, 300);
        }
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [pesquisa]);

    const enviarConvite = async () => {
        if (!atletaSelecionado) return;
        setErro("");
        setEnviando(true);
        const equipa = equipas.find((e) => e.id === equipaId);
        const res = await fetch("/api/convites-equipa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                atleta_id: atletaSelecionado.id,
                equipa_id: equipaId || undefined,
                equipa_nome: equipa?.nome,
            }),
        });
        setEnviando(false);
        if (res.ok) {
            onConviteEnviado(atletaSelecionado.nome);
            onClose();
        } else {
            setErro(await res.text());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                            Adicionar Atleta
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Pesquisa um atleta registado na plataforma
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
                    {/* Campo de pesquisa */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Nome do atleta
                        </label>
                        <input
                            autoFocus
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Pesquisar por nome..."
                            value={pesquisa}
                            onChange={(e) => {
                                setPesquisa(e.target.value);
                                setAtletaSelecionado(null);
                                setErro("");
                            }}
                        />
                    </div>

                    {/* Resultados */}
                    {buscando && (
                        <p className="text-xs text-gray-400 text-center">
                            A pesquisar...
                        </p>
                    )}

                    {!buscando && resultados.length > 0 && (
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                            {resultados.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => {
                                        setAtletaSelecionado(a);
                                        setPesquisa(a.nome);
                                        setResultados([]);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${atletaSelecionado?.id === a.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                {a.nome}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {a.posicao ?? "—"}
                                                {a.numero_camisola
                                                    ? ` · #${a.numero_camisola}`
                                                    : ""}
                                                {a.equipa_nome
                                                    ? ` · ${a.equipa_nome}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoCor[a.estado] ?? estadoCor.Inativo}`}
                                        >
                                            {a.estado}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!buscando &&
                        pesquisa.trim().length >= 2 &&
                        resultados.length === 0 &&
                        !atletaSelecionado && (
                            <p className="text-sm text-gray-400 text-center py-2">
                                Nenhum atleta encontrado.
                            </p>
                        )}

                    {/* Seleção de equipa */}
                    {atletaSelecionado && (
                        <>
                            <div className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-semibold text-blue-800 dark:text-blue-300">
                                ✓ {atletaSelecionado.nome} selecionado
                            </div>

                            {equipas.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Equipa de destino
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={equipaId}
                                        onChange={(e) =>
                                            setEquipaId(e.target.value)
                                        }
                                    >
                                        <option value="">
                                            Sem equipa definida
                                        </option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-xs text-yellow-800 dark:text-yellow-300">
                                🔔 Será enviada uma notificação ao atleta para
                                aceitar ou recusar o convite.
                            </div>

                            {erro && (
                                <p className="text-xs text-red-500">{erro}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                    <button
                        onClick={enviarConvite}
                        disabled={!atletaSelecionado || enviando}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all"
                    >
                        {enviando ? "A enviar..." : "Enviar Convite"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Componente principal ── */
export default function EquipaAtletas({
    atletas: atletasIniciais,
    equipas,
}: {
    atletas: Atleta[];
    equipas: Equipa[];
}) {
    const [search, setSearch] = useState("");
    const [posicaoFiltro, setPosicaoFiltro] = useState("Todas");
    const [showAdicionar, setShowAdicionar] = useState(false);
    const [showTodos, setShowTodos] = useState(false);
    const [atletaModal, setAtletaModal] = useState<Atleta | null>(null);
    const [convitesPendentes, setConvitesPendentes] = useState<
        ConvitePendente[]
    >([]);
    const [toast, setToast] = useState<{
        msg: string;
        tipo: "ok" | "erro";
    } | null>(null);

    const showToast = useCallback((msg: string, tipo: "ok" | "erro" = "ok") => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 2500);
    }, []);

    useEffect(() => {
        fetch("/api/convites-equipa")
            .then((r) => (r.ok ? r.json() : []))
            .then(setConvitesPendentes)
            .catch(() => {});
    }, []);

    const posicoes = [
        "Todas",
        ...Array.from(
            new Set(
                atletasIniciais
                    .map((a) => a.posicao)
                    .filter(Boolean) as string[],
            ),
        ),
    ];

    const filtrados = atletasIniciais.filter((a) => {
        const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase());
        const matchPosicao =
            posicaoFiltro === "Todas" || a.posicao === posicaoFiltro;
        return matchSearch && matchPosicao;
    });

    const ativos = atletasIniciais.filter((a) => a.estado === "Ativo").length;
    const lesionados = atletasIniciais.filter(
        (a) => a.estado === "Lesionado",
    ).length;
    const suspensos = atletasIniciais.filter(
        (a) => a.estado === "Suspenso",
    ).length;

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">
            {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

            {/* Modal ver atleta */}
            {atletaModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-extrabold text-base">
                                    {atletaModal.nome.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                        {atletaModal.nome}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {atletaModal.posicao ?? "—"}
                                        {atletaModal.numero_camisola
                                            ? ` · #${atletaModal.numero_camisola}`
                                            : ""}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAtletaModal(null)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    {
                                        label: "Estado",
                                        value: atletaModal.estado,
                                    },
                                    {
                                        label: "Posição",
                                        value: atletaModal.posicao ?? "—",
                                    },
                                    {
                                        label: "Nº Camisola",
                                        value: atletaModal.numero_camisola
                                            ? `#${atletaModal.numero_camisola}`
                                            : "—",
                                    },
                                    {
                                        label: "Equipa",
                                        value:
                                            atletaModal.equipa_nome ??
                                            "Sem equipa",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3"
                                    >
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                            {item.label}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setAtletaModal(null)}
                                className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal adicionar atleta */}
            {showAdicionar && (
                <ModalAdicionarAtleta
                    equipas={equipas}
                    onClose={() => setShowAdicionar(false)}
                    onConviteEnviado={(nome) => {
                        showToast(`Convite enviado para ${nome}!`);
                        // Refresh pending invites
                        fetch("/api/convites-equipa")
                            .then((r) => (r.ok ? r.json() : []))
                            .then(setConvitesPendentes)
                            .catch(() => {});
                    }}
                />
            )}

            {/* Modal Todos os Atletas */}
            {showTodos && (
                <ModalTodosAtletas
                    equipas={equipas}
                    onClose={() => setShowTodos(false)}
                    onConviteEnviado={(nome) => {
                        showToast(`Convite enviado para ${nome}!`);
                        fetch("/api/convites-equipa")
                            .then((r) => (r.ok ? r.json() : []))
                            .then(setConvitesPendentes)
                            .catch(() => {});
                    }}
                />
            )}

            {/* Cabeçalho */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3">
                        <span>👥</span> Equipa
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {atletasIniciais.length} atletas registados
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAdicionar(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow transition-all flex items-center gap-2"
                    >
                        🔍 Pesquisar Atleta
                    </button>
                    <button
                        onClick={() => setShowTodos(true)}
                        className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-semibold text-sm shadow transition-all flex items-center gap-2"
                    >
                        👥 Todos
                    </button>
                </div>
            </div>

            {/* Convites pendentes */}
            {convitesPendentes.length > 0 && (
                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex flex-col gap-2">
                    <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">
                        🕐 Convites pendentes ({convitesPendentes.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {convitesPendentes.map((c) => (
                            <div
                                key={c.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                    {c.atleta_nome}
                                </span>
                                {c.equipa_nome && (
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                        {c.equipa_nome}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: "Total",
                        value: atletasIniciais.length,
                        color: "text-blue-600",
                        border: "border-blue-200 dark:border-blue-700",
                    },
                    {
                        label: "Ativos",
                        value: ativos,
                        color: "text-green-600",
                        border: "border-green-200 dark:border-green-700",
                    },
                    {
                        label: "Lesionados",
                        value: lesionados,
                        color: "text-red-600",
                        border: "border-red-200 dark:border-red-700",
                    },
                    {
                        label: "Suspensos",
                        value: suspensos,
                        color: "text-yellow-600",
                        border: "border-yellow-200 dark:border-yellow-700",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border ${s.border} shadow-sm flex flex-col`}
                    >
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {s.label}
                        </span>
                        <span className={`text-3xl font-bold mt-1 ${s.color}`}>
                            {s.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Grelha */}
            {atletasIniciais.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                    <span className="text-5xl">👥</span>
                    <p className="text-base font-medium">
                        Nenhum atleta registado.
                    </p>
                    <p className="text-sm text-gray-400 text-center max-w-sm">
                        Os atletas são registados pelo Presidente do clube.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtrados.map((atleta) => (
                        <div
                            key={atleta.id}
                            onClick={() => setAtletaModal(atleta)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xl font-extrabold flex-shrink-0 group-hover:scale-105 transition-transform">
                                    {atleta.nome.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                        {atleta.nome}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {atleta.posicao ?? "—"}
                                    </div>
                                </div>
                                {atleta.numero_camisola && (
                                    <span className="ml-auto text-lg font-extrabold text-gray-200 dark:text-gray-700">
                                        #{atleta.numero_camisola}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${estadoCor[atleta.estado] ?? estadoCor.Inativo}`}
                                >
                                    {atleta.estado}
                                </span>
                                {atleta.equipa_nome && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
                                        {atleta.equipa_nome}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtrados.length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                            Nenhum atleta encontrado.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
