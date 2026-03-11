"use client";
import React from "react";

const exercisesData = [
    {
        name: "Remate em Suspensão",
        description:
            "Exercício de remate após salto, focando técnica e precisão.",
        category: "Técnico",
        duration: "12min",
        icon: "🤾‍♂️",
        level: "Médio",
    },
    {
        name: "Passe em Movimento",
        description:
            "Sequência de passes rápidos entre jogadores em deslocação.",
        category: "Técnico",
        duration: "10min",
        icon: "🔄",
        level: "Fácil",
    },
    {
        name: "Defesa 6x0",
        description: "Organização defensiva em linha, com foco na comunicação.",
        category: "Tático",
        duration: "20min",
        icon: "🛡️",
        level: "Médio",
    },
    {
        name: "Contra-ataque Rápido",
        description: "Transição ofensiva após recuperação de bola.",
        category: "Misto",
        duration: "15min",
        icon: "🏃‍♂️",
        level: "Intenso",
    },
    {
        name: "Finta e Remate",
        description:
            "Exercício de finta individual seguida de remate à baliza.",
        category: "Técnico",
        duration: "10min",
        icon: "🎯",
        level: "Difícil",
    },
    {
        name: "Circuito de Resistência",
        description:
            "Estações de exercícios físicos para melhorar resistência.",
        category: "Físico",
        duration: "25min",
        icon: "💪",
        level: "Intenso",
    },
    {
        name: "Jogo Reduzido 4x4",
        description:
            "Jogo condicionado para trabalhar tática e tomada de decisão.",
        category: "Misto",
        duration: "18min",
        icon: "🤾‍♀️",
        level: "Médio",
    },
    {
        name: "Sprint Intervalado",
        description: "Sprints curtos com pausas para melhorar explosão.",
        category: "Físico",
        duration: "15min",
        icon: "⚡",
        level: "Intenso",
    },
];

export default function Exercises() {
    // Filtro de categoria
    const categories = [
        "Todos",
        ...Array.from(new Set(exercisesData.map((e) => e.category))),
    ];
    const [selectedCategory, setSelectedCategory] = React.useState("Todos");
    const [search, setSearch] = React.useState("");
    const filteredExercises = exercisesData.filter(
        (e) =>
            (selectedCategory === "Todos" || e.category === selectedCategory) &&
            (search === "" ||
                e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.description.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <div className="w-full px-4 py-6 bg-white">
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <span>🤾‍♂️</span> Exercícios de Andebol
                    </h2>
                    <p className="text-muted text-base text-gray-500">
                        Biblioteca pessoal + partilhada · {exercisesData.length}{" "}
                        exercícios
                    </p>
                </div>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 font-bold">
                    ＋ Criar Exercício
                </button>
            </div>
            <div className="mb-6 flex flex-col md:flex-row gap-2 items-center">
                <input
                    type="text"
                    placeholder="🔍 Pesquisar exercícios..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-purple-400"
                />
                <div className="flex gap-2 mt-2 md:mt-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`px-3 py-1 rounded-lg font-bold text-sm border ${selectedCategory === cat ? "bg-purple-500 text-white border-purple-500" : "bg-white text-purple-500 border-gray-300"}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((e, idx) => (
                    <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-xl shadow p-5 flex flex-col justify-between min-h-[140px]"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{e.icon}</span>
                            <span className="text-lg font-bold text-gray-900">
                                {e.name}
                            </span>
                            <span
                                className={`ml-auto px-2 py-1 rounded text-xs font-bold ${e.category === "Técnico" ? "bg-blue-100 text-blue-700" : e.category === "Tático" ? "bg-purple-100 text-purple-700" : e.category === "Físico" ? "bg-yellow-100 text-yellow-700" : e.category === "Misto" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                            >
                                {e.category}
                            </span>
                        </div>
                        <div className="text-gray-700 text-sm mb-2">
                            {e.description}
                        </div>
                        <div className="flex items-center gap-4 mt-auto">
                            <span className="text-gray-500 text-xs">
                                ⏱ {e.duration}
                            </span>
                            <span
                                className={`ml-auto px-2 py-1 rounded text-xs font-bold ${e.level === "Fácil" ? "bg-blue-200 text-blue-800" : e.level === "Médio" ? "bg-green-200 text-green-800" : e.level === "Intenso" ? "bg-yellow-200 text-yellow-800" : e.level === "Difícil" ? "bg-red-200 text-red-800" : "bg-gray-200 text-gray-800"}`}
                            >
                                {e.level}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
