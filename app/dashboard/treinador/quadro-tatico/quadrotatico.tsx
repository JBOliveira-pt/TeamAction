"use client";
import React, { useState } from "react";

const systems = ["6-0", "5-1", "3-2-1", "4-2", "3-3"];
const initialSavedPlays = [
    { name: "Ataque Posicional A1", type: "Ataque" },
    { name: "Contra-ataque Rápido", type: "Transição" },
    { name: "Defesa 5-1", type: "Defesa" },
    { name: "Canto Ofensivo", type: "Bola Parada" },
    { name: "Falta 7m", type: "Bola Parada" },
];
const initialPlayers = [
    { id: "7", color: "blue", x: 22, y: 45 },
    { id: "9", color: "blue", x: 35, y: 30 },
    { id: "11", color: "blue", x: 35, y: 60 },
    { id: "5", color: "blue", x: 50, y: 45 },
    { id: "3", color: "blue", x: 65, y: 35 },
    { id: "14", color: "blue", x: 65, y: 65 },
    { id: "BR", color: "blue", x: 10, y: 50 },
    { id: "A1", color: "red", x: 78, y: 45 },
    { id: "A2", color: "red", x: 65, y: 30 },
    { id: "A3", color: "red", x: 65, y: 60 },
    { id: "A4", color: "red", x: 50, y: 45 },
    { id: "A5", color: "red", x: 35, y: 35 },
    { id: "A6", color: "red", x: 35, y: 65 },
    { id: "GR", color: "red", x: 90, y: 50 },
];

export default function TacticalBoard() {
    const [savedPlays, setSavedPlays] = useState(initialSavedPlays);
    const [selectedPlay, setSelectedPlay] = useState<number | null>(0);
    const [system, setSystem] = useState(0);
    const [players, setPlayers] = useState(initialPlayers);
    const [dragged, setDragged] = useState<number | null>(null);
    const [showNewPlayModal, setShowNewPlayModal] = useState(false);
    const [newPlayName, setNewPlayName] = useState("");
    const [newPlayType, setNewPlayType] = useState("Personalizada");

    // Funcionalidades dos botões
    function handleSave() {
        if (selectedPlay !== null && savedPlays[selectedPlay]) {
            const updated = [...savedPlays];
            updated[selectedPlay] = {
                ...updated[selectedPlay],
                name: updated[selectedPlay].name + " (Guardada)",
            };
            setSavedPlays(updated);
            alert("Jogada guardada!");
        } else {
            alert("Selecione uma jogada para guardar.");
        }
    }
    function handleNewPlay() {
        setShowNewPlayModal(true);
    }
    function handleCreatePlay() {
        if (!newPlayName.trim()) return;
        const newPlay = {
            name: newPlayName.trim(),
            type: newPlayType,
        };
        setSavedPlays([...savedPlays, newPlay]);
        setSelectedPlay(savedPlays.length);
        setShowNewPlayModal(false);
        setNewPlayName("");
        setNewPlayType("Personalizada");
    }
    function handleUndo() {
        if (savedPlays.length > 0) {
            const updated = savedPlays.slice(0, -1);
            setSavedPlays(updated);
            setSelectedPlay(Math.max(0, updated.length - 1));
            alert("Última jogada removida!");
        } else {
            alert("Não há jogadas para desfazer.");
        }
    }
    function handleClear() {
        setSavedPlays([]);
        setSelectedPlay(null);
        alert("Todas as jogadas removidas!");
    }
    function handleCapture() {
        alert("Captura efetuada! (Simulação)");
    }
    function handleAnimation() {
        alert("Animação iniciada! (Simulação)");
    }
    function handleShare() {
        alert("Jogada partilhada! (Simulação)");
    }
    function handleViewAll() {
        alert("Todas as jogadas:\n" + savedPlays.map((p) => p.name).join("\n"));
    }
    function handleEditPlay(index: number) {
        const newName = prompt(
            "Editar nome da jogada:",
            savedPlays[index].name,
        );
        if (newName) {
            const updated = [...savedPlays];
            updated[index].name = newName;
            setSavedPlays(updated);
        }
    }
    function handleRemovePlay(index: number) {
        if (window.confirm("Remover jogada?")) {
            const updated = savedPlays.filter((_, i) => i !== index);
            setSavedPlays(updated);
            setSelectedPlay(updated.length ? 0 : null);
        }
    }

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col lg:flex-row gap-8">
            {/* Modal Nova Jogada */}
            {showNewPlayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs border-2 border-purple-200 flex flex-col gap-4 animate-fade-in">
                        <div className="text-lg font-bold text-purple-700 flex items-center gap-2 mb-2">
                            <span>✨</span> Nova Jogada
                        </div>
                        <input
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Nome da jogada"
                            value={newPlayName}
                            onChange={(e) => setNewPlayName(e.target.value)}
                            autoFocus
                        />
                        <select
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            value={newPlayType}
                            onChange={(e) => setNewPlayType(e.target.value)}
                        >
                            <option value="Personalizada">Personalizada</option>
                            <option value="Ataque">Ataque</option>
                            <option value="Defesa">Defesa</option>
                            <option value="Transição">Transição</option>
                            <option value="Bola Parada">Bola Parada</option>
                        </select>
                        <div className="flex gap-2 mt-2">
                            <button
                                className="flex-1 bg-purple-500 text-white rounded-lg py-2 font-bold border border-purple-500 hover:bg-purple-600 transition"
                                onClick={handleCreatePlay}
                                disabled={!newPlayName.trim()}
                            >
                                Guardar
                            </button>
                            <button
                                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 font-bold border border-gray-200 hover:bg-gray-200 transition"
                                onClick={() => setShowNewPlayModal(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex-1 flex flex-col">
                <div className="mb-6 w-full">
                    <h2 className="text-3xl font-extrabold text-purple-800 flex items-center gap-3 mb-1 drop-shadow-sm">
                        <span className="text-2xl">📋</span> Quadro Tático
                    </h2>
                    <div className="text-green-700 text-sm font-semibold tracking-wide">
                        Editor de jogadas · Seniores Masculinos
                    </div>
                </div>
                <div className="flex gap-3 mb-6 w-full justify-center">
                    {systems.map((s, i) => (
                        <button
                            key={s}
                            className={`px-5 py-2 rounded-xl font-bold text-base border-2 transition-all duration-150 shadow-md flex items-center gap-2 tracking-wide ${system === i ? "bg-purple-600 text-white border-purple-600 scale-105" : "bg-white text-purple-700 border-gray-300 hover:bg-purple-50"}`}
                            onClick={() => setSystem(i)}
                            title={`Selecionar sistema ${s}`}
                        >
                            <span className="text-lg">🧩</span> {s}
                        </button>
                    ))}
                </div>
                <div
                    className="relative mb-6 rounded-2xl border-2 border-green-200 bg-green-50 flex items-center justify-center overflow-hidden w-full shadow-lg"
                    style={{ height: 400 }}
                    onMouseMove={(e) => {
                        if (dragged !== null) {
                            const rect =
                                e.currentTarget.getBoundingClientRect();
                            const x =
                                ((e.clientX - rect.left) / rect.width) * 100;
                            const y =
                                ((e.clientY - rect.top) / rect.height) * 100;
                            setPlayers((players) =>
                                players.map((p, idx) =>
                                    idx === dragged ? { ...p, x, y } : p,
                                ),
                            );
                        }
                    }}
                    onMouseUp={() => setDragged(null)}
                >
                    {/* Campo */}
                    <svg
                        viewBox="0 0 400 220"
                        className="absolute inset-0 w-full h-full"
                    >
                        <rect
                            x="10"
                            y="10"
                            width="380"
                            height="200"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                        />
                        <line
                            x1="200"
                            y1="10"
                            x2="200"
                            y2="210"
                            stroke="#22c55e"
                            strokeWidth="1.5"
                        />
                        <rect
                            x="10"
                            y="75"
                            width="50"
                            height="70"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="1.5"
                        />
                        <rect
                            x="340"
                            y="75"
                            width="50"
                            height="70"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="1.5"
                        />
                        <circle
                            cx="200"
                            cy="110"
                            r="30"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="1.5"
                        />
                    </svg>
                    {/* Jogadores arrastáveis */}
                    {players.map((p, idx) => (
                        <div
                            key={p.id}
                            className={`absolute w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold shadow-lg select-none cursor-move text-base transition-all duration-150 ${p.color === "blue" ? "bg-blue-500 border-white text-white" : "bg-red-500 border-white text-white"}`}
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            onMouseDown={() => setDragged(idx)}
                        >
                            {p.id}
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mb-6 w-full">
                    <button
                        className="flex-1 bg-white text-purple-700 rounded-xl py-3 font-bold border-2 border-purple-200 shadow-md flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-400 transition-all text-base"
                        onClick={handleCapture}
                    >
                        <span className="text-xl">📸</span> Captura
                    </button>
                    <button
                        className="flex-1 bg-white text-purple-700 rounded-xl py-3 font-bold border-2 border-purple-200 shadow-md flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-400 transition-all text-base"
                        onClick={handleAnimation}
                    >
                        <span className="text-xl">🎞️</span> Animação
                    </button>
                    <button
                        className="flex-1 bg-purple-600 text-white rounded-xl py-3 font-bold border-2 border-purple-600 shadow-md flex items-center justify-center gap-2 hover:bg-purple-700 transition-all text-base"
                        onClick={handleShare}
                    >
                        <span className="text-xl">🧑‍🤝‍🧑</span> Partilhar
                    </button>
                </div>
            </div>
            {/* Painel lateral direito */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="flex gap-3 mb-2">
                    <button
                        className="flex-1 bg-purple-600 text-white rounded-xl py-3 font-bold border-2 border-purple-600 shadow-md flex items-center justify-center gap-2 hover:bg-purple-700 transition-all text-base"
                        onClick={handleSave}
                    >
                        <span className="text-xl">💾</span> Guardar
                    </button>
                    <button
                        className="flex-1 bg-purple-600 text-white rounded-xl py-3 font-bold border-2 border-purple-600 shadow-md flex items-center justify-center gap-2 hover:bg-purple-700 transition-all text-base"
                        onClick={handleNewPlay}
                    >
                        <span className="text-xl">＋</span> Nova Jogada
                    </button>
                </div>
                <div className="flex gap-3 mb-2">
                    <button
                        className="flex-1 bg-white text-purple-700 rounded-xl py-3 font-bold border-2 border-purple-200 shadow-md flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-400 transition-all text-base"
                        onClick={handleUndo}
                    >
                        <span className="text-xl">↩️</span> Desfazer
                    </button>
                    <button
                        className="flex-1 bg-white text-purple-700 rounded-xl py-3 font-bold border-2 border-purple-200 shadow-md flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-400 transition-all text-base"
                        onClick={handleClear}
                    >
                        <span className="text-xl">🧹</span> Limpar
                    </button>
                </div>
                <div className="bg-white border-2 border-purple-100 rounded-2xl p-4 flex-1 shadow-md">
                    <div className="font-bold text-purple-700 mb-2 text-lg flex items-center gap-2">
                        <span>📑</span> Jogadas Guardadas
                    </div>
                    <div className="flex flex-col gap-2">
                        {savedPlays.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <button
                                    className={`flex-1 text-left px-3 py-2 rounded-lg border transition-all duration-150 shadow-sm ${selectedPlay === i ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-purple-50"}`}
                                    onClick={() => setSelectedPlay(i)}
                                >
                                    <div className="font-bold text-sm">
                                        {p.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {p.type}
                                    </div>
                                </button>
                                <button
                                    className="text-xs text-blue-500 px-2 hover:text-blue-700"
                                    title="Editar"
                                    onClick={() => handleEditPlay(i)}
                                >
                                    ✏️
                                </button>
                                <button
                                    className="text-xs text-red-500 px-2 hover:text-red-700"
                                    title="Remover"
                                    onClick={() => handleRemovePlay(i)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                        <button
                            className="w-full text-xs text-purple-500 mt-2 hover:underline"
                            onClick={handleViewAll}
                        >
                            Ver todas →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
