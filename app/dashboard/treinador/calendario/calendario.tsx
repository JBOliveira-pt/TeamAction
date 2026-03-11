"use client";
import React, { useState } from "react";
const eventColors = {
    Treino: "#7c3aed",
    Jogo: "#ef4444",
    Recuperação: "#10b981",
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
        { day: 31, events: [] },
        { day: null, events: [] },
        { day: null, events: [] },
        { day: null, events: [] },
        { day: null, events: [] },
        { day: 29, events: [] },
        { day: 30, events: [] },
    ],
];

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

    return (
        <div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "8px",
                    marginBottom: "16px",
                }}
            >
                {weekDays.map((d) => (
                    <div
                        key={d}
                        style={{
                            fontWeight: "bold",
                            textAlign: "center",
                            color: "#64748b",
                        }}
                    >
                        {d}
                    </div>
                ))}
            </div>
            {calendarioData.map((week, weekIdx) => (
                <div
                    key={weekIdx}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "8px",
                        marginBottom: "8px",
                    }}
                >
                    {week.map((day, dayIdx) => (
                        <div
                            key={dayIdx}
                            style={{
                                background: "#fff",
                                borderRadius: "8px",
                                minHeight: "64px",
                                padding: "8px",
                                border:
                                    day.day === 8
                                        ? "2px solid #7c3aed"
                                        : "1px solid #e5e7eb",
                                cursor: day.day ? "pointer" : "default",
                                boxShadow:
                                    selectedDay &&
                                    selectedDay.weekIdx === weekIdx &&
                                    selectedDay.dayIdx === dayIdx
                                        ? "0 0 0 2px #7c3aed"
                                        : undefined,
                            }}
                            onClick={() =>
                                day.day && setSelectedDay({ weekIdx, dayIdx })
                            }
                        >
                            <div
                                style={{
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    color: "#64748b",
                                }}
                            >
                                {day.day || ""}
                            </div>
                            {day.events.map((ev, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        fontSize: "13px",
                                        marginTop: "4px",
                                        color: eventColors[
                                            ev.type as keyof typeof eventColors
                                        ],
                                        fontWeight: "bold",
                                    }}
                                >
                                    {ev.time} {ev.label}
                                </div>
                            ))}
                            {selectedDay &&
                                selectedDay.weekIdx === weekIdx &&
                                selectedDay.dayIdx === dayIdx &&
                                onAddEvent && (
                                    <button
                                        style={{
                                            marginTop: "8px",
                                            background: "#7c3aed",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "6px",
                                            padding: "4px 8px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            onAddEvent(weekIdx, dayIdx)
                                        }
                                    >
                                        + Adicionar Evento
                                    </button>
                                )}
                        </div>
                    ))}
                </div>
            ))}
            <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <span
                        style={{
                            width: "12px",
                            height: "12px",
                            background: "#7c3aed",
                            borderRadius: "2px",
                            display: "inline-block",
                        }}
                    ></span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                        Treino
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <span
                        style={{
                            width: "12px",
                            height: "12px",
                            background: "#ef4444",
                            borderRadius: "2px",
                            display: "inline-block",
                        }}
                    ></span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                        Jogo
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <span
                        style={{
                            width: "12px",
                            height: "12px",
                            background: "#10b981",
                            borderRadius: "2px",
                            display: "inline-block",
                        }}
                    ></span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                        Recuperação
                    </span>
                </div>
            </div>
        </div>
    );
}
