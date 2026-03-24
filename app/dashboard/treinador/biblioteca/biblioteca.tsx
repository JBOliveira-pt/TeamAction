"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Jogada = {
    id: string;
    nome: string;
    tipo: string;
    sistema: string;
    posicoes: unknown[];
    created_at: string;
};

const CATEGORIAS = ["Todas", "Ataque", "Defesa", "Transição", "Bola Parada", "Personalizada"];

const catColors: Record<string, string> = {
    Ataque: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Defesa: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Transição: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "Bola Parada": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Personalizada: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

/* ── SVG Diagrama tático ──────────────────────────────────────────────── */
function PlayerDot({ x, y, c, r }: { x: number; y: number; c: string; r: number }) {
    return <circle cx={x} cy={y} r={r} fill={c} stroke="white" strokeWidth={1.4} />;
}

function TacticalDiagram({ tipo, large = false }: { tipo: string; large?: boolean }) {
    const r = large ? 5.5 : 4.5;

    return (
        <svg viewBox="0 0 120 70" className="w-full h-full">
            <rect x="2" y="2" width="116" height="66" rx="2" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
            <line x1="60" y1="2" x2="60" y2="68" stroke="#22c55e" strokeWidth="0.7" opacity="0.4" />
            <circle cx="60" cy="35" r="10" fill="none" stroke="#22c55e" strokeWidth="0.7" opacity="0.4" />
            <rect x="2" y="25" width="11" height="20" fill="none" stroke="#22c55e" strokeWidth="1" />
            <rect x="107" y="25" width="11" height="20" fill="none" stroke="#22c55e" strokeWidth="1" />

            {tipo === "Ataque" && (
                <>
                    <PlayerDot x={9} y={35} c="#1d4ed8" r={r} />
                    <PlayerDot x={50} y={22} c="#3b82f6" r={r} />
                    <PlayerDot x={46} y={35} c="#3b82f6" r={r} />
                    <PlayerDot x={50} y={48} c="#3b82f6" r={r} />
                    <PlayerDot x={70} y={11} c="#3b82f6" r={r} />
                    <PlayerDot x={70} y={59} c="#3b82f6" r={r} />
                    <PlayerDot x={81} y={35} c="#3b82f6" r={r} />
                    <line x1="54" y1="24" x2="73" y2="29" stroke="#f59e0b" strokeWidth="1.8" opacity="0.85" />
                    <line x1="50" y1="35" x2="74" y2="35" stroke="#f59e0b" strokeWidth="1.8" opacity="0.85" />
                    <line x1="54" y1="46" x2="73" y2="41" stroke="#f59e0b" strokeWidth="1.8" opacity="0.85" />
                </>
            )}

            {tipo === "Defesa" && (
                <>
                    <PlayerDot x={9} y={35} c="#1d4ed8" r={r} />
                    <PlayerDot x={22} y={24} c="#3b82f6" r={r} />
                    <PlayerDot x={30} y={19} c="#3b82f6" r={r} />
                    <PlayerDot x={40} y={17} c="#3b82f6" r={r} />
                    <PlayerDot x={50} y={19} c="#3b82f6" r={r} />
                    <PlayerDot x={58} y={24} c="#3b82f6" r={r} />
                    <PlayerDot x={40} y={32} c="#3b82f6" r={r} />
                    <PlayerDot x={72} y={20} c="#ef4444" r={r} />
                    <PlayerDot x={76} y={35} c="#ef4444" r={r} />
                    <PlayerDot x={72} y={50} c="#ef4444" r={r} />
                </>
            )}

            {tipo === "Transição" && (
                <>
                    <PlayerDot x={9} y={35} c="#1d4ed8" r={r} />
                    <PlayerDot x={30} y={35} c="#3b82f6" r={r} />
                    <PlayerDot x={65} y={18} c="#3b82f6" r={r} />
                    <PlayerDot x={68} y={35} c="#3b82f6" r={r} />
                    <PlayerDot x={65} y={52} c="#3b82f6" r={r} />
                    <PlayerDot x={48} y={27} c="#ef4444" r={r} />
                    <PlayerDot x={48} y={43} c="#ef4444" r={r} />
                    <line x1="34" y1="35" x2="62" y2="35" stroke="#3b82f6" strokeWidth="2" opacity="0.85" />
                    <line x1="34" y1="33" x2="62" y2="21" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.8" />
                    <line x1="34" y1="37" x2="62" y2="49" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.8" />
                </>
            )}

            {tipo === "Bola Parada" && (
                <>
                    <PlayerDot x={111} y={35} c="#ef4444" r={r} />
                    <PlayerDot x={98} y={26} c="#ef4444" r={r} />
                    <PlayerDot x={98} y={34} c="#ef4444" r={r} />
                    <PlayerDot x={98} y={42} c="#ef4444" r={r} />
                    <PlayerDot x={87} y={52} c="#3b82f6" r={r} />
                    <PlayerDot x={75} y={22} c="#3b82f6" r={r} />
                    <PlayerDot x={76} y={35} c="#3b82f6" r={r} />
                    <path d="M87,49 Q96,38 109,33" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="3,2" opacity="0.9" />
                </>
            )}

            {!["Ataque", "Defesa", "Transição", "Bola Parada"].includes(tipo) && (
                <>
                    {[22, 38, 60, 82, 98].map((cx, i) => (
                        <circle key={i} cx={cx} cy={35} r={r} fill="#6366f1" stroke="white" strokeWidth={1.4} />
                    ))}
                </>
            )}
        </svg>
    );
}

/* ── Modal confirmação ────────────────────────────────────────────────── */
function ModalConfirm({ titulo, descricao, onConfirm, onCancel }: {
    titulo: string;
    descricao?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{titulo}</h3>
                {descricao && <p className="text-sm text-gray-500 dark:text-gray-400">{descricao}</p>}
                <div className="flex gap-2">
                    <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-all">
                        Remover
                    </button>
                    <button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Toast ────────────────────────────────────────────────────────────── */
function Toast({ msg, tipo }: { msg: string; tipo: "ok" | "erro" }) {
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 ${tipo === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {tipo === "ok" ? "✓" : "✕"} {msg}
        </div>
    );
}

function formatData(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

/* ── Componente principal ─────────────────────────────────────────────── */
export default function Biblioteca() {
    const router = useRouter();
    const [jogadas, setJogadas] = useState<Jogada[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Todas");

    const [modal, setModal] = useState<{ type: "view" | "edit"; jogada: Jogada } | null>(null);
    const [editForm, setEditForm] = useState({ nome: "", tipo: "Ataque" });
    const [saving, setSaving] = useState(false);

    const [confirmRemover, setConfirmRemover] = useState<Jogada | null>(null);

    const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
    const showToast = useCallback((msg: string, tipo: "ok" | "erro" = "ok") => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 2500);
    }, []);

    /* ── Carregar ── */
    useEffect(() => {
        fetch("/api/jogadas-taticas")
            .then((r) => r.ok ? r.json() : [])
            .then((data: Jogada[]) => setJogadas(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    /* ── Filtro ── */
    const filtradas = jogadas.filter((j) => {
        const matchSearch = j.nome.toLowerCase().includes(search.toLowerCase());
        const matchCat = filter === "Todas" || j.tipo === filter;
        return matchSearch && matchCat;
    });

    /* ── Editar ── */
    const abrirEditar = (j: Jogada) => {
        setEditForm({ nome: j.nome, tipo: j.tipo });
        setModal({ type: "edit", jogada: j });
    };

    const guardarEdicao = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modal) return;
        setSaving(true);
        const res = await fetch(`/api/jogadas-taticas/${modal.jogada.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: editForm.nome.trim(), tipo: editForm.tipo, sistema: modal.jogada.sistema, posicoes: modal.jogada.posicoes }),
        });
        setSaving(false);
        if (res.ok) {
            setJogadas((prev) => prev.map((j) => j.id === modal.jogada.id ? { ...j, nome: editForm.nome.trim(), tipo: editForm.tipo } : j));
            setModal(null);
            showToast("Jogada actualizada!");
        } else {
            showToast(await res.text(), "erro");
        }
    };

    /* ── Remover ── */
    const remover = async (id: string) => {
        const res = await fetch(`/api/jogadas-taticas/${id}`, { method: "DELETE" });
        if (res.ok) {
            setJogadas((prev) => prev.filter((j) => j.id !== id));
            setModal(null);
            setConfirmRemover(null);
            showToast("Jogada removida.");
        } else {
            showToast("Erro ao remover.", "erro");
        }
    };

    /* ── Render ── */
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">

            {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

            {/* ── MODAL CONFIRMAÇÃO REMOVER ── */}
            {confirmRemover && (
                <ModalConfirm
                    titulo="Remover jogada?"
                    descricao={`"${confirmRemover.nome}" será eliminada permanentemente.`}
                    onConfirm={() => remover(confirmRemover.id)}
                    onCancel={() => setConfirmRemover(null)}
                />
            )}

            {/* ── MODAL VER / EDITAR ── */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <button
                            className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
                            onClick={() => setModal(null)}
                        >
                            ×
                        </button>

                        {modal.type === "view" ? (
                            <>
                                <div className="flex flex-col items-center mb-6">
                                    <span className="text-purple-600 text-4xl mb-2">📋</span>
                                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white text-center">{modal.jogada.nome}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Adicionado {formatData(modal.jogada.created_at)} · Sistema {modal.jogada.sistema}
                                    </p>
                                </div>
                                <div className="flex justify-center mb-5">
                                    <span className={`font-bold px-3 py-1 rounded-lg text-sm ${catColors[modal.jogada.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                                        {modal.jogada.tipo}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-3 mb-6 aspect-video flex items-center justify-center">
                                    <TacticalDiagram tipo={modal.jogada.tipo} large />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => abrirEditar(modal.jogada)}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 font-bold shadow transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>✏️</span> Editar
                                    </button>
                                    <button
                                        onClick={() => setModal(null)}
                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl py-2.5 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center mb-6">
                                    <span className="text-purple-600 text-4xl mb-2">✏️</span>
                                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Editar Jogada</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Altera o nome ou categoria da jogada</p>
                                </div>
                                <form onSubmit={guardarEdicao} className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nome <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                                            value={editForm.nome}
                                            onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                                            maxLength={80}
                                            required
                                        />
                                        <p className="text-xs text-gray-400 text-right">{editForm.nome.length}/80</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Categoria</label>
                                        <select
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                                            value={editForm.tipo}
                                            onChange={(e) => setEditForm((f) => ({ ...f, tipo: e.target.value }))}
                                        >
                                            <option value="Ataque">Ataque</option>
                                            <option value="Defesa">Defesa</option>
                                            <option value="Transição">Transição</option>
                                            <option value="Bola Parada">Bola Parada</option>
                                            <option value="Personalizada">Personalizada</option>
                                        </select>
                                    </div>
                                    <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-3 aspect-video flex items-center justify-center">
                                        <TacticalDiagram tipo={editForm.tipo} large />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={saving || editForm.nome.trim().length < 2}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl py-2.5 font-bold shadow transition-all"
                                        >
                                            {saving ? "A guardar..." : "💾 Guardar"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setConfirmRemover(modal.jogada); setModal(null); }}
                                            className="px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl py-2.5 font-bold transition-all"
                                        >
                                            🗑️
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setModal(null)}
                                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl py-2.5 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── CABEÇALHO ── */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-3">
                        <span>📚</span> Biblioteca Tática
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {jogadas.length} jogadas guardadas
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm shadow hover:bg-purple-700 transition-all flex items-center gap-2"
                    onClick={() => router.push("/dashboard/treinador/quadro-tatico")}
                >
                    <span className="text-base">＋</span> Nova Jogada
                </button>
            </div>

            {/* ── FILTROS / PESQUISA ── */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Pesquisar jogadas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[180px] px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow"
                />
                {CATEGORIAS.map((cat) => (
                    <button
                        key={cat}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all shadow-sm ${filter === cat ? "bg-purple-600 text-white border-purple-600" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* ── GRELHA ── */}
            {loading ? (
                <div className="flex justify-center py-20 text-gray-400 text-sm">A carregar...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtradas.map((j) => (
                        <div
                            key={j.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 overflow-hidden w-full h-44">
                                <TacticalDiagram tipo={j.tipo} />
                            </div>
                            <div>
                                <p className="font-bold text-base text-gray-900 dark:text-white leading-tight">{j.nome}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${catColors[j.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                                        {j.tipo}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        Sistema {j.sistema} · {formatData(j.created_at)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <button
                                    className="flex-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg py-2 font-bold border border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm flex items-center justify-center gap-1"
                                    onClick={() => setModal({ type: "view", jogada: j })}
                                >
                                    <span>👁️</span> Ver
                                </button>
                                <button
                                    className="flex-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg py-2 font-bold border border-blue-200 dark:border-blue-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm flex items-center justify-center gap-1"
                                    onClick={() => abrirEditar(j)}
                                >
                                    <span>✏️</span> Editar
                                </button>
                                <button
                                    className="flex-1 bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 rounded-lg py-2 font-bold border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm flex items-center justify-center gap-1"
                                    onClick={() => setConfirmRemover(j)}
                                >
                                    <span>🗑️</span> Remover
                                </button>
                            </div>
                        </div>
                    ))}

                    {filtradas.length === 0 && (
                        <div className="col-span-3 flex flex-col items-center py-16 text-gray-400 gap-2">
                            <span className="text-5xl">📭</span>
                            <p className="text-base font-medium">
                                {jogadas.length === 0
                                    ? "Nenhuma jogada guardada. Cria uma no Quadro Tático."
                                    : "Nenhuma jogada encontrada"}
                            </p>
                            {jogadas.length === 0 && (
                                <button
                                    onClick={() => router.push("/dashboard/treinador/quadro-tatico")}
                                    className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all"
                                >
                                    Ir para o Quadro Tático
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
