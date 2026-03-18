"use client";
import React, { useState } from "react";

const gamesData = [
    {
        date: "28 Fev",
        opponent: "FC Porto",
        result: "28-22 V",
        badge: "badge-green",
        location: "Casa",
    },
    {
        date: "21 Fev",
        opponent: "Benfica",
        result: "19-24 D",
        badge: "badge-red",
        location: "Fora",
    },
    {
        date: "14 Fev",
        opponent: "Braga",
        result: "25-25 E",
        badge: "badge-orange",
        location: "Casa",
    },
    {
        date: "07 Fev",
        opponent: "ABC Braga",
        result: "31-18 V",
        badge: "badge-green",
        location: "Casa",
    },
];

export default function Games() {
    const [showModal, setShowModal] = useState(false);
    const [newGame, setNewGame] = useState({
        date: "",
        opponent: "",
        location: "Casa",
        result: "",
    });
    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
    const handleCreateGame = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui pode adicionar lógica para guardar o novo jogo
        setShowModal(false);
    };
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            {/* Modal Novo Jogo */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-orange-100 dark:border-orange-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={handleCloseModal}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-orange-600 text-4xl mb-2">
                                🏆
                            </span>
                            <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                Novo Jogo
                            </h3>
                        </div>
                        <form
                            className="flex flex-col gap-4 text-base"
                            onSubmit={handleCreateGame}
                        >
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Data:
                                </label>
                                <input
                                    type="date"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newGame.date}
                                    onChange={(e) =>
                                        setNewGame((ev) => ({
                                            ...ev,
                                            date: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Adversário:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newGame.opponent}
                                    onChange={(e) =>
                                        setNewGame((ev) => ({
                                            ...ev,
                                            opponent: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Local:
                                </label>
                                <select
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newGame.location}
                                    onChange={(e) =>
                                        setNewGame((ev) => ({
                                            ...ev,
                                            location: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="Casa">Casa</option>
                                    <option value="Fora">Fora</option>
                                </select>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Resultado:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newGame.result}
                                    onChange={(e) =>
                                        setNewGame((ev) => ({
                                            ...ev,
                                            result: e.target.value,
                                        }))
                                    }
                                    placeholder="Ex: 28-22 V"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition-all"
                                >
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2 rounded-lg transition-all"
                                    onClick={handleCloseModal}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Cabeçalho */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl text-orange-700 flex items-center gap-3 mb-1">
                        <span className="text-2xl">🏆</span> Jogos
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                        Planeie e acompanhe jogos e competições.
                    </p>
                </div>
                <button
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-xl font-bold text-base shadow hover:from-orange-700 hover:to-orange-500 transition-all flex items-center gap-2"
                    onClick={handleOpenModal}
                >
                    <span className="text-xl">＋</span> Novo Jogo
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-xl p-6 shadow-md flex flex-col justify-between">
                    <span className="text-xs text-gray-500 font-semibold">
                        JOGOS REALIZADOS
                    </span>
                    <span className="text-3xl font-bold text-orange-600">
                        12
                    </span>
                    <span className="text-xs text-gray-400">8V · 2E · 2D</span>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl p-6 shadow-md flex flex-col justify-between">
                    <span className="text-xs text-gray-500 font-semibold">
                        PRÓXIMO JOGO
                    </span>
                    <span className="text-xl font-bold text-green-600">
                        Dom 16h
                    </span>
                    <span className="text-xs text-gray-400">
                        vs Belenenses · Fora
                    </span>
                </div>
            </div>
            <div className="mb-8">
                <div className="text-2xl text-orange-700 flex items-center gap-2 mb-4">
                    <span className="text-xl">🏅</span> Últimos Jogos
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                            <tr>
                                <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">
                                    Data
                                </th>
                                <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">
                                    Adversário
                                </th>
                                <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">
                                    Resultado
                                </th>
                                <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">
                                    Local
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {gamesData.map((g, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                                >
                                    <td className="p-3 font-medium text-orange-700 whitespace-nowrap">
                                        {g.date}
                                    </td>
                                    <td className="p-3">{g.opponent}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-3 py-1 rounded-lg font-bold text-xs text-white ${g.badge === "badge-green" ? "bg-green-600" : g.badge === "badge-red" ? "bg-red-600" : "bg-yellow-500"}`}
                                        >
                                            {g.result}
                                        </span>
                                    </td>
                                    <td className="p-3">{g.location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
