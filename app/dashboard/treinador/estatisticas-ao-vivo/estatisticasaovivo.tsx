"use client";
import React, { useState } from "react";

const liveStatsData = [
    { event: "Golo", athlete: "João Silva", time: "12'", badge: "badge-green" },
    {
        event: "Assistência",
        athlete: "Maria Costa",
        time: "18'",
        badge: "badge-blue",
    },
    { event: "Falta", athlete: "Pedro Sousa", time: "22'", badge: "badge-red" },
    {
        event: "Substituição",
        athlete: "Ana Martins",
        time: "30'",
        badge: "badge-orange",
    },
];

export default function LiveStats() {
    const [showModal, setShowModal] = useState(false);
    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
    const handleStartLive = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui pode adicionar lógica para iniciar live
        setShowModal(false);
    };
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            {/* Modal Iniciar Live */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-blue-100 dark:border-blue-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={handleCloseModal}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-blue-600 text-4xl mb-2">
                                📊
                            </span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Iniciar Live
                            </h3>
                        </div>
                        <form
                            className="flex flex-col gap-4 text-base"
                            onSubmit={handleStartLive}
                        >
                            <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                                Tem a certeza que pretende iniciar a estatística
                                ao vivo?
                            </p>
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-all"
                                >
                                    Iniciar
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
                    <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 flex items-center gap-3 mb-1">
                        <span>📊</span> Live Stats
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Acompanhe estatísticas em tempo real durante os jogos.
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-base shadow transition-all flex items-center gap-2"
                    onClick={handleOpenModal}
                >
                    <span className="text-xl">●</span> Iniciar Live
                </button>
            </div>
            <div className="mb-8 flex items-center gap-4 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 px-6 py-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 animate-pulse text-white font-bold text-lg">
                    ●
                </span>
                <div className="font-bold text-red-600 text-lg">LIVE</div>
                <div className="flex-1 flex justify-center gap-8">
                    <div className="text-center">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Sporting CP
                        </div>
                        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                            18
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Tempo
                        </div>
                        <div className="text-red-600 text-xl font-mono">
                            38&apos;
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            FC Porto
                        </div>
                        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                            15
                        </div>
                    </div>
                </div>
                <button className="ml-4 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg font-bold text-xs shadow hover:bg-red-200 dark:hover:bg-red-800 transition-all">
                    Ver Live →
                </button>
            </div>
            <div className="mb-8">
                <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <span>🔴</span> Eventos Recentes
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Evento
                                </th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Atleta
                                </th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Tempo
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveStatsData.map((ev, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                                >
                                    <td className="p-3">
                                        <span
                                            className={`px-3 py-1 rounded-lg font-bold text-xs text-white ${ev.badge === "badge-green" ? "bg-green-600" : ev.badge === "badge-blue" ? "bg-blue-600" : ev.badge === "badge-red" ? "bg-red-600" : "bg-yellow-500"}`}
                                        >
                                            {ev.event}
                                        </span>
                                    </td>
                                    <td className="p-3 font-medium text-gray-900 dark:text-white">
                                        {ev.athlete}
                                    </td>
                                    <td className="p-3">{ev.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
