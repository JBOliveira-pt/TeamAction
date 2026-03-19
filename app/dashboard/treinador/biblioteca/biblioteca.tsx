"use client";
import React, { useState } from "react";

interface TacticDoc {
    title: string;
    category: string;
    views: number;
    added: string;
    mine: boolean;
}

const initialBibliotecaData: TacticDoc[] = [
    {
        title: "Ataque Posicional A1",
        category: "Ataque",
        views: 34,
        added: "3 Mar",
        mine: true,
    },
    {
        title: "Defesa 5-1 Agressiva",
        category: "Defesa",
        views: 28,
        added: "1 Mar",
        mine: true,
    },
    {
        title: "Contraataque 3x2",
        category: "Transição",
        views: 19,
        added: "25 Fev",
        mine: false,
    },
    {
        title: "Jogo de Pivot",
        category: "Ataque",
        views: 41,
        added: "20 Fev",
        mine: true,
    },
    {
        title: "Bloco Baixo 6-0",
        category: "Defesa",
        views: 15,
        added: "20 Fev",
        mine: false,
    },
    {
        title: "Falta 7m Variante B",
        category: "Bola Parada",
        views: 22,
        added: "10 Fev",
        mine: true,
    },
    {
        title: "Press Defesa 4-2",
        category: "Defesa",
        views: 30,
        added: "5 Fev",
        mine: false,
    },
    {
        title: "Pivot + Ala Combinação",
        category: "Ataque",
        views: 27,
        added: "5 Fev",
        mine: true,
    },
    {
        title: "Saída Guarda-Redes",
        category: "Transição",
        views: 11,
        added: "28 Jan",
        mine: false,
    },
];

const categories = [
    "Todas",
    "Ataque",
    "Defesa",
    "Transição",
    "Bola Parada",
    "As Minhas",
];

const catColors: Record<string, string> = {
    Ataque: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Defesa: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Transição:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "Bola Parada":
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

/* ────────────────────────────────────────────────────────────────
   SVG Diagrams por categoria
──────────────────────────────────────────────────────────────── */

function PlayerDot({ x, y, c, r }: { x: number; y: number; c: string; r: number }) {
    return <circle cx={x} cy={y} r={r} fill={c} stroke="white" strokeWidth={1.4} />;
}

function TacticalDiagram({
    category,
    large = false,
}: {
    category: string;
    large?: boolean;
}) {
    const r = large ? 5.5 : 4.5;

    return (
        <svg viewBox="0 0 120 70" className="w-full h-full">
            {/* ── Campo ── */}
            <rect
                x="2"
                y="2"
                width="116"
                height="66"
                rx="2"
                fill="#f0fdf4"
                stroke="#22c55e"
                strokeWidth="1.5"
            />
            <line
                x1="60"
                y1="2"
                x2="60"
                y2="68"
                stroke="#22c55e"
                strokeWidth="0.7"
                opacity="0.4"
            />
            <circle
                cx="60"
                cy="35"
                r="10"
                fill="none"
                stroke="#22c55e"
                strokeWidth="0.7"
                opacity="0.4"
            />
            <rect
                x="2"
                y="25"
                width="11"
                height="20"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1"
            />
            <rect
                x="107"
                y="25"
                width="11"
                height="20"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1"
            />

            {category === "Ataque" && (
                <>
                    {/* GK */}
                    <PlayerDot x={9} y={35} c="#1d4ed8" r={r} />
                    {/* Backs */}
                    <PlayerDot x={50} y={22} c="#3b82f6" r={r} />
                    <PlayerDot x={46} y={35} c="#3b82f6" r={r} />
                    <PlayerDot x={50} y={48} c="#3b82f6" r={r} />
                    {/* Wings */}
                    <PlayerDot x={70} y={11} c="#3b82f6" r={r} />
                    <PlayerDot x={70} y={59} c="#3b82f6" r={r} />
                    {/* Pivot */}
                    <PlayerDot x={81} y={35} c="#3b82f6" r={r} />
                    {/* Attack lines */}
                    <line
                        x1="54"
                        y1="24"
                        x2="73"
                        y2="29"
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                        opacity="0.85"
                    />
                    <line
                        x1="50"
                        y1="35"
                        x2="74"
                        y2="35"
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                        opacity="0.85"
                    />
                    <line
                        x1="54"
                        y1="46"
                        x2="73"
                        y2="41"
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                        opacity="0.85"
                    />
                </>
            )}

            {category === "Defesa" && (
                <>
                    {/* GK */}
                    <PlayerDot x={9} y={35} c="#1d4ed8" r={r} />
                    {/* 6-0 defensive line */}
                    <PlayerDot x={22} y={24} c="#3b82f6" r={r} />
                    <PlayerDot x={30} y={19} c="#3b82f6" r={r} />
                    <PlayerDot x={40} y={17} c="#3b82f6" r={r} />
                    <PlayerDot x={50} y={19} c="#3b82f6" r={r} />
                    <PlayerDot x={58} y={24} c="#3b82f6" r={r} />
                    <PlayerDot x={40} y={32} c="#3b82f6" r={r} />
                    {/* Opponent attackers */}
                    <PlayerDot x={72} y={20} c="#ef4444" r={r} />
                    <PlayerDot x={76} y={35} c="#ef4444" r={r} />
                    <PlayerDot x={72} y={50} c="#ef4444" r={r} />
                </>
            )}

            {category === "Transição" && (
                <>
                    {/* GK */}
                    <PlayerDot x={9} y={35} c="#1d4ed8" r={r} />
                    {/* Ball carrier */}
                    <PlayerDot x={30} y={35} c="#3b82f6" r={r} />
                    {/* Runners ahead */}
                    <PlayerDot x={65} y={18} c="#3b82f6" r={r} />
                    <PlayerDot x={68} y={35} c="#3b82f6" r={r} />
                    <PlayerDot x={65} y={52} c="#3b82f6" r={r} />
                    {/* Opponents trailing */}
                    <PlayerDot x={48} y={27} c="#ef4444" r={r} />
                    <PlayerDot x={48} y={43} c="#ef4444" r={r} />
                    {/* Counter-attack main arrow */}
                    <line
                        x1="34"
                        y1="35"
                        x2="62"
                        y2="35"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        opacity="0.85"
                    />
                    {/* Pass lines */}
                    <line
                        x1="34"
                        y1="33"
                        x2="62"
                        y2="21"
                        stroke="#93c5fd"
                        strokeWidth="1.2"
                        strokeDasharray="3,2"
                        opacity="0.8"
                    />
                    <line
                        x1="34"
                        y1="37"
                        x2="62"
                        y2="49"
                        stroke="#93c5fd"
                        strokeWidth="1.2"
                        strokeDasharray="3,2"
                        opacity="0.8"
                    />
                </>
            )}

            {category === "Bola Parada" && (
                <>
                    {/* Opponent GK */}
                    <PlayerDot x={111} y={35} c="#ef4444" r={r} />
                    {/* Opponent wall */}
                    <PlayerDot x={98} y={26} c="#ef4444" r={r} />
                    <PlayerDot x={98} y={34} c="#ef4444" r={r} />
                    <PlayerDot x={98} y={42} c="#ef4444" r={r} />
                    {/* Our players */}
                    <PlayerDot x={87} y={52} c="#3b82f6" r={r} />
                    <PlayerDot x={75} y={22} c="#3b82f6" r={r} />
                    <PlayerDot x={76} y={35} c="#3b82f6" r={r} />
                    {/* Shot trajectory */}
                    <path
                        d="M87,49 Q96,38 109,33"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                        strokeDasharray="3,2"
                        opacity="0.9"
                    />
                </>
            )}

            {!["Ataque", "Defesa", "Transição", "Bola Parada"].includes(
                category,
            ) && (
                <>
                    {[22, 38, 60, 82, 98].map((cx, i) => (
                        <circle
                            key={i}
                            cx={cx}
                            cy={35}
                            r={r}
                            fill="#6366f1"
                            stroke="white"
                            strokeWidth={1.4}
                        />
                    ))}
                </>
            )}
        </svg>
    );
}

/* ────────────────────────────────────────────────────────────────
   Componente principal
──────────────────────────────────────────────────────────────── */

export default function Biblioteca() {
    const [biblioteca, setBiblioteca] = useState<TacticDoc[]>(
        initialBibliotecaData,
    );
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Todas");

    // Modal: null | { type: "view" | "edit", idx: number (index in biblioteca) }
    const [modal, setModal] = useState<{
        type: "view" | "edit";
        idx: number;
    } | null>(null);
    const [editForm, setEditForm] = useState({ title: "", category: "Ataque" });

    // Nova jogada modal
    const [showNewModal, setShowNewModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("Ataque");

    /* ── Filtro ── */
    const filteredWithIdx = biblioteca
        .map((doc, idx) => ({ ...doc, _idx: idx }))
        .filter((doc) => {
            const matchesSearch = doc.title
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesCategory =
                filter === "Todas" ||
                (filter === "As Minhas" ? doc.mine : doc.category === filter);
            return matchesSearch && matchesCategory;
        });

    /* ── Handlers ── */
    const openView = (idx: number) => setModal({ type: "view", idx });

    const openEdit = (idx: number) => {
        setEditForm({
            title: biblioteca[idx].title,
            category: biblioteca[idx].category,
        });
        setModal({ type: "edit", idx });
    };

    const saveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modal) return;
        setBiblioteca((prev) =>
            prev.map((doc, i) =>
                i === modal.idx
                    ? {
                          ...doc,
                          title: editForm.title,
                          category: editForm.category,
                      }
                    : doc,
            ),
        );
        setModal(null);
    };

    const handleRemove = (idx: number) => {
        if (window.confirm("Remover jogada?")) {
            setBiblioteca((prev) => prev.filter((_, i) => i !== idx));
            setModal(null);
        }
    };

    const handleCreateDoc = () => {
        if (!newTitle.trim()) return;
        setBiblioteca((prev) => [
            ...prev,
            {
                title: newTitle.trim(),
                category: newCategory,
                views: 0,
                added: "Hoje",
                mine: true,
            },
        ]);
        setShowNewModal(false);
        setNewTitle("");
        setNewCategory("Ataque");
    };

    const modalDoc = modal !== null ? biblioteca[modal.idx] : null;

    /* ────────────────────────────────────────────────────────────
       Render
    ──────────────────────────────────────────────────────────── */
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">
            {/* ── MODAL VER / EDITAR ── */}
            {modal && modalDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-blue-100 dark:border-blue-900 max-h-[90vh] overflow-y-auto">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={() => setModal(null)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>

                        {modal.type === "view" ? (
                            <>
                                <div className="flex flex-col items-center mb-6">
                                    <span className="text-purple-600 text-4xl mb-2">
                                        📋
                                    </span>
                                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white text-center">
                                        {modalDoc.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {modalDoc.views} visualizações ·
                                        Adicionado {modalDoc.added}
                                    </p>
                                </div>

                                <div className="flex justify-center mb-5">
                                    <span
                                        className={`font-bold px-3 py-1 rounded-lg text-sm ${catColors[modalDoc.category] ?? "bg-gray-100 text-gray-700"}`}
                                    >
                                        {modalDoc.category}
                                    </span>
                                    {modalDoc.mine && (
                                        <span className="ml-2 font-bold px-3 py-1 rounded-lg text-sm bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                                            ★ Minha
                                        </span>
                                    )}
                                </div>

                                {/* Diagrama grande */}
                                <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-3 mb-6 aspect-video flex items-center justify-center">
                                    <TacticalDiagram
                                        category={modalDoc.category}
                                        large
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEdit(modal.idx)}
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
                                    <span className="text-purple-600 text-4xl mb-2">
                                        ✏️
                                    </span>
                                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                        Editar Jogada
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Altera o nome ou categoria da jogada
                                    </p>
                                </div>

                                <form
                                    onSubmit={saveEdit}
                                    className="flex flex-col gap-6"
                                >
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Título
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-400 transition-all"
                                            value={editForm.title}
                                            onChange={(e) =>
                                                setEditForm((f) => ({
                                                    ...f,
                                                    title: e.target.value,
                                                }))
                                            }
                                            placeholder="Nome da jogada"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Categoria
                                        </label>
                                        <select
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-400 transition-all"
                                            value={editForm.category}
                                            onChange={(e) =>
                                                setEditForm((f) => ({
                                                    ...f,
                                                    category: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="Ataque">
                                                Ataque
                                            </option>
                                            <option value="Defesa">
                                                Defesa
                                            </option>
                                            <option value="Transição">
                                                Transição
                                            </option>
                                            <option value="Bola Parada">
                                                Bola Parada
                                            </option>
                                        </select>
                                    </div>

                                    {/* Pré-visualização da nova categoria */}
                                    <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-3 aspect-video flex items-center justify-center">
                                        <TacticalDiagram
                                            category={editForm.category}
                                            large
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-bold text-base shadow transition-all"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span>💾</span> Guardar
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setModal(null)}
                                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl py-3 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
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

            {/* ── MODAL NOVA JOGADA ── */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-blue-100 dark:border-blue-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={() => setShowNewModal(false)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-purple-600 text-4xl mb-2">
                                ✨
                            </span>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                Nova Jogada
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Adiciona uma nova jogada à biblioteca
                            </p>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-400 transition-all"
                                    placeholder="Nome da jogada"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Categoria
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-400 transition-all"
                                    value={newCategory}
                                    onChange={(e) =>
                                        setNewCategory(e.target.value)
                                    }
                                >
                                    <option value="Ataque">Ataque</option>
                                    <option value="Defesa">Defesa</option>
                                    <option value="Transição">Transição</option>
                                    <option value="Bola Parada">
                                        Bola Parada
                                    </option>
                                </select>
                            </div>
                            <button
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-bold text-lg shadow transition-all disabled:opacity-50"
                                onClick={handleCreateDoc}
                                disabled={!newTitle.trim()}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>＋</span> Criar Jogada
                                </span>
                            </button>
                        </div>
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
                        {biblioteca.length} jogadas ·{" "}
                        {biblioteca.filter((d) => d.mine).length} criadas por ti
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm shadow hover:bg-purple-700 transition-all flex items-center gap-2"
                    onClick={() => {
                        setShowNewModal(true);
                        setNewTitle("");
                        setNewCategory("Ataque");
                    }}
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
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all shadow-sm ${filter === cat ? "bg-purple-600 text-white border-purple-600" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat === "As Minhas" ? "★ Minhas" : cat}
                    </button>
                ))}
            </div>

            {/* ── GRELHA DE CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWithIdx.map((doc) => (
                    <div
                        key={doc._idx}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3 relative shadow-sm hover:shadow-md transition-all"
                    >
                        {doc.mine && (
                            <span className="absolute top-3 right-3 text-yellow-400 text-lg">
                                ★
                            </span>
                        )}

                        {/* Diagrama tático */}
                        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 overflow-hidden w-full h-44">
                            <TacticalDiagram category={doc.category} />
                        </div>

                        {/* Info */}
                        <div>
                            <p className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                                {doc.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded ${catColors[doc.category] ?? "bg-gray-100 text-gray-700"}`}
                                >
                                    {doc.category}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {doc.views} visualizações · {doc.added}
                                </span>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 mt-1">
                            <button
                                className="flex-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg py-2 font-bold border border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm flex items-center justify-center gap-1"
                                onClick={() => openView(doc._idx)}
                            >
                                <span>👁️</span> Ver
                            </button>
                            <button
                                className="flex-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg py-2 font-bold border border-blue-200 dark:border-blue-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm flex items-center justify-center gap-1"
                                onClick={() => openEdit(doc._idx)}
                            >
                                <span>✏️</span> Editar
                            </button>
                            <button
                                className="flex-1 bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 rounded-lg py-2 font-bold border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm flex items-center justify-center gap-1"
                                onClick={() => handleRemove(doc._idx)}
                            >
                                <span>🗑️</span> Remover
                            </button>
                        </div>
                    </div>
                ))}

                {filteredWithIdx.length === 0 && (
                    <div className="col-span-3 flex flex-col items-center py-16 text-gray-400 gap-2">
                        <span className="text-5xl">📭</span>
                        <p className="text-base font-medium">
                            Nenhuma jogada encontrada
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
