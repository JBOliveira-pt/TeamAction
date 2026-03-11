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
    const [selectedPlay, setSelectedPlay] = useState(0);
    const [system, setSystem] = useState(0);
    const [players, setPlayers] = useState(initialPlayers);
    const [dragged, setDragged] = useState(null);

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
        const newPlay = {
            name: `Nova Jogada ${savedPlays.length + 1}`,
            type: "Personalizada",
        };
        setSavedPlays([...savedPlays, newPlay]);
        setSelectedPlay(savedPlays.length);
        alert("Nova jogada criada!");
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
    function handleEditPlay(index) {
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
    function handleRemovePlay(index) {
        if (window.confirm("Remover jogada?")) {
            const updated = savedPlays.filter((_, i) => i !== index);
            setSavedPlays(updated);
            setSelectedPlay(updated.length ? 0 : null);
        }
    }

    return (
        <div className="w-full px-6 py-8 bg-white flex flex-col lg:flex-row gap-8 min-h-screen">
            <div className="flex-1 flex flex-col items-center">
                <div className="mb-6 w-full max-w-3xl">
                    <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2 mb-1">
                        <span>📋</span> Quadro Tático
                    </h2>
                    <div className="text-gray-500 text-sm">
                        Editor de jogadas · Seniores Masculinos
                    </div>
                </div>
                <div className="flex gap-2 mb-6 w-full max-w-3xl justify-center">
                    {systems.map((s, i) => (
                        <button
                            key={s}
                            className={`px-4 py-1 rounded-lg font-bold text-sm border transition-all duration-150 ${system === i ? "bg-purple-500 text-white border-purple-500" : "bg-white text-purple-500 border-gray-300 hover:bg-gray-100"}`}
                            onClick={() => setSystem(i)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div
                    className="relative mb-6 rounded-xl border border-green-200 bg-green-50 flex items-center justify-center overflow-hidden w-full max-w-3xl"
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
                            className={`absolute w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold shadow-lg select-none cursor-move ${p.color === "blue" ? "bg-blue-500 border-white text-white" : "bg-red-500 border-white text-white"}`}
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
                <div className="flex gap-2 mb-6 w-full max-w-3xl">
                    <button
                        className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 font-bold border border-gray-200 flex items-center justify-center gap-2"
                        onClick={handleCapture}
                    >
                        <span role="img" aria-label="camera">
                            📸
                        </span>{" "}
                        Captura
                    </button>
                    <button
                        className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 font-bold border border-gray-200 flex items-center justify-center gap-2"
                        onClick={handleAnimation}
                    >
                        <span role="img" aria-label="animation">
                            🎞️
                        </span>{" "}
                        Animação
                    </button>
                    <button
                        className="flex-1 bg-purple-500 text-white rounded-lg py-2 font-bold border border-purple-500 flex items-center justify-center gap-2"
                        onClick={handleShare}
                    >
                        <span role="img" aria-label="share">
                            🧑‍🤝‍🧑
                        </span>{" "}
                        Partilhar
                    </button>
                </div>
            </div>
            {/* Painel lateral direito */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="flex gap-2">
                    <button
                        className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-2 font-bold border border-gray-300"
                        onClick={handleSave}
                    >
                        Guardar
                    </button>
                    <button
                        className="flex-1 bg-purple-500 text-white rounded-lg py-2 font-bold border border-purple-500"
                        onClick={handleNewPlay}
                    >
                        ＋ Nova Jogada
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 font-bold border border-gray-200"
                        onClick={handleUndo}
                    >
                        ↩️ Desfazer
                    </button>
                    <button
                        className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 font-bold border border-gray-200"
                        onClick={handleClear}
                    >
                        🧹 Limpar
                    </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1">
                    <div className="font-bold text-gray-700 mb-2">
                        Jogadas Guardadas
                    </div>
                    <div className="flex flex-col gap-2">
                        {savedPlays.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <button
                                    className={`flex-1 text-left px-3 py-2 rounded-lg border transition-all duration-150 ${selectedPlay === i ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 bg-gray-50 text-gray-700"}`}
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
                                    className="text-xs text-blue-500 px-2"
                                    title="Editar"
                                    onClick={() => handleEditPlay(i)}
                                >
                                    ✏️
                                </button>
                                <button
                                    className="text-xs text-red-500 px-2"
                                    title="Remover"
                                    onClick={() => handleRemovePlay(i)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                        <button
                            className="w-full text-xs text-purple-500 mt-2"
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
