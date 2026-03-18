"use client";
import React, { useState } from "react";

interface Exercise {
    name: string;
    description: string;
    category: string;
    duration: string;
    icon: string;
    level: string;
}

const initialExercises: Exercise[] = [
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
    const [editModal, setEditModal] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editExercise, setEditExercise] = useState<Exercise>({
        name: "",
        description: "",
        category: "Técnico",
        duration: "",
        icon: "🤾‍♂️",
        level: "Fácil",
    });
    const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
    const categories = [
        "Todos",
        ...Array.from(new Set(exercises.map((e) => e.category))),
    ];
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newExercise, setNewExercise] = useState<Exercise>({
        name: "",
        description: "",
        category: "Técnico",
        duration: "",
        icon: "🤾‍♂️",
        level: "Fácil",
    });
    const filteredExercises = exercises.filter(
        (e) =>
            (selectedCategory === "Todos" || e.category === selectedCategory) &&
            (search === "" ||
                e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.description.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            {/* Modal Editar Exercício */}
            {editModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-purple-100 dark:border-purple-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={() => setEditModal(false)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-purple-600 text-4xl mb-2">
                                ✏️
                            </span>
                            <h3 className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">
                                Editar Exercício
                            </h3>
                        </div>
                        <form
                            className="flex flex-col gap-4 text-base"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (editIndex !== null) {
                                    setExercises((prev) =>
                                        prev.map((ex, idx) =>
                                            idx === editIndex
                                                ? editExercise
                                                : ex,
                                        ),
                                    );
                                }
                                setEditModal(false);
                            }}
                        >
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Nome:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={editExercise.name}
                                    onChange={(e) =>
                                        setEditExercise((ev) => ({
                                            ...ev,
                                            name: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Descrição:
                                </label>
                                <textarea
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={editExercise.description}
                                    onChange={(e) =>
                                        setEditExercise((ev) => ({
                                            ...ev,
                                            description: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Categoria:
                                    </label>
                                    <select
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={editExercise.category}
                                        onChange={(e) =>
                                            setEditExercise((ev) => ({
                                                ...ev,
                                                category: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="Técnico">Técnico</option>
                                        <option value="Tático">Tático</option>
                                        <option value="Físico">Físico</option>
                                        <option value="Misto">Misto</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Duração:
                                    </label>
                                    <input
                                        type="text"
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={editExercise.duration}
                                        onChange={(e) =>
                                            setEditExercise((ev) => ({
                                                ...ev,
                                                duration: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Ícone:
                                    </label>
                                    <input
                                        type="text"
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={editExercise.icon}
                                        onChange={(e) =>
                                            setEditExercise((ev) => ({
                                                ...ev,
                                                icon: e.target.value,
                                            }))
                                        }
                                        maxLength={2}
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Nível:
                                    </label>
                                    <select
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={editExercise.level}
                                        onChange={(e) =>
                                            setEditExercise((ev) => ({
                                                ...ev,
                                                level: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="Fácil">Fácil</option>
                                        <option value="Médio">Médio</option>
                                        <option value="Intenso">Intenso</option>
                                        <option value="Difícil">Difícil</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-bold text-lg shadow transition-all mt-4"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>💾</span>
                                    Guardar Alterações
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Criar Exercício */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-purple-100 dark:border-purple-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={() => setShowModal(false)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-purple-600 text-4xl mb-2">
                                🏋️‍♂️
                            </span>
                            <h3 className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">
                                Criar Exercício
                            </h3>
                        </div>
                        <form
                            className="flex flex-col gap-4 text-base"
                            onSubmit={(e) => {
                                e.preventDefault();
                                setExercises((prev) => [...prev, newExercise]);
                                setShowModal(false);
                                setNewExercise({
                                    name: "",
                                    description: "",
                                    category: "Técnico",
                                    duration: "",
                                    icon: "🤾‍♂️",
                                    level: "Fácil",
                                });
                            }}
                        >
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Nome:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newExercise.name}
                                    onChange={(e) =>
                                        setNewExercise((ev) => ({
                                            ...ev,
                                            name: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Descrição:
                                </label>
                                <textarea
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newExercise.description}
                                    onChange={(e) =>
                                        setNewExercise((ev) => ({
                                            ...ev,
                                            description: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Categoria:
                                    </label>
                                    <select
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={newExercise.category}
                                        onChange={(e) =>
                                            setNewExercise((ev) => ({
                                                ...ev,
                                                category: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="Técnico">Técnico</option>
                                        <option value="Tático">Tático</option>
                                        <option value="Físico">Físico</option>
                                        <option value="Misto">Misto</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Duração:
                                    </label>
                                    <input
                                        type="text"
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={newExercise.duration}
                                        onChange={(e) =>
                                            setNewExercise((ev) => ({
                                                ...ev,
                                                duration: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Ícone:
                                    </label>
                                    <input
                                        type="text"
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={newExercise.icon}
                                        onChange={(e) =>
                                            setNewExercise((ev) => ({
                                                ...ev,
                                                icon: e.target.value,
                                            }))
                                        }
                                        maxLength={2}
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                        Nível:
                                    </label>
                                    <select
                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                        value={newExercise.level}
                                        onChange={(e) =>
                                            setNewExercise((ev) => ({
                                                ...ev,
                                                level: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="Fácil">Fácil</option>
                                        <option value="Médio">Médio</option>
                                        <option value="Intenso">Intenso</option>
                                        <option value="Difícil">Difícil</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-bold text-lg shadow transition-all mt-4"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>＋</span>
                                    Guardar Exercício
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Cabeçalho */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>🤾‍♂️</span> Exercícios de Andebol
                    </h2>
                    <p className="text-muted text-base text-gray-500 dark:text-gray-400">
                        Biblioteca pessoal + partilhada · {exercises.length}{" "}
                        exercícios
                    </p>
                </div>
                <button
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow font-bold text-base flex items-center gap-2 transition-all"
                    onClick={() => setShowModal(true)}
                >
                    <span className="text-xl">＋</span> Criar Exercício
                </button>
            </div>
            {/* Filtros */}
            <div className="mb-6 flex flex-col md:flex-row gap-2 items-center">
                <input
                    type="text"
                    placeholder="🔍 Pesquisar exercícios..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-400"
                />
                <div className="flex gap-2 mt-2 md:mt-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`px-3 py-1 rounded-lg font-bold text-sm border transition-all ${selectedCategory === cat ? "bg-purple-600 text-white border-purple-600" : "bg-white dark:bg-gray-800 text-purple-600 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900"}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            {/* Lista de Exercícios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((e, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow p-5 flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                        onClick={() => {
                            setEditIndex(idx);
                            setEditExercise(e);
                            setEditModal(true);
                        }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{e.icon}</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {e.name}
                            </span>
                            <span
                                className={`ml-auto px-2 py-1 rounded text-xs font-bold ${e.category === "Técnico" ? "bg-blue-100 text-blue-700" : e.category === "Tático" ? "bg-purple-100 text-purple-700" : e.category === "Físico" ? "bg-yellow-100 text-yellow-700" : e.category === "Misto" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                            >
                                {e.category}
                            </span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                            {e.description}
                        </div>
                        <div className="flex items-center gap-4 mt-auto">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
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
