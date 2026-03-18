"use client";
import React, { useState } from "react";

type PresStatus = "P" | "F" | "J";
type Athlete = {
    name: string;
    number: number;
    pos: string;
    pres: PresStatus[];
    percent: number;
};

const summary = {
    percent: 91,
    presentes: "16/18",
    faltasSemJust: 3,
    atletaAssiduo: { name: "Bruno D.", percent: 100 },
};

const sessions = ["25 FEV", "27 FEV", "1 MAR", "3 MAR", "SEG", "QUA", "PROX"];

const athletes: Athlete[] = [
    {
        name: "João Silva",
        number: 8,
        pos: "Pivot",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Miguel Costa",
        number: 7,
        pos: "Ala Esq.",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Rui Santos",
        number: 3,
        pos: "Central",
        pres: ["P", "P", "P", "F", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "André Ferreira",
        number: 11,
        pos: "Pivot",
        pres: ["P", "J", "P", "P", "P", "P", "P"],
        percent: 80,
    },
    {
        name: "Pedro Alves",
        number: 14,
        pos: "Ala Dir.",
        pres: ["F", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Tiago Mendes",
        number: 5,
        pos: "Central",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Carlos Lima",
        number: 1,
        pos: "GR",
        pres: ["P", "P", "F", "F", "P", "P", "P"],
        percent: 79,
    },
    {
        name: "Bruno Dias",
        number: 17,
        pos: "Ala Esq.",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 100,
    },
];

const statusColor: Record<PresStatus, string> = {
    P: "text-green-600",
    F: "text-red-600",
    J: "text-yellow-600",
};
const statusBg: Record<PresStatus, string> = {
    P: "bg-green-100",
    F: "bg-red-100",
    J: "bg-yellow-100",
};

export default function Assiduidade() {
    const [athletesState, setAthletesState] = useState<Athlete[]>(athletes);
    const [editModal, setEditModal] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editAthlete, setEditAthlete] = useState<Athlete | null>(null);
    const [showExport, setShowExport] = useState(false);
    const [showExportAll, setShowExportAll] = useState(false);
    const handleExportPDF = () => {
        setShowExport(true);
        setTimeout(() => {
            window.print();
            setShowExport(false);
        }, 100);
    };
    const handleExportAllPDF = () => {
        setShowExportAll(true);
        setTimeout(() => {
            window.print();
            setShowExportAll(false);
        }, 100);
    };
    const [showModal, setShowModal] = useState(false);
    const [exported, setExported] = useState(false);
    const [newSession, setNewSession] = useState({
        date: "",
        type: "Tático",
        notes: "",
    });
    const handleExport = () => {
        setExported(true);
        setTimeout(() => setExported(false), 1500);
    };
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            {/* Modal Registar Sessão */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-green-100 dark:border-green-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={() => setShowModal(false)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-green-600 text-4xl mb-2">
                                📝
                            </span>
                            <h3 className="text-2xl font-extrabold text-green-700 dark:text-green-300">
                                Registar Nova Sessão
                            </h3>
                        </div>
                        <form
                            className="flex flex-col gap-4 text-base"
                            onSubmit={(e) => {
                                e.preventDefault();
                                setShowModal(false);
                                setNewSession({
                                    date: "",
                                    type: "Tático",
                                    notes: "",
                                });
                            }}
                        >
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Data:
                                </label>
                                <input
                                    type="date"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newSession.date}
                                    onChange={(e) =>
                                        setNewSession((ev) => ({
                                            ...ev,
                                            date: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Tipo:
                                </label>
                                <select
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newSession.type}
                                    onChange={(e) =>
                                        setNewSession((ev) => ({
                                            ...ev,
                                            type: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="Tático">Tático</option>
                                    <option value="Físico">Físico</option>
                                    <option value="Técnico">Técnico</option>
                                    <option value="Misto">Misto</option>
                                </select>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Observações:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={newSession.notes}
                                    onChange={(e) =>
                                        setNewSession((ev) => ({
                                            ...ev,
                                            notes: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-bold text-lg shadow transition-all mt-4"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>＋</span>
                                    Guardar Sessão
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-green-700 dark:text-green-300 flex items-center gap-2">
                        <span>✅</span> Assiduidade
                    </h2>
                    <div className="text-muted text-base text-gray-500 dark:text-gray-400">
                        Seniores Masculinos · Março 2025
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        className="px-6 py-3 rounded-xl shadow font-bold text-base flex items-center gap-2 transition-all bg-gray-200 dark:bg-gray-800 text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                        onClick={handleExportAllPDF}
                    >
                        <span className="text-xl">⬇️</span> Exportar
                    </button>
                    <button
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow font-bold text-base flex items-center gap-2 transition-all"
                        onClick={() => setShowModal(true)}
                    >
                        <span className="text-xl">＋</span> Registar Sessão
                    </button>
                </div>
                {/* Exportação geral: layout só para print/export */}
                {showExportAll && (
                    <div
                        className="fixed inset-0 z-[9999] print:z-[9999] bg-white print:bg-white text-gray-900 print:text-gray-900 print:block screen:hidden overflow-auto"
                        style={{ padding: 0, margin: 0 }}
                    >
                        <div className="w-full max-w-5xl mx-auto p-0 print:p-0 bg-white print:bg-white rounded-2xl shadow-none border-none">
                            {/* Cabeçalho premium */}
                            <div className="bg-green-900 text-white py-6 px-0 rounded-t-2xl flex flex-col items-center border-b-8 border-green-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-3xl text-green-700 border-2 border-green-300 shadow-lg">
                                        <span>🏆</span>
                                    </div>
                                    <div className="text-xl font-extrabold tracking-tight">
                                        TeamAction
                                    </div>
                                </div>
                                <div className="text-base font-semibold tracking-wide">
                                    Relatório de Assiduidade &middot; Seniores
                                    Masculinos
                                </div>
                                <div className="text-xs text-green-100 mt-1">
                                    Época 2025 &middot;{" "}
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                            {/* Estatísticas premium reduzidas */}
                            <div className="flex flex-row flex-wrap items-stretch justify-center gap-2 px-4 pt-4 pb-2">
                                <div className="flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center bg-green-50 border-l-2 border-green-700 rounded-lg py-2 shadow-sm">
                                    <div className="text-xl mb-1">📈</div>
                                    <div className="text-[10px] text-gray-500 mb-0.5">
                                        ASSIDUIDADE GERAL
                                    </div>
                                    <div className="text-lg font-extrabold text-green-700">
                                        {summary.percent}%
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        Esta semana
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center bg-blue-50 border-l-2 border-blue-700 rounded-lg py-2 shadow-sm">
                                    <div className="text-xl mb-1">👥</div>
                                    <div className="text-[10px] text-gray-500 mb-0.5">
                                        PRESENTES HOJE
                                    </div>
                                    <div className="text-lg font-extrabold text-blue-700">
                                        {summary.presentes}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        Último treino
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center bg-yellow-50 border-l-2 border-yellow-400 rounded-lg py-2 shadow-sm">
                                    <div className="text-xl mb-1">⚠️</div>
                                    <div className="text-[10px] text-gray-500 mb-0.5">
                                        FALTAS SEM JUSTIF.
                                    </div>
                                    <div className="text-lg font-extrabold text-yellow-600">
                                        {summary.faltasSemJust}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        Último mês
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[120px] max-w-[160px] flex flex-col items-center bg-gray-50 border-l-2 border-gray-400 rounded-lg py-2 shadow-sm">
                                    <div className="text-xl mb-1">⭐</div>
                                    <div className="text-[10px] text-gray-500 mb-0.5">
                                        ATLETA + ASSÍDUO
                                    </div>
                                    <div className="font-extrabold text-gray-900 flex items-center gap-1 text-sm">
                                        {summary.atletaAssiduo.name}
                                        <span className="text-yellow-400 text-base">
                                            🥇
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        {summary.atletaAssiduo.percent}%
                                        presença
                                    </div>
                                </div>
                            </div>
                            {/* Tabela de atletas premium */}
                            <div className="overflow-x-auto rounded-xl border border-green-200 bg-white shadow-none px-2 pb-4">
                                <table className="min-w-full text-xs">
                                    <thead className="bg-green-900 text-white">
                                        <tr>
                                            <th className="py-2 px-2 text-left font-bold tracking-wide">
                                                ATLETA
                                            </th>
                                            <th className="py-2 px-2 text-left font-bold tracking-wide">
                                                Nº
                                            </th>
                                            <th className="py-2 px-2 text-left font-bold tracking-wide">
                                                POSIÇÃO
                                            </th>
                                            {sessions.map((s) => (
                                                <th
                                                    key={s}
                                                    className="py-2 px-2 text-center font-bold tracking-wide"
                                                >
                                                    {s}
                                                </th>
                                            ))}
                                            <th className="py-2 px-2 text-center font-bold tracking-wide">
                                                % ASSID.
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {athletesState.map((a, idx) => (
                                            <tr
                                                key={idx}
                                                className={
                                                    idx % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-green-50"
                                                }
                                            >
                                                <td className="py-2 px-2 font-semibold text-gray-900 flex items-center gap-1">
                                                    {a.name}
                                                    {a.name ===
                                                        summary.atletaAssiduo
                                                            .name && (
                                                        <span
                                                            className="text-yellow-400 text-base"
                                                            title="Atleta mais assíduo"
                                                        >
                                                            🥇
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2 text-gray-700">
                                                    {a.number}
                                                </td>
                                                <td className="py-2 px-2 text-gray-700">
                                                    {a.pos}
                                                </td>
                                                {a.pres.map((p, i) => (
                                                    <td
                                                        key={i}
                                                        className="py-2 px-2 text-center"
                                                    >
                                                        <span
                                                            className={`inline-block w-6 h-6 rounded-full font-bold align-middle text-xs shadow-sm border ${p === "P" ? "bg-green-200 text-green-800 border-green-400" : p === "F" ? "bg-red-200 text-red-800 border-red-400" : "bg-yellow-200 text-yellow-800 border-yellow-400"}`}
                                                        >
                                                            {p}
                                                        </span>
                                                    </td>
                                                ))}
                                                <td className="py-2 px-2 text-center">
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            className={`font-bold ${a.percent === 100 ? "text-green-600" : a.percent < 80 ? "text-red-600" : "text-gray-900"}`}
                                                        >
                                                            {a.percent}%
                                                        </span>
                                                        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-1 rounded-full ${a.percent === 100 ? "bg-green-500" : a.percent < 80 ? "bg-red-400" : "bg-green-300"}`}
                                                                style={{
                                                                    width: `${a.percent}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Rodapé institucional e assinatura */}
                            <div className="px-4 pb-4 pt-2 border-t border-green-100 text-[10px] text-gray-400 text-center flex flex-col items-center gap-1">
                                <div>
                                    Relatório gerado por{" "}
                                    <span className="font-bold text-green-700">
                                        TeamAction
                                    </span>{" "}
                                    &middot; {new Date().toLocaleDateString()}
                                </div>
                                <div className="mt-2 w-full flex justify-end pr-4">
                                    <div className="border-t border-gray-300 w-40 text-gray-400 pt-1 text-[10px]">
                                        Assinatura do responsável
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-xl p-6 flex flex-col justify-between border-green-400 bg-white dark:bg-gray-800 shadow">
                    <div className="text-xs text-gray-500 mb-1">
                        ASSIDUIDADE GERAL
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                        {summary.percent}%
                    </div>
                    <div className="text-xs text-gray-500">Esta semana</div>
                </div>
                <div className="border rounded-xl p-6 flex flex-col justify-between border-gray-400 bg-white dark:bg-gray-800 shadow">
                    <div className="text-xs text-gray-500 mb-1">
                        PRESENTES HOJE
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {summary.presentes}
                    </div>
                    <div className="text-xs text-gray-500">Último treino</div>
                </div>
                <div className="border rounded-xl p-6 flex flex-col justify-between border-yellow-400 bg-white dark:bg-gray-800 shadow">
                    <div className="text-xs text-gray-500 mb-1">
                        FALTAS SEM JUSTIF.
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">
                        {summary.faltasSemJust}
                    </div>
                    <div className="text-xs text-gray-500">Último mês</div>
                </div>
                <div className="border rounded-xl p-6 flex flex-col justify-between border-gray-400 bg-white dark:bg-gray-800 shadow">
                    <div className="text-xs text-gray-500 mb-1">
                        ATLETA + ASSÍDUO
                    </div>
                    <div className="font-bold text-gray-900 dark:text-gray-100">
                        {summary.atletaAssiduo.name}
                    </div>
                    <div className="text-xs text-gray-500">
                        {summary.atletaAssiduo.percent}% presença
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900">
                        <tr>
                            <th className="py-3 px-4 text-left">ATLETA</th>
                            <th className="py-3 px-4 text-left">Nº</th>
                            <th className="py-3 px-4 text-left">POSIÇÃO</th>
                            {sessions.map((s) => (
                                <th key={s} className="py-3 px-4 text-center">
                                    {s}
                                </th>
                            ))}
                            <th className="py-3 px-4 text-center">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {athletesState.map((a, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-green-50 dark:hover:bg-green-900 cursor-pointer"
                                onClick={() => {
                                    setEditIndex(idx);
                                    setEditAthlete({ ...a });
                                    setEditModal(true);
                                }}
                            >
                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                                    {a.name}
                                </td>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                    {a.number}
                                </td>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                    {a.pos}
                                </td>
                                {a.pres.map((p, i) => (
                                    <td
                                        key={i}
                                        className="py-3 px-4 text-center"
                                    >
                                        <span
                                            className={`inline-block w-6 h-6 rounded-full font-bold align-middle ${statusBg[p]} ${statusColor[p]}`}
                                        >
                                            {p}
                                        </span>
                                    </td>
                                ))}
                                <td
                                    className={`py-3 px-4 text-center font-bold ${a.percent === 100 ? "text-green-600" : a.percent < 80 ? "text-red-600" : "text-gray-900 dark:text-gray-100"}`}
                                >
                                    {a.percent}%
                                </td>
                            </tr>
                        ))}
                        {/* Modal Editar Atleta */}
                        {editModal && editAthlete && (
                            <>
                                {/* Modal de edição */}
                                {!showExport && (
                                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-green-100 dark:border-green-900">
                                            <button
                                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                                                onClick={() =>
                                                    setEditModal(false)
                                                }
                                                aria-label="Fechar"
                                            >
                                                ×
                                            </button>
                                            <div className="flex flex-col items-center mb-6">
                                                <span className="text-green-600 text-4xl mb-2">
                                                    👤
                                                </span>
                                                <h3 className="text-2xl font-extrabold text-green-700 dark:text-green-300">
                                                    Editar Atleta
                                                </h3>
                                            </div>
                                            <form
                                                className="flex flex-col gap-4 text-base"
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (
                                                        editIndex !== null &&
                                                        editAthlete
                                                    ) {
                                                        setAthletesState(
                                                            (prev) =>
                                                                prev.map(
                                                                    (at, i) =>
                                                                        i ===
                                                                        editIndex
                                                                            ? editAthlete
                                                                            : at,
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
                                                        value={editAthlete.name}
                                                        onChange={(e) =>
                                                            setEditAthlete(
                                                                (ev) =>
                                                                    ev
                                                                        ? {
                                                                              ...ev,
                                                                              name: e
                                                                                  .target
                                                                                  .value,
                                                                          }
                                                                        : ev,
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="font-semibold text-gray-700 dark:text-gray-200">
                                                            Nº:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                                            value={
                                                                editAthlete.number
                                                            }
                                                            onChange={(e) =>
                                                                setEditAthlete(
                                                                    (ev) =>
                                                                        ev
                                                                            ? {
                                                                                  ...ev,
                                                                                  number: Number(
                                                                                      e
                                                                                          .target
                                                                                          .value,
                                                                                  ),
                                                                              }
                                                                            : ev,
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="font-semibold text-gray-700 dark:text-gray-200">
                                                            Posição:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                                            value={
                                                                editAthlete.pos
                                                            }
                                                            onChange={(e) =>
                                                                setEditAthlete(
                                                                    (ev) =>
                                                                        ev
                                                                            ? {
                                                                                  ...ev,
                                                                                  pos: e
                                                                                      .target
                                                                                      .value,
                                                                              }
                                                                            : ev,
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                                        Presenças (P/F/J):
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                                        value={editAthlete.pres.join(
                                                            ",",
                                                        )}
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target.value
                                                                    .toUpperCase()
                                                                    .replace(
                                                                        /[^PFJ,]/g,
                                                                        "",
                                                                    );
                                                            setEditAthlete(
                                                                (ev) =>
                                                                    ev
                                                                        ? {
                                                                              ...ev,
                                                                              pres: val
                                                                                  .split(
                                                                                      ",",
                                                                                  )
                                                                                  .filter(
                                                                                      Boolean,
                                                                                  ) as PresStatus[],
                                                                          }
                                                                        : ev,
                                                            );
                                                        }}
                                                        required
                                                    />
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        Ex: P,P,F,J,P,P,P
                                                    </span>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                                                        % Assiduidade:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                                        value={
                                                            editAthlete.percent
                                                        }
                                                        onChange={(e) =>
                                                            setEditAthlete(
                                                                (ev) =>
                                                                    ev
                                                                        ? {
                                                                              ...ev,
                                                                              percent:
                                                                                  Number(
                                                                                      e
                                                                                          .target
                                                                                          .value,
                                                                                  ),
                                                                          }
                                                                        : ev,
                                                            )
                                                        }
                                                        min={0}
                                                        max={100}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        type="submit"
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2 rounded-lg transition-all"
                                                        onClick={
                                                            handleExportPDF
                                                        }
                                                    >
                                                        Exportar PDF
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                                {/* Layout de exportação PDF, só visível na impressão */}
                                {showExport && (
                                    <div
                                        className="fixed inset-0 flex items-center justify-center z-[9999] print:z-[9999] bg-white print:bg-white text-gray-900 print:text-gray-900"
                                        style={{ padding: 0, margin: 0 }}
                                    >
                                        <div className="w-full max-w-xl mx-auto p-0 print:p-0 bg-white print:bg-white rounded-2xl shadow-none border-none">
                                            {/* Header Profissional */}
                                            <div className="flex items-center gap-4 border-b-4 border-green-700 px-10 pt-10 pb-6">
                                                <div className="flex-shrink-0">
                                                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-5xl text-green-700 border-4 border-green-300">
                                                        👤
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h1 className="text-3xl font-extrabold text-green-800 mb-1 tracking-tight">
                                                        Ficha Individual de
                                                        Atleta
                                                    </h1>
                                                    <div className="text-base text-gray-500 font-medium">
                                                        Documento de assiduidade
                                                        e identificação
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-gray-400 font-semibold">
                                                    {new Date().toLocaleDateString()}
                                                </div>
                                            </div>
                                            {/* Dados do Atleta */}
                                            <div className="px-10 pt-8 pb-2">
                                                <div className="grid grid-cols-2 gap-6 mb-6">
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">
                                                            Nome
                                                        </div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            {editAthlete?.name}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">
                                                            Número
                                                        </div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            #
                                                            {
                                                                editAthlete?.number
                                                            }
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">
                                                            Posição
                                                        </div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            {editAthlete?.pos}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">
                                                            % Assiduidade
                                                        </div>
                                                        <div className="text-lg font-bold text-green-700">
                                                            {
                                                                editAthlete?.percent
                                                            }
                                                            %
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Presenças */}
                                                <div className="mb-2">
                                                    <div className="text-base font-bold text-green-700 mb-2">
                                                        Registo de Presenças
                                                    </div>
                                                    <table className="w-full border border-green-200 rounded-lg overflow-hidden text-sm">
                                                        <thead>
                                                            <tr className="bg-green-50">
                                                                {sessions.map(
                                                                    (s, i) => (
                                                                        <th
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="py-2 px-3 text-center font-bold text-green-800 border-b border-green-100"
                                                                        >
                                                                            {s}
                                                                        </th>
                                                                    ),
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                {editAthlete?.pres?.map(
                                                                    (p, i) => (
                                                                        <td
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="py-2 px-3 text-center"
                                                                        >
                                                                            <span
                                                                                className={`inline-block w-8 h-8 rounded-full font-bold align-middle text-lg shadow-sm border ${p === "P" ? "bg-green-200 text-green-800 border-green-400" : p === "F" ? "bg-red-200 text-red-800 border-red-400" : "bg-yellow-200 text-yellow-800 border-yellow-400"}`}
                                                                            >
                                                                                {
                                                                                    p
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                    ),
                                                                )}
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            {/* Rodapé */}
                                            <div className="px-10 pb-8 pt-4 border-t border-green-100 text-xs text-gray-400 text-center">
                                                Documento gerado por{" "}
                                                <span className="font-bold text-green-700">
                                                    TeamAction
                                                </span>{" "}
                                                &middot;{" "}
                                                {new Date().toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
