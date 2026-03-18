"use client";
import React, { useState } from "react";
const eventColors = {
    Treino: "bg-violet-100 text-violet-700 dark:bg-violet-800/30 dark:text-violet-200",
    Jogo: "bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-200",
    Recuperação:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-200",
};

const weekDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

const inicialcalendarioData = [
    [
        { day: 3, events: [] },
        {
            day: 4,
            events: [
                { time: "19:00", type: "Treino", label: "Técnico + Físico" },
            ],
        },
        { day: 5, events: [] },
        { day: 6, events: [] },
        {
            day: 7,
            events: [{ time: "19:00", type: "Jogo", label: "Treinamento" }],
        },
        { day: 1, events: [] },
        { day: 2, events: [] },
    ],
    [
        { day: 10, events: [] },
        {
            day: 11,
            events: [{ time: "19:00", type: "Treino", label: "Misto" }],
        },
        { day: 12, events: [] },
        { day: 13, events: [] },
        {
            day: 14,
            events: [{ time: "19:00", type: "Jogo", label: "Exibição (Casa)" }],
        },
        { day: 8, events: [] },
        {
            day: 9,
            events: [{ time: "19:00", type: "Treino", label: "Técnico" }],
        },
    ],
    [
        { day: 17, events: [] },
        {
            day: 18,
            events: [{ time: "19:00", type: "Treino", label: "Técnico" }],
        },
        { day: 19, events: [] },
        {
            day: 20,
            events: [
                { time: "19:00", type: "Recuperação", label: "Recuperação" },
            ],
        },
        { day: 21, events: [{ time: "19:00", type: "Jogo", label: "Taça" }] },
        { day: 15, events: [] },
        {
            day: 16,
            events: [{ time: "19:00", type: "Treino", label: "Técnico" }],
        },
    ],
    [
        { day: 24, events: [] },
        {
            day: 25,
            events: [{ time: "19:00", type: "Treino", label: "Misto" }],
        },
        { day: 26, events: [] },
        {
            day: 27,
            events: [{ time: "19:00", type: "Treino", label: "Físico" }],
        },
        { day: 28, events: [] },
        { day: 22, events: [] },
        {
            day: 23,
            events: [{ time: "19:00", type: "Treino", label: "Técnico" }],
        },
    ],
    [
        { day: 29, events: [] },
        { day: 30, events: [] },
        { day: 31, events: [] },
        { day: null, events: [] },
        { day: null, events: [] },
        { day: null, events: [] },
        { day: null, events: [] },
    ],
];
function getToday() {
    const today = new Date();
    return today.getDate();
}

const eventIcons = {
    Treino: "🏋️‍♂️",
    Jogo: "🤾‍♂️",
    Recuperação: "🛌",
};

export default function Calendario({
    calendarioData = inicialcalendarioData,
    onAddEvent,
}: {
    calendarioData?: typeof inicialcalendarioData;
    onAddEvent?: (weekIdx: number, dayIdx: number) => void;
}) {
    const [selectedDay, setSelectedDay] = useState<{
        weekIdx: number;
        dayIdx: number;
    } | null>(null);
    const [month, setMonth] = useState("Março 2026"); // UI only
    const today = getToday();
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        type: "Treino",
        time: "",
        label: "",
    });
    // Handler para abrir modal
    const handleOpenModal = () => {
        setShowModal(true);
        setNewEvent({ type: "Treino", time: "", label: "" });
    };
    // Handler para fechar modal
    const handleCloseModal = () => {
        setShowModal(false);
    };
    // Handler para criar evento (simulação)
    const handleCreateEvent = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui pode integrar lógica para adicionar evento ao calendário
        setShowModal(false);
    };

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">
            {/* Modal de criação de evento */}
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
                                📅
                            </span>
                            <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                                Criar Novo Evento
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Adicione um treino, jogo ou recuperação ao
                                calendário
                            </p>
                        </div>
                        <form
                            onSubmit={handleCreateEvent}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Tipo
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 transition-all"
                                    value={newEvent.type}
                                    onChange={(e) =>
                                        setNewEvent((ev) => ({
                                            ...ev,
                                            type: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="Treino">Treino</option>
                                    <option value="Jogo">Jogo</option>
                                    <option value="Recuperação">
                                        Recuperação
                                    </option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Hora
                                </label>
                                <input
                                    type="time"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 transition-all"
                                    value={newEvent.time}
                                    onChange={(e) =>
                                        setNewEvent((ev) => ({
                                            ...ev,
                                            time: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 transition-all"
                                    value={newEvent.label}
                                    onChange={(e) =>
                                        setNewEvent((ev) => ({
                                            ...ev,
                                            label: e.target.value,
                                        }))
                                    }
                                    placeholder="Ex: Treinamento Técnico"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl py-3 font-bold text-lg shadow hover:from-blue-700 hover:to-blue-500 transition-all"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>➕</span>
                                    Criar Evento
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Cabeçalho do calendário */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3">
                        <span>📅</span> Calendário de Andebol
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Planeamento de treinos, jogos e recuperação
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Botão para abrir modal de criação de evento */}
                    <button
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition-all flex items-center gap-2"
                        onClick={handleOpenModal}
                    >
                        <span>＋</span> Criar Evento
                    </button>
                    <button className="rounded-lg px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all">
                        ◀
                    </button>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                        {month}
                    </span>
                    <button className="rounded-lg px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all">
                        ▶
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 w-full">
                {weekDays.map((d) => (
                    <div
                        key={d}
                        className="text-center font-bold text-blue-700 dark:text-blue-300 text-xs tracking-wide uppercase"
                    >
                        {d}
                    </div>
                ))}
            </div>
            {calendarioData.map((week, weekIdx) => (
                <div
                    key={weekIdx}
                    className="grid grid-cols-7 gap-2 mb-2 w-full"
                >
                    {week.map((day, dayIdx) => {
                        const isSelected =
                            selectedDay &&
                            selectedDay.weekIdx === weekIdx &&
                            selectedDay.dayIdx === dayIdx;
                        const isToday = day.day === today;
                        return (
                            <div
                                key={dayIdx}
                                className={`rounded-xl min-h-[90px] p-2 bg-white dark:bg-gray-900 border transition-all duration-150 cursor-pointer flex flex-col items-start relative shadow-sm w-full
                                    ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700"}
                                    ${!day.day ? "opacity-0 pointer-events-none" : ""}`}
                                onClick={() =>
                                    day.day &&
                                    setSelectedDay({ weekIdx, dayIdx })
                                }
                            >
                                <div
                                    className={`font-bold text-xs mb-1 ${isToday ? "text-white bg-blue-600 rounded-full px-2 py-0.5 shadow" : "text-gray-500 dark:text-gray-400"}`}
                                >
                                    {day.day || ""}
                                </div>
                                {day.events.map((ev, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-xs font-semibold mt-1 px-2 py-1 rounded-lg flex items-center gap-1 ${eventColors[ev.type as keyof typeof eventColors]} group relative`}
                                    >
                                        <span>
                                            {
                                                eventIcons[
                                                    ev.type as keyof typeof eventIcons
                                                ]
                                            }
                                        </span>
                                        <span>{ev.label}</span>
                                        <span className="ml-auto text-[10px] text-gray-400">
                                            {ev.time}
                                        </span>
                                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap shadow-lg">
                                            {ev.type}
                                        </span>
                                    </div>
                                ))}
                                {isSelected && onAddEvent && (
                                    <button
                                        className="mt-2 w-full bg-blue-600 text-white rounded-lg py-1 text-xs font-bold hover:bg-blue-700 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddEvent(weekIdx, dayIdx);
                                        }}
                                    >
                                        + Adicionar Evento
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Legenda */}
            <div className="flex gap-8 mt-8 justify-center w-full">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-violet-500 inline-block"></span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Treino
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-red-500 inline-block"></span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Jogo
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-emerald-500 inline-block"></span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Recuperação
                    </span>
                </div>
            </div>
        </div>
    );
}
