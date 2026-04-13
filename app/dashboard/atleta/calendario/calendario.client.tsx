// Componente cliente de calendario (atleta).
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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

type SessaoDB = {
    id: string;
    data: string;
    tipo: string;
    duracao_min: number;
    observacoes: string | null;
    equipa_nome: string | null;
};

type CalendarNote = {
    id: string;
    nota: string;
    created_at: string;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
    const offset = first;
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

function eventDateKey(data: string | Date) {
    if (data instanceof Date) {
        const y = data.getFullYear();
        const m = String(data.getMonth() + 1).padStart(2, "0");
        const d = String(data.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    return data.slice(0, 10);
}

// ----------------------

export default function Calendario({
    jogos,
    sessoes,
    datasComNotas,
    contaPendente = false,
}: {
    jogos: JogoDB[];
    sessoes: SessaoDB[];
    datasComNotas: string[];
    contaPendente?: boolean;
}) {
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

    // Estado das notas
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [newNota, setNewNota] = useState("");
    const [savingNota, setSavingNota] = useState(false);
    const [noteDatesSet, setNoteDatesSet] = useState(
        () => new Set(datasComNotas),
    );

    // Agrupar por data
    const jogosByDate = useMemo(() => {
        const map: Record<string, JogoDB[]> = {};
        for (const j of jogos) {
            const k = eventDateKey(j.data);
            if (!map[k]) map[k] = [];
            map[k].push(j);
        }
        return map;
    }, [jogos]);

    const sessoesByDate = useMemo(() => {
        const map: Record<string, SessaoDB[]> = {};
        for (const s of sessoes) {
            const k = eventDateKey(s.data);
            if (!map[k]) map[k] = [];
            map[k].push(s);
        }
        return map;
    }, [sessoes]);

    // Estatísticas do mês
    const monthStats = useMemo(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
        const mJogos = jogos.filter((j) =>
            eventDateKey(j.data).startsWith(prefix),
        ).length;
        const mSessoes = sessoes.filter((s) =>
            eventDateKey(s.data).startsWith(prefix),
        ).length;
        return { jogos: mJogos, sessoes: mSessoes };
    }, [jogos, sessoes, year, month]);

    const grid = buildGrid(year, month);

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

    const openDay = (d: number) => setSelectedDate(dateKey(year, month, d));

    const closeModal = () => {
        setSelectedDate(null);
        setNotes([]);
        setNewNota("");
    };

    const addNota = async (e: React.FormEvent) => {
        e.preventDefault();
        if (contaPendente || !selectedDate || !newNota.trim()) return;
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
                setNoteDatesSet((prev) => new Set(prev).add(selectedDate));
            }
        } finally {
            setSavingNota(false);
        }
    };

    const deleteNota = async (id: string) => {
        if (contaPendente) return;
        try {
            await fetch(`/api/calendario/notas/${id}`, { method: "DELETE" });
            setNotes((prev) => {
                const remaining = prev.filter((n) => n.id !== id);
                if (remaining.length === 0 && selectedDate) {
                    setNoteDatesSet((s) => {
                        const copy = new Set(s);
                        copy.delete(selectedDate);
                        return copy;
                    });
                }
                return remaining;
            });
        } catch {
            /* ignore */
        }
    };

    const selectedDayJogos = selectedDate
        ? jogosByDate[selectedDate] || []
        : [];
    const selectedDaySessoes = selectedDate
        ? sessoesByDate[selectedDate] || []
        : [];
    const selDate = selectedDate ? formatFullDate(selectedDate) : null;

    return (
        <div className="w-full h-[85dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-4 overflow-hidden">
            {/* ---------------- MODAL ---------------- */}
            {selectedDate && selDate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg relative border border-blue-100 dark:border-blue-900 max-h-[90vh] overflow-y-auto">
                        {/* Cabeçalho */}
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
                                ✕
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
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
                                                    0
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                        vs {j.adversario}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {j.casa_fora === "casa"
                                                            ? "Em Casa"
                                                            : "Fora"}{" "}
                                                        ✕ {j.equipa_nome}
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

                            {/* Sessões de treino */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
                                    Treinos
                                </h4>
                                {selectedDaySessoes.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        Sem treinos neste dia.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {selectedDaySessoes.map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800"
                                            >
                                                <span className="text-xl shrink-0">
                                                    0
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                        {s.tipo}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {s.duracao_min} min
                                                        {s.observacoes
                                                            ? ` ✕ ${s.observacoes}`
                                                            : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Minhas Notas */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
                                    Notas
                                </h4>
                                {notesLoading ? (
                                    <p className="text-sm text-gray-400 text-center py-3">
                                        A carregar...
                                    </p>
                                ) : notes.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        Sem notas para este dia.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2 mb-3">
                                        {notes.map((n) => (
                                            <div
                                                key={n.id}
                                                className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                                            >
                                                <span className="text-lg shrink-0 mt-0.5">
                                                    0
                                                </span>
                                                <p className="flex-1 text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                                                    {n.nota}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        deleteNota(n.id)
                                                    }
                                                    disabled={contaPendente}
                                                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                    aria-label="Eliminar nota"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {contaPendente ? (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                        Conta pendente: aguarda validação do
                                        responsável.
                                    </p>
                                ) : (
                                    <form
                                        onSubmit={addNota}
                                        className="flex gap-2 mt-2"
                                    >
                                        <input
                                            type="text"
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                                            placeholder="Adicionar nota..."
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

            {/* ---------------------- HEADER ---------------------- */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Calendário
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Jogos e treinos da equipa
                        {(monthStats.jogos > 0 || monthStats.sessoes > 0) && (
                            <span className="ml-2 text-gray-400 dark:text-gray-500">
                                {monthStats.jogos > 0 &&
                                    `• ${monthStats.jogos} jogo${monthStats.jogos !== 1 ? "s" : ""}`}
                                {monthStats.sessoes > 0 &&
                                    ` • ${monthStats.sessoes} treino${monthStats.sessoes !== 1 ? "s" : ""}`}{" "}
                                este mês
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
                        ‹
                    </button>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-base min-w-[160px] text-center px-2">
                        {MONTHS[month]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all shadow-sm"
                        aria-label="Próximo mês"
                    >
                        ›
                    </button>
                </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-4 shrink-0">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-slate-100 dark:border-gray-800">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        0 Jogos
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-slate-100 dark:border-gray-800">
                    <span className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        0 Treinos
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-slate-100 dark:border-gray-800">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        0 Notas
                    </span>
                </div>
            </div>

            {/* ---------------------- CALENDAR GRID ---------------------- */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg shadow-slate-200 dark:shadow-gray-950 overflow-hidden border border-slate-100 dark:border-gray-800 flex-1 flex flex-col min-h-0">
                {/* Cabeçalhos dias da semana */}
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-gray-800 shrink-0">
                    {WEEKDAYS.map((d, i) => (
                        <div
                            key={d}
                            className={`py-3 text-center text-xs font-bold tracking-widest uppercase ${
                                i === 0 || i === 6
                                    ? "text-rose-400 bg-rose-50/60 dark:bg-rose-950/20"
                                    : "text-indigo-500 dark:text-indigo-400"
                            }`}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Dias */}
                <div className="flex-1 flex flex-col min-h-0">
                    {grid.map((week, wi) => (
                        <div
                            key={wi}
                            className="grid grid-cols-7 border-b border-slate-100 dark:border-gray-800 last:border-b-0 flex-1"
                        >
                            {week.map((day, di) => {
                                const key = day
                                    ? dateKey(year, month, day)
                                    : null;
                                const dayJogos = key
                                    ? jogosByDate[key] || []
                                    : [];
                                const daySessoes = key
                                    ? sessoesByDate[key] || []
                                    : [];
                                const isToday = key === todayKey;
                                const isWeekend = di === 0 || di === 6;
                                const dayDate = day
                                    ? new Date(year, month, day)
                                    : null;
                                if (dayDate) dayDate.setHours(0, 0, 0, 0);
                                const isPast = dayDate
                                    ? dayDate < today
                                    : false;
                                const hasNotes = key
                                    ? noteDatesSet.has(key)
                                    : false;

                                return (
                                    <div
                                        key={di}
                                        onClick={() => day && openDay(day)}
                                        className={`
                                        p-2 flex flex-col relative overflow-hidden
                                        border-r border-slate-100 dark:border-gray-800 last:border-r-0
                                        transition-colors duration-100
                                        ${!day ? "bg-slate-50/50 dark:bg-gray-950/50" : ""}
                                        ${isPast && day ? "opacity-60" : ""}
                                        ${day ? "cursor-pointer" : ""}
                                        ${isWeekend && day ? "bg-rose-50/40 dark:bg-rose-950/10" : ""}
                                        ${day && !isWeekend ? "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20" : ""}
                                        ${day && isWeekend ? "hover:bg-rose-50/70 dark:hover:bg-rose-950/20" : ""}
                                    `}
                                    >
                                        {day && (
                                            <>
                                                <div className="flex items-start justify-between mb-1">
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

                                                <div className="flex flex-col gap-1 flex-1">
                                                    {daySessoes
                                                        .slice(0, 1)
                                                        .map((s, i) => (
                                                            <div
                                                                key={i}
                                                                className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border-l-2 border-l-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 flex items-center gap-1 truncate"
                                                            >
                                                                <span className="text-[10px] shrink-0">
                                                                    ???
                                                                </span>
                                                                <span className="truncate">
                                                                    {s.tipo}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    {dayJogos
                                                        .slice(0, 1)
                                                        .map((j, i) => (
                                                            <div
                                                                key={i}
                                                                className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border-l-2 border-l-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 flex items-center gap-1 truncate"
                                                            >
                                                                <span className="text-[10px] shrink-0">
                                                                    ??
                                                                </span>
                                                                <span className="truncate">
                                                                    vs{" "}
                                                                    {
                                                                        j.adversario
                                                                    }
                                                                </span>
                                                            </div>
                                                        ))}
                                                    {dayJogos.length +
                                                        daySessoes.length >
                                                        2 && (
                                                        <div className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 pl-2">
                                                            +
                                                            {dayJogos.length +
                                                                daySessoes.length -
                                                                2}{" "}
                                                            mais
                                                        </div>
                                                    )}
                                                    {hasNotes && (
                                                        <div className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border-l-2 border-l-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1 truncate">
                                                            <span className="text-[10px] shrink-0">
                                                                ??
                                                            </span>
                                                            <span className="truncate">
                                                                Anotação
                                                            </span>
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
            </div>
        </div>
    );
}
