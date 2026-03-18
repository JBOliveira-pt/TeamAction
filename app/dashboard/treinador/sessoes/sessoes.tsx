"use client";
import React, { useState } from "react";

export default function Sessoes() {
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
    interface Sessao {
        date: string;
        type: string;
        duration: string;
        exercises: string;
        attendance: string;
        notes: string;
    }
    const sessoesTypes = ["Todas", "Tático", "Físico", "Técnico", "Misto"];
    const [sessoes, setSessoes] = useState<Sessao[]>([
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
    ]);
    const [selectedType, setSelectedType] = useState("Todas");
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [sessaoView, setSessaoView] = useState<Sessao | null>(null);
    const [editSessao, setEditSessao] = useState<Sessao | null>(null);
    const [newSessao, setNewSessao] = useState<Sessao>({
        date: "",
        type: "Tático",
        duration: "",
        exercises: "",
        attendance: "",
        notes: "",
    });
    // Função para abrir modal de detalhes
    const handleViewSession = (session: Sessao) => {
        setSessaoView(session);
        setEditSessao({ ...session });
        setShowViewModal(true);
    };
    const filteredSessoes =
        selectedType === "Todas"
            ? sessoes
            : sessoes.filter((s) => s.type === selectedType);

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            {/* Título principal */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-3">
                        <span>🏋️‍♂️</span> Sessões de Treino
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registo e gestão de treinos da época</p>
                </div>
            </div>
            {/* Modal Ver Sessão */}
            {showViewModal && editSessao && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-blue-100 dark:border-blue-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={() => setShowViewModal(false)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-blue-600 text-4xl mb-2">
                                ✏️
                            </span>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                Editar Sessão
                            </h3>
                        </div>
                        <form
                            className="flex flex-col gap-4 text-base"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!sessaoView) return;
                                setSessoes((prev) =>
                                    prev.map((s) =>
                                        s === sessaoView ? editSessao : s,
                                    ),
                                );
                                setSessaoView(editSessao);
                                setShowViewModal(false);
                            }}
                        >
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Data:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-blue-600 font-bold"
                                    value={editSessao.date}
                                    onChange={(e) =>
                                        setEditSessao((ev) =>
                                            ev
                                                ? {
                                                      ...ev,
                                                      date: e.target.value,
                                                  }
                                                : ev,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Tipo:
                                </label>
                                <select
                                    className={`ml-2 px-3 py-1 rounded-lg font-bold text-xs text-white ${editSessao.type === "Tático" ? "bg-cyan-600" : editSessao.type === "Físico" ? "bg-yellow-400" : editSessao.type === "Técnico" ? "bg-cyan-600" : "bg-violet-600"}`}
                                    value={editSessao.type}
                                    onChange={(e) =>
                                        setEditSessao((ev) =>
                                            ev
                                                ? {
                                                      ...ev,
                                                      type: e.target.value,
                                                  }
                                                : ev,
                                        )
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
                                    Duração:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={editSessao.duration}
                                    onChange={(e) =>
                                        setEditSessao((ev) =>
                                            ev
                                                ? {
                                                      ...ev,
                                                      duration: e.target.value,
                                                  }
                                                : ev,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Exercícios:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
                                    value={editSessao.exercises}
                                    onChange={(e) =>
                                        setEditSessao((ev) =>
                                            ev
                                                ? {
                                                      ...ev,
                                                      exercises: e.target.value,
                                                  }
                                                : ev,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Assiduidade:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-cyan-600 font-bold"
                                    value={editSessao.attendance}
                                    onChange={(e) =>
                                        setEditSessao((ev) =>
                                            ev
                                                ? {
                                                      ...ev,
                                                      attendance:
                                                          e.target.value,
                                                  }
                                                : ev,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                    Observações:
                                </label>
                                <input
                                    type="text"
                                    className="ml-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-500"
                                    value={editSessao.notes}
                                    onChange={(e) =>
                                        setEditSessao((ev) =>
                                            ev
                                                ? {
                                                      ...ev,
                                                      notes: e.target.value,
                                                  }
                                                : ev,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg transition-all"
                                >
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2 rounded-lg transition-all"
                                    onClick={() => setShowViewModal(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Nova Sessão */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-blue-100 dark:border-blue-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={() => setShowModal(false)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-blue-600 text-4xl mb-2">
                                📝
                            </span>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                Nova Sessão
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Registe uma nova sessão de treino
                            </p>
                        </div>
                        <form className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 transition-all"
                                    value={newSessao.date}
                                    onChange={(e) =>
                                        setNewSessao((ev) => ({
                                            ...ev,
                                            date: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Tipo
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 transition-all"
                                    value={newSessao.type}
                                    onChange={(e) =>
                                        setNewSessao((ev) => ({
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
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Duração
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 transition-all"
                                    value={newSessao.duration}
                                    onChange={(e) =>
                                        setNewSessao((ev) => ({
                                            ...ev,
                                            duration: e.target.value,
                                        }))
                                    }
                                    placeholder="Ex: 90min"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Exercícios
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 transition-all"
                                    value={newSessao.exercises}
                                    onChange={(e) =>
                                        setNewSessao((ev) => ({
                                            ...ev,
                                            exercises: e.target.value,
                                        }))
                                    }
                                    placeholder="Ex: 8 exercícios"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Assiduidade
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 transition-all"
                                    value={newSessao.attendance}
                                    onChange={(e) =>
                                        setNewSessao((ev) => ({
                                            ...ev,
                                            attendance: e.target.value,
                                        }))
                                    }
                                    placeholder="Ex: 17/18"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Observações
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 transition-all"
                                    value={newSessao.notes}
                                    onChange={(e) =>
                                        setNewSessao((ev) => ({
                                            ...ev,
                                            notes: e.target.value,
                                        }))
                                    }
                                    placeholder="Ex: Foco transição defensiva"
                                />
                            </div>
                            <button
                                type="button"
                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3 font-bold text-lg shadow transition-all"
                                onClick={() => setShowModal(false)}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>➕</span>
                                    Criar Sessão
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Estatísticas e botão Nova Sessão */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch">
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        TOTAL SESSÕES
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                        {sessoesStats.total}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Esta época</span>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        HORAS DE TREINO
                    </span>
                    <span className="text-3xl font-bold text-emerald-500">
                        {sessoesStats.hours}h
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Total acumulado
                    </span>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        MÉDIA ASSIDUIDADE
                    </span>
                    <span className="text-3xl font-bold text-cyan-600">
                        {sessoesStats.attendance}%
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Todas as sessões
                    </span>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-yellow-400 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        PRÓXIMA SESSÃO
                    </span>
                    <span className="text-xl font-bold text-yellow-500">
                        {sessoesStats.next.day} · {sessoesStats.next.hour}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {sessoesStats.next.type} · {sessoesStats.next.duration}
                    </span>
                </div>
                <div className="flex items-end">
                    <button
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow transition-all text-base flex items-center gap-2"
                        onClick={() => setShowModal(true)}
                    >
                        <span className="text-xl">＋</span> Nova Sessão
                    </button>
                </div>
            </div>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-4">
                {sessoesTypes.map((type) => (
                    <button
                        key={type}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all ${selectedType === type ? "bg-cyan-600 text-white border-cyan-600" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"}`}
                        onClick={() => setSelectedType(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>
            {/* Tabela de sessões */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-900">
                            <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                DATA
                            </th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                TIPO
                            </th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                DURAÇÃO
                            </th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                EXERCÍCIOS
                            </th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                ASSIDUIDADE
                            </th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                OBSERVAÇÕES
                            </th>
                            <th className="p-3 text-center text-xs font-bold text-gray-500 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSessoes.map((s: Sessao, idx: number) => (
                            <tr
                                key={idx}
                                className="border-b border-gray-100 dark:border-gray-700"
                            >
                                <td className="p-3 font-bold text-blue-600 whitespace-nowrap">
                                    {s.date}
                                </td>
                                <td className="p-3">
                                    <span
                                        className={`px-3 py-1 rounded-lg font-bold text-xs text-white ${s.type === "Tático" ? "bg-cyan-600" : s.type === "Físico" ? "bg-yellow-400" : s.type === "Técnico" ? "bg-cyan-600" : "bg-violet-600"}`}
                                    >
                                        {s.type}
                                    </span>
                                </td>
                                <td className="p-3">{s.duration}</td>
                                <td className="p-3">{s.exercises}</td>
                                <td className="p-3 font-bold text-cyan-600">
                                    {s.attendance}
                                </td>
                                <td className="p-3 text-gray-500 dark:text-gray-400">{s.notes}</td>
                                <td className="p-3 text-center">
                                    <button
                                        className="bg-gray-100 dark:bg-gray-700 text-blue-600 font-bold px-4 py-2 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
                                        onClick={() => handleViewSession(s)}
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
