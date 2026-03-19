"use client";
import React, { useState, useMemo } from "react";

type EventType = "Treino" | "Jogo" | "Recuperação";

interface EventItem {
    time: string;
    type: EventType;
    label: string;
}

type EventsMap = Record<string, EventItem[]>;

const EVENT_CONFIG: Record<
    EventType,
    { icon: string; dot: string; chip: string; border: string; badge: string }
> = {
    Treino: {
        icon: "🏋️‍♂️",
        dot: "bg-violet-500",
        chip: "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
        border: "border-l-violet-500",
        badge: "bg-violet-100 text-violet-700 dark:bg-violet-800/40 dark:text-violet-200",
    },
    Jogo: {
        icon: "🤾‍♂️",
        dot: "bg-rose-500",
        chip: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
        border: "border-l-rose-500",
        badge: "bg-rose-100 text-rose-700 dark:bg-rose-800/40 dark:text-rose-200",
    },
    Recuperação: {
        icon: "🛌",
        dot: "bg-emerald-500",
        chip: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
        border: "border-l-emerald-500",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-200",
    },
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

const initialEvents: EventsMap = {
    "2026-03-04": [
        { time: "19:00", type: "Treino", label: "Técnico + Físico" },
    ],
    "2026-03-07": [{ time: "19:00", type: "Jogo", label: "Treinamento" }],
    "2026-03-09": [{ time: "19:00", type: "Treino", label: "Técnico" }],
    "2026-03-11": [{ time: "19:00", type: "Treino", label: "Misto" }],
    "2026-03-14": [{ time: "19:00", type: "Jogo", label: "Exibição (Casa)" }],
    "2026-03-16": [{ time: "19:00", type: "Treino", label: "Técnico" }],
    "2026-03-18": [{ time: "19:00", type: "Treino", label: "Técnico" }],
    "2026-03-20": [
        { time: "19:00", type: "Recuperação", label: "Recuperação" },
    ],
    "2026-03-21": [{ time: "19:00", type: "Jogo", label: "Taça" }],
    "2026-03-23": [{ time: "19:00", type: "Treino", label: "Técnico" }],
    "2026-03-25": [{ time: "19:00", type: "Treino", label: "Misto" }],
    "2026-03-27": [{ time: "19:00", type: "Treino", label: "Físico" }],
};

function dateKey(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function buildGrid(year: number, month: number): (number | null)[][] {
    const first = new Date(year, month, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(offset).fill(null),
        ...Array.from({ length: days }, (_, i) => i + 1),
    ];
    while (cells.length % 7) cells.push(null);
    const grid: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) grid.push(cells.slice(i, i + 7));
    return grid;
}

function formatFullDate(key: string) {
    const [y, m, d] = key.split("-");
    const date = new Date(+y, +m - 1, +d);
    const weekday = [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
    ][date.getDay()];
    return { weekday, day: parseInt(d), month: MONTHS[+m - 1], year: y };
}

/* ------------------------------------------------------------------ */

export default function Calendario() {
    const today = new Date();
    const todayKey = dateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(2);
    const [events, setEvents] = useState<EventsMap>(initialEvents);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [newEvent, setNewEvent] = useState<EventItem>({
        type: "Treino",
        time: "",
        label: "",
    });

    /* ---------- navigation ---------- */
    const prevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear((y) => y - 1);
        } else setMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear((y) => y + 1);
        } else setMonth((m) => m + 1);
    };

    /* ---------- stats ---------- */
    const monthStats = useMemo(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
        const monthEvs = Object.entries(events)
            .filter(([k]) => k.startsWith(prefix))
            .flatMap(([, v]) => v);
        return {
            total: monthEvs.length,
            treinos: monthEvs.filter((e) => e.type === "Treino").length,
            jogos: monthEvs.filter((e) => e.type === "Jogo").length,
            recuperacoes: monthEvs.filter((e) => e.type === "Recuperação")
                .length,
        };
    }, [events, year, month]);

    /* ---------- grid ---------- */
    const grid = buildGrid(year, month);

    /* ---------- day modal ---------- */
    const openDay = (d: number) => {
        setSelectedDate(dateKey(year, month, d));
        setEditingIdx(null);
        setEditingEvent(null);
        setAddingNew(false);
        setNewEvent({ type: "Treino", time: "", label: "" });
    };
    const closeModal = () => {
        setSelectedDate(null);
        setEditingIdx(null);
        setEditingEvent(null);
        setAddingNew(false);
    };

    const startEdit = (idx: number) => {
        if (!selectedDate) return;
        const ev = events[selectedDate]?.[idx];
        if (!ev) return;
        setEditingIdx(idx);
        setEditingEvent({ ...ev });
        setAddingNew(false);
    };
    const saveEdit = () => {
        if (!selectedDate || editingIdx === null || !editingEvent) return;
        setEvents((prev) => {
            const arr = [...(prev[selectedDate] || [])];
            arr[editingIdx] = editingEvent;
            return { ...prev, [selectedDate]: arr };
        });
        setEditingIdx(null);
        setEditingEvent(null);
    };
    const deleteEvent = (idx: number) => {
        if (!selectedDate) return;
        setEvents((prev) => {
            const arr = [...(prev[selectedDate] || [])];
            arr.splice(idx, 1);
            return { ...prev, [selectedDate]: arr };
        });
        if (editingIdx === idx) {
            setEditingIdx(null);
            setEditingEvent(null);
        }
    };
    const addEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;
        setEvents((prev) => {
            const arr = [...(prev[selectedDate] || [])];
            arr.push({ ...newEvent });
            return { ...prev, [selectedDate]: arr };
        });
        setNewEvent({ type: "Treino", time: "", label: "" });
        setAddingNew(false);
    };

    const selectedDayEvents = selectedDate ? events[selectedDate] || [] : [];
    const selDate = selectedDate ? formatFullDate(selectedDate) : null;

    /* ------------------------------------------------------------------ */
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-6">
            {/* ── MODAL ─────────────────────────────────────────────────── */}
            {selectedDate && selDate && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-blue-100 dark:border-blue-900 max-h-[90vh] overflow-y-auto">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={closeModal}
                            aria-label="Fechar"
                        >
                            ×
                        </button>

                        {/* cabeçalho */}
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-blue-600 text-4xl mb-2">
                                📅
                            </span>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                {selDate.weekday}, {selDate.day} de{" "}
                                {selDate.month}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {selDate.year}
                            </p>
                        </div>

                        {/* sem eventos */}
                        {selectedDayEvents.length === 0 && !addingNew && (
                            <p className="text-center text-gray-400 dark:text-gray-500 text-sm mb-6">
                                Sem eventos neste dia.
                            </p>
                        )}

                        {/* lista de eventos */}
                        <div className="flex flex-col gap-3 mb-4">
                            {selectedDayEvents.map((ev, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden"
                                >
                                    {editingIdx === idx && editingEvent ? (
                                        <div className="flex flex-col gap-4 p-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    Tipo
                                                </label>
                                                <select
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 transition-all"
                                                    value={editingEvent.type}
                                                    onChange={(e) =>
                                                        setEditingEvent((v) =>
                                                            v
                                                                ? {
                                                                      ...v,
                                                                      type: e
                                                                          .target
                                                                          .value as EventType,
                                                                  }
                                                                : v,
                                                        )
                                                    }
                                                >
                                                    <option value="Treino">
                                                        🏋️‍♂️ Treino
                                                    </option>
                                                    <option value="Jogo">
                                                        🤾‍♂️ Jogo
                                                    </option>
                                                    <option value="Recuperação">
                                                        🛌 Recuperação
                                                    </option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    Hora
                                                </label>
                                                <input
                                                    type="time"
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 transition-all"
                                                    value={editingEvent.time}
                                                    onChange={(e) =>
                                                        setEditingEvent((v) =>
                                                            v
                                                                ? {
                                                                      ...v,
                                                                      time: e
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : v,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    Descrição
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 transition-all"
                                                    value={editingEvent.label}
                                                    onChange={(e) =>
                                                        setEditingEvent((v) =>
                                                            v
                                                                ? {
                                                                      ...v,
                                                                      label: e
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : v,
                                                        )
                                                    }
                                                    placeholder="Descrição do evento"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={saveEdit}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingIdx(null);
                                                        setEditingEvent(null);
                                                    }}
                                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2 rounded-lg transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <span
                                                className={`w-2 h-10 rounded-full shrink-0 ${EVENT_CONFIG[ev.type].dot}`}
                                            />
                                            <span className="text-xl shrink-0">
                                                {EVENT_CONFIG[ev.type].icon}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                                                    {ev.label}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {ev.type} · {ev.time}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    onClick={() =>
                                                        startEdit(idx)
                                                    }
                                                    className="px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold transition-all"
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        deleteEvent(idx)
                                                    }
                                                    className="px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold transition-all"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* formulário novo evento */}
                        {addingNew ? (
                            <form
                                onSubmit={addEvent}
                                className="flex flex-col gap-4 border-t border-gray-200 dark:border-gray-700 pt-5 mt-2"
                            >
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    Novo Evento
                                </p>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Tipo
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 transition-all"
                                        value={newEvent.type}
                                        onChange={(e) =>
                                            setNewEvent((v) => ({
                                                ...v,
                                                type: e.target
                                                    .value as EventType,
                                            }))
                                        }
                                    >
                                        <option value="Treino">
                                            🏋️‍♂️ Treino
                                        </option>
                                        <option value="Jogo">🤾‍♂️ Jogo</option>
                                        <option value="Recuperação">
                                            🛌 Recuperação
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
                                            setNewEvent((v) => ({
                                                ...v,
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
                                            setNewEvent((v) => ({
                                                ...v,
                                                label: e.target.value,
                                            }))
                                        }
                                        placeholder="Ex: Técnico + Físico"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-bold transition-all"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <span>➕</span> Adicionar
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddingNew(false)}
                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl py-2.5 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold text-base shadow transition-all"
                                onClick={() => setAddingNew(true)}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>＋</span> Adicionar Evento
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── HEADER ────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3">
                        <span>📅</span> Calendário de Andebol
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Planeamento de treinos, jogos e recuperação
                        {monthStats.total > 0 && (
                            <span className="ml-2 text-gray-400 dark:text-gray-500">
                                · {monthStats.total} evento
                                {monthStats.total !== 1 ? "s" : ""} este mês
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                        aria-label="Mês anterior"
                    >
                        ◀
                    </button>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-base min-w-[160px] text-center px-2">
                        {MONTHS[month]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                        aria-label="Próximo mês"
                    >
                        ▶
                    </button>
                </div>
            </div>

            {/* ── CALENDAR GRID ─────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg shadow-slate-200 dark:shadow-gray-950 overflow-hidden border border-slate-100 dark:border-gray-800">
                {/* weekday headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-gray-800">
                    {WEEKDAYS.map((d, i) => (
                        <div
                            key={d}
                            className={`py-3 text-center text-xs font-bold tracking-widest uppercase
                                ${
                                    i >= 5
                                        ? "text-rose-400 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/20"
                                        : "text-indigo-500 dark:text-indigo-400"
                                }`}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* days */}
                {grid.map((week, wi) => (
                    <div
                        key={wi}
                        className="grid grid-cols-7 border-b border-slate-100 dark:border-gray-800 last:border-b-0"
                    >
                        {week.map((day, di) => {
                            const key = day ? dateKey(year, month, day) : null;
                            const dayEvs = key ? events[key] || [] : [];
                            const isToday = key === todayKey;
                            const isWeekend = di >= 5;
                            const visible = dayEvs.slice(0, 2);
                            const overflow = dayEvs.length - 2;

                            return (
                                <div
                                    key={di}
                                    onClick={() => day && openDay(day)}
                                    className={`
                                        min-h-[110px] p-2.5 flex flex-col relative
                                        border-r border-slate-100 dark:border-gray-800 last:border-r-0
                                        transition-colors duration-100
                                        ${!day ? "bg-slate-50/50 dark:bg-gray-950/50" : ""}
                                        ${day ? "cursor-pointer" : ""}
                                        ${isWeekend && day ? "bg-rose-50/40 dark:bg-rose-950/10" : ""}
                                        ${day && !isWeekend ? "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20" : ""}
                                        ${day && isWeekend ? "hover:bg-rose-50/70 dark:hover:bg-rose-950/20" : ""}
                                    `}
                                >
                                    {day && (
                                        <>
                                            {/* day number */}
                                            <div className="flex items-start justify-between mb-1.5">
                                                <span
                                                    className={`
                                                        text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                                                        ${
                                                            isToday
                                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-300 dark:shadow-indigo-900"
                                                                : isWeekend
                                                                  ? "text-rose-400 dark:text-rose-400"
                                                                  : "text-slate-600 dark:text-slate-300"
                                                        }
                                                    `}
                                                >
                                                    {day}
                                                </span>
                                                {/* dot indicators for many events */}
                                                {dayEvs.length > 0 && (
                                                    <div className="flex gap-0.5 mt-1.5 mr-0.5">
                                                        {dayEvs
                                                            .slice(0, 3)
                                                            .map((ev, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`w-1.5 h-1.5 rounded-full ${EVENT_CONFIG[ev.type].dot}`}
                                                                />
                                                            ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* event chips */}
                                            <div className="flex flex-col gap-1 flex-1">
                                                {visible.map((ev, i) => (
                                                    <div
                                                        key={i}
                                                        className={`
                                                            text-[11px] font-semibold px-2 py-0.5 rounded-lg
                                                            border-l-2 ${EVENT_CONFIG[ev.type].border}
                                                            ${EVENT_CONFIG[ev.type].chip}
                                                            flex items-center gap-1 truncate
                                                        `}
                                                    >
                                                        <span className="text-[10px] leading-none shrink-0">
                                                            {
                                                                EVENT_CONFIG[
                                                                    ev.type
                                                                ].icon
                                                            }
                                                        </span>
                                                        <span className="truncate">
                                                            {ev.label}
                                                        </span>
                                                    </div>
                                                ))}
                                                {overflow > 0 && (
                                                    <div className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 pl-2">
                                                        +{overflow} mais
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* ── LEGEND ────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-4 justify-center">
                {(["Treino", "Jogo", "Recuperação"] as EventType[]).map((t) => (
                    <div
                        key={t}
                        className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-slate-100 dark:border-gray-800"
                    >
                        <span
                            className={`w-3 h-3 rounded-full ${EVENT_CONFIG[t].dot}`}
                        />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {EVENT_CONFIG[t].icon} {t}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
