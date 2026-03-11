"use client";
import React from "react";

const sessoesData = [
    {
        date: "3 Mar",
        type: "Tático",
        duration: "90min",
        attendance: "17/18",
        badge: "badge-blue",
    },
    {
        date: "1 Mar",
        type: "Misto",
        duration: "75min",
        attendance: "18/18",
        badge: "badge-purple",
    },
    {
        date: "27 Fev",
        type: "Físico",
        duration: "60min",
        attendance: "15/18",
        badge: "badge-orange",
    },
    {
        date: "25 Fev",
        type: "Tático",
        duration: "90min",
        attendance: "18/18",
        badge: "badge-blue",
    },
];

export default function Sessoes() {
    // Lógica e dados fora do JSX
    const sessoesStats = {
        total: 47,
        hours: 63,
        attendance: 89,
        next: {
            day: "Ter",
            hour: "19h",
            type: "Tático + Físico",
            duration: "90min",
        },
    };

    const sessoesTypes = ["Todas", "Tático", "Físico", "Técnico", "Misto"];

    const sessoes = [
        {
            date: "3 Mar",
            type: "Tático",
            duration: "90min",
            exercises: "6 exercícios",
            attendance: "17/18",
            notes: "Foco transição defensiva",
        },
        {
            date: "1 Mar",
            type: "Misto",
            duration: "75min",
            exercises: "8 exercícios",
            attendance: "18/18",
            notes: "Pré-jogo Belenenses",
        },
        {
            date: "27 Fev",
            type: "Físico",
            duration: "60min",
            exercises: "5 exercícios",
            attendance: "15/18",
            notes: "Sprint + força inferior",
        },
        {
            date: "25 Fev",
            type: "Tático",
            duration: "90min",
            exercises: "7 exercícios",
            attendance: "18/18",
            notes: "Análise Benfica",
        },
        {
            date: "22 Fev",
            type: "Técnico",
            duration: "60min",
            exercises: "9 exercícios",
            attendance: "16/18",
            notes: "Remates e posição guarda-redes",
        },
        {
            date: "20 Fev",
            type: "Misto",
            duration: "90min",
            exercises: "10 exercícios",
            attendance: "17/18",
            notes: "Sessão geral",
        },
        {
            date: "18 Fev",
            type: "Físico",
            duration: "75min",
            exercises: "6 exercícios",
            attendance: "18/18",
            notes: "Resistência aeróbia",
        },
    ];

    // Filtros
    const [selectedType, setSelectedType] = React.useState("Todas");
    const filteredSessoes =
        selectedType === "Todas"
            ? sessoes
            : sessoes.filter((s) => s.type === selectedType);

    return (
        <div
            style={{
                background: "#f7f8fa",
                minHeight: "100vh",
                color: "#1e293b",
                padding: "24px",
            }}
        >
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "8px",
                        padding: "16px 24px",
                        flex: 1,
                        border: "1px solid #e5e7eb",
                    }}
                >
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        TOTAL SESSÕES
                    </div>
                    <div
                        style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#2563eb",
                        }}
                    >
                        {sessoesStats.total}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        Esta época
                    </div>
                </div>
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "8px",
                        padding: "16px 24px",
                        flex: 1,
                        border: "1px solid #e5e7eb",
                    }}
                >
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        HORAS DE TREINO
                    </div>
                    <div
                        style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#10b981",
                        }}
                    >
                        {sessoesStats.hours}h
                    </div>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        Total acumulado
                    </div>
                </div>
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "8px",
                        padding: "16px 24px",
                        flex: 1,
                        border: "1px solid #e5e7eb",
                    }}
                >
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        MÉDIA ASSIDUIDADE
                    </div>
                    <div
                        style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#0891b2",
                        }}
                    >
                        {sessoesStats.attendance}%
                    </div>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        Todas as sessões
                    </div>
                </div>
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "8px",
                        padding: "16px 24px",
                        flex: 1,
                        border: "2px solid #fbbf24",
                    }}
                >
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        PRÓXIMA SESSÃO
                    </div>
                    <div
                        style={{
                            fontSize: "22px",
                            fontWeight: "bold",
                            color: "#fbbf24",
                        }}
                    >
                        {sessoesStats.next.day} · {sessoesStats.next.hour}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                        {sessoesStats.next.type} · {sessoesStats.next.duration}
                    </div>
                </div>
                <button
                    style={{
                        background: "#7c3aed",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "12px 18px",
                        fontWeight: "bold",
                        fontSize: "15px",
                        marginLeft: "16px",
                        cursor: "pointer",
                        height: "56px",
                    }}
                >
                    + Nova Sessão
                </button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {sessoesTypes.map((type) => (
                    <button
                        key={type}
                        style={{
                            background:
                                selectedType === type ? "#0891b2" : "#fff",
                            color: selectedType === type ? "#fff" : "#0891b2",
                            border:
                                selectedType === type
                                    ? "1px solid #0891b2"
                                    : "1px solid #e5e7eb",
                            borderRadius: "6px",
                            padding: "6px 16px",
                            fontWeight: "bold",
                            fontSize: "14px",
                            cursor: "pointer",
                        }}
                        onClick={() => setSelectedType(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>
            <div
                style={{
                    background: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f3f4f6" }}>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    color: "#64748b",
                                    fontWeight: "bold",
                                }}
                            >
                                DATA
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    color: "#64748b",
                                    fontWeight: "bold",
                                }}
                            >
                                TIPO
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    color: "#64748b",
                                    fontWeight: "bold",
                                }}
                            >
                                DURAÇÃO
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    color: "#64748b",
                                    fontWeight: "bold",
                                }}
                            >
                                EXERCÍCIOS
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    color: "#64748b",
                                    fontWeight: "bold",
                                }}
                            >
                                ASSIDUIDADE
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    color: "#64748b",
                                    fontWeight: "bold",
                                }}
                            >
                                OBSERVAÇÕES
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "center",
                                    color: "#64748b",
                                    fontWeight: "bold",
                                }}
                            ></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSessoes.map((s, idx) => (
                            <tr
                                key={idx}
                                style={{ borderBottom: "1px solid #e5e7eb" }}
                            >
                                <td
                                    style={{
                                        padding: "12px",
                                        fontWeight: "bold",
                                        color: "#2563eb",
                                    }}
                                >
                                    {s.date}
                                </td>
                                <td style={{ padding: "12px" }}>
                                    <span
                                        style={{
                                            background:
                                                s.type === "Tático"
                                                    ? "#0891b2"
                                                    : s.type === "Físico"
                                                      ? "#fbbf24"
                                                      : s.type === "Técnico"
                                                        ? "#2563eb"
                                                        : "#7c3aed",
                                            color: "#fff",
                                            borderRadius: "6px",
                                            padding: "4px 10px",
                                            fontWeight: "bold",
                                            fontSize: "13px",
                                        }}
                                    >
                                        {s.type}
                                    </span>
                                </td>
                                <td style={{ padding: "12px" }}>
                                    {s.duration}
                                </td>
                                <td style={{ padding: "12px" }}>
                                    {s.exercises}
                                </td>
                                <td
                                    style={{
                                        padding: "12px",
                                        fontWeight: "bold",
                                        color: "#0891b2",
                                    }}
                                >
                                    {s.attendance}
                                </td>
                                <td
                                    style={{
                                        padding: "12px",
                                        color: "#64748b",
                                    }}
                                >
                                    {s.notes}
                                </td>
                                <td
                                    style={{
                                        padding: "12px",
                                        textAlign: "center",
                                    }}
                                >
                                    <button
                                        style={{
                                            background: "#e5e7eb",
                                            color: "#0891b2",
                                            border: "none",
                                            borderRadius: "6px",
                                            padding: "6px 14px",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
