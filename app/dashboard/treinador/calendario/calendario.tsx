"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type JogoDB = {
    id: string;
    adversario: string;
    data: string;
    casa_fora: string;
    resultado_nos: number | null;
    resultado_adv: number | null;
    estado: string;
    equipa_id: string;
    equipa_nome: string;
};

type CalendarNote = {
    id: string;
    nota: string;
    created_at: string;
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

function jogoDateKey(data: string | Date) {
    // data may come as Date object from DB or ISO string
    if (typeof data === "string") return data.slice(0, 10);
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, "0");
    const d = String(data.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export default function Calendario({ jogos }: { jogos: JogoDB[] }) {
    const router = useRouter();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = dateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Notes state
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [newNota, setNewNota] = useState("");
    const [savingNota, setSavingNota] = useState(false);

    // Group jogos by date key
    const jogosByDate = useMemo(() => {
        const map: Record<string, JogoDB[]> = {};
        for (const j of jogos) {
            const k = jogoDateKey(j.data);
            if (!map[k]) map[k] = [];
            map[k].push(j);
        }
        return map;
    }, [jogos]);

    // Month stats
    const monthStats = useMemo(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
        const monthJogos = jogos.filter((j) =>
            jogoDateKey(j.data).startsWith(prefix),
        );
        return {
            jogos: monthJogos.length,
            agendados: monthJogos.filter((j) => j.estado === "agendado").length,
        };
    }, [jogos, year, month]);

    const grid = buildGrid(year, month);

    // Navigation
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

    // Fetch notes when date changes
    const fetchNotes = useCallback(async (date: string) => {
        setNotesLoading(true);
        try {
            const res = await fetch(`/api/calendario/notas?data=${date}`);
            if (res.ok) setNotes(await res.json());
            else setNotes([]);
        } catch {
            setNotes([]);
        } finally {
            setNotesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchNotes(selectedDate);
            setNewNota("");
        }
    }, [selectedDate, fetchNotes]);

    const openDay = (d: number) => {
        const key = dateKey(year, month, d);
        setSelectedDate(key);
    };

    const closeModal = () => {
        setSelectedDate(null);
        setNotes([]);
        setNewNota("");
    };

    const addNota = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !newNota.trim()) return;
        setSavingNota(true);
        try {
            const res = await fetch("/api/calendario/notas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: selectedDate, nota: newNota }),
            });
            if (res.ok) {
                const created: CalendarNote = await res.json();
                setNotes((prev) => [...prev, created]);
                setNewNota("");
            }
        } finally {
            setSavingNota(false);
        }
    };

    const deleteNota = async (id: string) => {
        try {
            await fetch(`/api/calendario/notas/${id}`, { method: "DELETE" });
            setNotes((prev) => prev.filter((n) => n.id !== id));
        } catch {
            /* ignore */
        }
    };

    const selectedDayJogos = selectedDate
        ? jogosByDate[selectedDate] || []
        : [];
    const selDate = selectedDate ? formatFullDate(selectedDate) : null;
    const selectedIsPast = selectedDate ? selectedDate < todayKey : false;

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-6">
            {/* ── MODAL ──────────────────────────────────────────────────── */}
            {selectedDate && selDate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg relative border border-blue-100 dark:border-blue-900 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📅</span>
                                <div>
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                        {selDate.weekday}, {selDate.day} de{" "}
                                        {selDate.month}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selDate.year}
                                    </p>
                                </div>
                            </div>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xl font-bold transition-all"
                                onClick={closeModal}
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            {/* Redirect buttons (only for future/today) */}
                            {!selectedIsPast && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            closeModal();
                                            router.push(
                                                "/dashboard/treinador/sessoes",
                                            );
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm shadow"
                                    >
                                        <span>🏋️</span> Marcar Treino
                                    </button>
                                    <button
                                        onClick={() => {
                                            closeModal();
                                            router.push(
                                                "/dashboard/treinador/jogos",
                                            );
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm shadow"
                                    >
                                        <span>🤾</span> Marcar Jogo
                                    </button>
                                </div>
                            )}

                            {/* Jogos do dia */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
                                    Jogos
                                </h4>
                                {selectedDayJogos.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        Sem jogos neste dia.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {selectedDayJogos.map((j) => (
                                            <div
                                                key={j.id}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800"
                                            >
                                                <span className="text-xl shrink-0">
                                                    🤾
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                        vs {j.adversario}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {j.casa_fora === "casa"
                                                            ? "Em Casa"
                                                            : "Fora"}{" "}
                                                        · {j.equipa_nome}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                                        j.estado === "agendado"
                                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                            : j.estado ===
                                                                "realizado"
                                                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                    }`}
                                                >
                                                    {j.estado === "agendado"
                                                        ? "Agendado"
                                                        : j.estado ===
                                                            "realizado"
                                                          ? "Realizado"
                                                          : j.estado}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Anotações pessoais */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
                                    Anotações pessoais
                                </h4>
                                {notesLoading ? (
                                    <p className="text-sm text-gray-400 text-center py-3">
                                        A carregar...
                                    </p>
                                ) : notes.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        Sem anotações para este dia.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2 mb-3">
                                        {notes.map((n) => (
                                            <div
                                                key={n.id}
                                                className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                                            >
                                                <span className="text-lg shrink-0 mt-0.5">
                                                    📝
                                                </span>
                                                <p className="flex-1 text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                                                    {n.nota}
                                                </p>
                                                {!selectedIsPast && (
                                                    <button
                                                        onClick={() =>
                                                            deleteNota(n.id)
                                                        }
                                                        className="shrink-0 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                                                        aria-label="Eliminar anotação"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add note form (only for future/today) */}
                                {!selectedIsPast && (
                                    <form
                                        onSubmit={addNota}
                                        className="flex gap-2 mt-2"
                                    >
                                        <input
                                            type="text"
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                                            placeholder="Adicionar anotação..."
                                            value={newNota}
                                            onChange={(e) =>
                                                setNewNota(e.target.value)
                                            }
                                            disabled={savingNota}
                                        />
                                        <button
                                            type="submit"
                                            disabled={
                                                savingNota || !newNota.trim()
                                            }
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm"
                                        >
                                            {savingNota ? "..." : "Guardar"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HEADER ────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3">
                        <span>📅</span> Calendário
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Jogos e anotações pessoais
                        {monthStats.jogos > 0 && (
                            <span className="ml-2 text-gray-400 dark:text-gray-500">
                                · {monthStats.jogos} jogo
                                {monthStats.jogos !== 1 ? "s" : ""} este mês
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all shadow-sm"
                        aria-label="Mês anterior"
                    >
                        ◀
                    </button>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-base min-w-[160px] text-center px-2">
                        {MONTHS[month]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all shadow-sm"
                        aria-label="Próximo mês"
                    >
                        ▶
                    </button>
                </div>
            </div>

            {/* ── CALENDAR GRID ─────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg shadow-slate-200 dark:shadow-gray-950 overflow-hidden border border-slate-100 dark:border-gray-800">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-gray-800">
                    {WEEKDAYS.map((d, i) => (
                        <div
                            key={d}
                            className={`py-3 text-center text-xs font-bold tracking-widest uppercase ${
                                i >= 5
                                    ? "text-rose-400 bg-rose-50/60 dark:bg-rose-950/20"
                                    : "text-indigo-500 dark:text-indigo-400"
                            }`}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                {grid.map((week, wi) => (
                    <div
                        key={wi}
                        className="grid grid-cols-7 border-b border-slate-100 dark:border-gray-800 last:border-b-0"
                    >
                        {week.map((day, di) => {
                            const key = day ? dateKey(year, month, day) : null;
                            const dayJogos = key ? jogosByDate[key] || [] : [];
                            const isToday = key === todayKey;
                            const isWeekend = di >= 5;

                            const dayDate = day
                                ? new Date(year, month, day)
                                : null;
                            if (dayDate) dayDate.setHours(0, 0, 0, 0);
                            const isPast = dayDate ? dayDate < today : false;
                            const isClickable = !!day;

                            return (
                                <div
                                    key={di}
                                    onClick={() =>
                                        isClickable && day && openDay(day)
                                    }
                                    className={`
                                        min-h-[110px] p-2.5 flex flex-col relative
                                        border-r border-slate-100 dark:border-gray-800 last:border-r-0
                                        transition-colors duration-100
                                        ${!day ? "bg-slate-50/50 dark:bg-gray-950/50" : ""}
                                        ${isPast && day ? "bg-gray-50 dark:bg-gray-950/70 opacity-60" : ""}
                                        ${isClickable ? "cursor-pointer" : ""}
                                        ${isWeekend && day && !isPast ? "bg-rose-50/40 dark:bg-rose-950/10" : ""}
                                        ${isClickable && !isWeekend ? "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20" : ""}
                                        ${isClickable && isWeekend ? "hover:bg-rose-50/70 dark:hover:bg-rose-950/20" : ""}
                                    `}
                                >
                                    {day && (
                                        <>
                                            <div className="flex items-start justify-between mb-1.5">
                                                <span
                                                    className={`
                                                        text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                                                        ${
                                                            isToday
                                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-300 dark:shadow-indigo-900"
                                                                : isPast
                                                                  ? "text-gray-400 dark:text-gray-600"
                                                                  : isWeekend
                                                                    ? "text-rose-400"
                                                                    : "text-slate-600 dark:text-slate-300"
                                                        }
                                                    `}
                                                >
                                                    {day}
                                                </span>
                                            </div>

                                            {/* Jogo chips */}
                                            <div className="flex flex-col gap-1 flex-1">
                                                {dayJogos
                                                    .slice(0, 2)
                                                    .map((j, i) => (
                                                        <div
                                                            key={i}
                                                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border-l-2 border-l-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 flex items-center gap-1 truncate"
                                                        >
                                                            <span className="text-[10px] shrink-0">
                                                                🤾
                                                            </span>
                                                            <span className="truncate">
                                                                vs{" "}
                                                                {j.adversario}
                                                            </span>
                                                        </div>
                                                    ))}
                                                {dayJogos.length > 2 && (
                                                    <div className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 pl-2">
                                                        +{dayJogos.length - 2}{" "}
                                                        mais
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
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-slate-100 dark:border-gray-800">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        🤾 Jogo
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-slate-100 dark:border-gray-800">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        📝 Anotação pessoal
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-slate-100 dark:border-gray-800">
                    <span className="w-3 h-3 rounded-full bg-gray-300" />
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        Dias passados (não editáveis)
                    </span>
                </div>
            </div>
        </div>
    );
}
