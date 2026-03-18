"use client";
import React, { useState } from "react";

const incialbibliotecaData = [
    {
        title: "Ataque Posicional A1",
        category: "Ataque",
        views: 34,
        added: "3 Mar",
        mine: true,
        badge: "bg-blue-600",
    },
    {
        title: "Defesa 5-1 Agressiva",
        category: "Defesa",
        views: 28,
        added: "1 Mar",
        mine: true,
        badge: "bg-red-600",
    },
    {
        title: "Contraataque 3x2",
        category: "Transição",
        views: 19,
        added: "25 Fev",
        mine: false,
        badge: "bg-yellow-500",
    },
    {
        title: "Jogo de Pivot",
        category: "Ataque",
        views: 41,
        added: "20 Fev",
        mine: true,
        badge: "bg-blue-600",
    },
    {
        title: "Bloco Baixo 6-0",
        category: "Defesa",
        views: 15,
        added: "20 Fev",
        mine: false,
        badge: "bg-red-600",
    },
    {
        title: "Falta 7m Variante B",
        category: "Bola Parada",
        views: 22,
        added: "10 Fev",
        mine: true,
        badge: "bg-purple-600",
    },
    {
        title: "Press Defesa 4-2",
        category: "Defesa",
        views: 30,
        added: "5 Fev",
        mine: false,
        badge: "bg-red-600",
    },
    {
        title: "Pivot + Ala Combinação",
        category: "Ataque",
        views: 27,
        added: "5 Fev",
        mine: true,
        badge: "bg-blue-600",
    },
    {
        title: "Saída Guarda-Redes",
        category: "Transição",
        views: 11,
        added: "28 Jan",
        mine: false,
        badge: "bg-yellow-500",
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

export default function Biblioteca() {
    const [biblioteca, setBiblioteca] = useState(incialbibliotecaData);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Todas");
    const [modal, setModal] = useState<{ type: string; doc?: any } | null>(
        null,
    );
    const [showNewModal, setShowNewModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("Ataque");

    const filteredBiblioteca = biblioteca.filter((doc) => {
        const matchesSearch = doc.title
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesCategory =
            filter === "Todas" ||
            (filter === "As Minhas" ? doc.mine : doc.category === filter);
        return matchesSearch && matchesCategory;
    });

    function handleView(doc: (typeof incialbibliotecaData)[0]) {
        setModal({ type: "view", doc });
    }
    function handleEdit(doc: (typeof incialbibliotecaData)[0], idx: number) {
        const newTitle = prompt("Editar título da jogada:", doc.title);
        if (newTitle) {
            setBiblioteca((biblioteca) =>
                biblioteca.map((d, i) =>
                    i === idx ? { ...d, title: newTitle } : d,
                ),
            );
        }
    }
    function handleRemove(idx: number) {
        if (window.confirm("Remover jogada?")) {
            setBiblioteca((biblioteca) =>
                biblioteca.filter((_, i) => i !== idx),
            );
        }
    }
    function handleNewDoc() {
        setShowNewModal(true);
        setNewTitle("");
        setNewCategory("Ataque");
    }
    function handleCreateDoc() {
        if (!newTitle.trim()) return;
        const badge =
            newCategory === "Ataque"
                ? "bg-blue-600"
                : newCategory === "Defesa"
                  ? "bg-red-600"
                  : newCategory === "Transição"
                    ? "bg-yellow-500"
                    : newCategory === "Bola Parada"
                      ? "bg-purple-600"
                      : "bg-gray-400";
        const newDoc = {
            title: newTitle.trim(),
            category: newCategory,
            views: 0,
            added: "Hoje",
            mine: true,
            badge,
        };
        setBiblioteca([...biblioteca, newDoc]);
        setShowNewModal(false);
    }

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">
            {/* Modal Nova Jogada */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs border border-purple-200 flex flex-col gap-4 animate-fade-in">
                        <div className="text-base font-bold text-purple-700 flex items-center gap-2 mb-2">
                            <span>✨</span> Nova Jogada
                        </div>
                        <input
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Nome da jogada"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            autoFocus
                        />
                        <select
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        >
                            <option value="Ataque">Ataque</option>
                            <option value="Defesa">Defesa</option>
                            <option value="Transição">Transição</option>
                            <option value="Bola Parada">Bola Parada</option>
                        </select>
                        <div className="flex gap-2 mt-2">
                            <button
                                className="flex-1 bg-purple-600 text-white rounded-lg py-2 font-bold border border-purple-600 hover:bg-purple-700 transition text-sm"
                                onClick={handleCreateDoc}
                                disabled={!newTitle.trim()}
                            >
                                Guardar
                            </button>
                            <button
                                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 font-bold border border-gray-200 hover:bg-gray-200 transition text-sm"
                                onClick={() => setShowNewModal(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="w-full">
                <h2 className="text-3xl text-purple-800 flex items-center gap-3 mb-1 drop-shadow-sm w-full">
                    <span className="text-xl">📚</span> Biblioteca Tática
                </h2>
                <div className="text-green-700 text-xs font-semibold tracking-wide mb-6 w-full">
                    {biblioteca.length} jogadas ·{" "}
                    {biblioteca.filter((d) => d.mine).length} criadas por ti
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-6 w-full">
                <input
                    type="text"
                    placeholder="Pesquisar jogadas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm text-gray-900 placeholder:text-gray-400 shadow"
                />
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all duration-150 shadow-sm ${filter === cat ? "bg-purple-600 text-white border-purple-600 scale-105" : "bg-white text-purple-700 border-gray-300 hover:bg-purple-50"}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat === "As Minhas" ? <span>★</span> : cat}
                    </button>
                ))}
                <button
                    className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm border border-purple-600 shadow hover:bg-purple-700 transition-all"
                    onClick={handleNewDoc}
                >
                    <span className="text-base">＋</span> Nova Jogada
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {filteredBiblioteca.map((doc, idx) => (
                    <div
                        key={idx}
                        className="bg-white border border-purple-100 rounded-xl p-4 flex flex-col gap-2 relative shadow-md hover:shadow-lg transition-all"
                    >
                        <div className="absolute top-3 right-3">
                            {doc.mine && (
                                <span className="text-yellow-400 text-lg">
                                    ★
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-center mb-2">
                            {/* Tactical play preview placeholder */}
                            <svg viewBox="0 0 120 70" className="w-28 h-16">
                                <rect
                                    x="5"
                                    y="5"
                                    width="110"
                                    height="60"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="60"
                                    cy="35"
                                    r="18"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="1.5"
                                />
                                {[20, 40, 60, 80, 100].map((cx, i) => (
                                    <circle
                                        key={i}
                                        cx={cx}
                                        cy={35}
                                        r={5}
                                        fill="#00d4ff"
                                        stroke="#fff"
                                        strokeWidth="2"
                                    />
                                ))}
                            </svg>
                        </div>
                        <div className="font-bold text-base text-gray-900">
                            {doc.title}
                        </div>
                        <div className="text-xs">
                            <span
                                className={`font-bold px-2 py-1 rounded ${doc.category === "Ataque" ? "bg-blue-100 text-blue-700" : doc.category === "Defesa" ? "bg-red-100 text-red-700" : doc.category === "Transição" ? "bg-yellow-100 text-yellow-700" : doc.category === "Bola Parada" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                            >
                                {doc.category}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{doc.views} visualizações</span>
                            <span>·</span>
                            <span>{doc.added}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                className="flex-1 bg-white text-purple-700 rounded-lg py-2 font-bold border border-purple-200 hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm text-sm"
                                onClick={() => handleView(doc)}
                            >
                                <span className="text-sm">👁️</span> Ver
                            </button>
                            <button
                                className="flex-1 bg-white text-blue-700 rounded-lg py-2 font-bold border border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm text-sm"
                                onClick={() => handleEdit(doc, idx)}
                            >
                                <span className="text-sm">✏️</span> Editar
                            </button>
                            <button
                                className="flex-1 bg-white text-red-700 rounded-lg py-2 font-bold border border-red-200 hover:bg-red-50 hover:border-red-400 transition-all shadow-sm text-sm"
                                onClick={() => handleRemove(idx)}
                            >
                                <span className="text-sm">🗑️</span> Remover
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {modal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] max-w-[90vw] text-gray-900 border-2 border-purple-200">
                        <div className="font-bold text-lg mb-2">
                            {modal.type === "view"
                                ? "Visualizar Jogada"
                                : "Editar Jogada"}
                        </div>
                        <div className="mb-4">{modal.doc?.title}</div>
                        <button
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition"
                            onClick={() => setModal(null)}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
