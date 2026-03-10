'use client';

import { useState } from "react";

const jogos = [
    { id: 1, data: "28 Fev", hora: "16h00", adversario: "FC Porto", equipa: "Seniores M", local: "Casa", resultado_nos: 28, resultado_adv: 22, estado: "Realizado" },
    { id: 2, data: "21 Fev", hora: "18h00", adversario: "Benfica", equipa: "Seniores M", local: "Fora", resultado_nos: 19, resultado_adv: 24, estado: "Realizado" },
    { id: 3, data: "14 Fev", hora: "15h00", adversario: "Braga", equipa: "Sub-18 M", local: "Casa", resultado_nos: 25, resultado_adv: 25, estado: "Realizado" },
    { id: 4, data: "07 Fev", hora: "17h00", adversario: "ABC Braga", equipa: "Seniores M", local: "Casa", resultado_nos: 31, resultado_adv: 18, estado: "Realizado" },
    { id: 5, data: "15 Mar", hora: "16h00", adversario: "Sporting CP", equipa: "Seniores M", local: "Fora", resultado_nos: null, resultado_adv: null, estado: "Agendado" },
    { id: 6, data: "22 Mar", hora: "11h00", adversario: "SL Benfica", equipa: "Sub-18 M", local: "Casa", resultado_nos: null, resultado_adv: null, estado: "Agendado" },
    { id: 7, data: "29 Mar", hora: "15h00", adversario: "FC Porto", equipa: "Sub-16 F", local: "Casa", resultado_nos: null, resultado_adv: null, estado: "Agendado" },
];

function getResultado(j: typeof jogos[0]) {
    if (j.estado === "Agendado") return { label: "—", style: "text-slate-500" };
    if (j.resultado_nos! > j.resultado_adv!) return { label: `${j.resultado_nos}-${j.resultado_adv} V`, style: "text-emerald-400 font-bold" };
    if (j.resultado_nos! < j.resultado_adv!) return { label: `${j.resultado_nos}-${j.resultado_adv} D`, style: "text-red-400 font-bold" };
    return { label: `${j.resultado_nos}-${j.resultado_adv} E`, style: "text-amber-400 font-bold" };
}

const estadoStyle: Record<string, string> = {
    "Realizado": "bg-slate-500/10 text-slate-400",
    "Agendado": "bg-cyan-500/10 text-cyan-400",
    "Cancelado": "bg-red-500/10 text-red-400",
};

// Lista de equipas únicas para o filtro
const equipasUnicas = ["Todas", ...Array.from(new Set(jogos.map(j => j.equipa)))];

export default function JogosPage() {
    const [filtroEquipa, setFiltroEquipa] = useState("Todas");

    const jogosFiltrados = filtroEquipa === "Todas"
        ? jogos
        : jogos.filter(j => j.equipa === filtroEquipa);

    const realizados = jogosFiltrados.filter(j => j.estado === "Realizado");
    const agendados = jogosFiltrados.filter(j => j.estado === "Agendado");
    const vitorias = realizados.filter(j => j.resultado_nos! > j.resultado_adv!).length;

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Jogos</h1>
                    <p className="text-sm text-slate-400 mt-1">Época 2024/2025 · Todos os escalões</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Agendar Jogo
                </button>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Jogos</p>
                    <p className="text-3xl font-bold text-white mt-2">{jogosFiltrados.length}</p>
                </div>
                <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vitórias</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{vitorias}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Realizados</p>
                    <p className="text-3xl font-bold text-slate-300 mt-2">{realizados.length}</p>
                </div>
                <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agendados</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{agendados.length}</p>
                </div>
            </div>

            {/* Próximos jogos */}
            {agendados.length > 0 && (
                <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">📅 Próximos Jogos</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {agendados.map((j) => (
                            <div key={j.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                <p className="text-xs text-slate-500">{j.data} · {j.hora}</p>
                                <p className="text-white font-semibold mt-1">vs {j.adversario}</p>
                                <p className="text-xs text-slate-400 mt-1">{j.equipa} · {j.local}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabela com filtro */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">📋 Todos os Jogos</h2>

                    {/* ✅ NOVO — Filtro por equipa */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {equipasUnicas.map((eq) => (
                            <button
                                key={eq}
                                onClick={() => setFiltroEquipa(eq)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    filtroEquipa === eq
                                        ? "bg-violet-600 text-white"
                                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                }`}
                            >
                                {eq}
                            </button>
                        ))}
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                            <th className="text-left px-6 py-4">Data</th>
                            <th className="text-left px-6 py-4">Adversário</th>
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Local</th>
                            <th className="text-left px-6 py-4">Resultado</th>
                            <th className="text-left px-6 py-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jogosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-sm">
                                    Nenhum jogo encontrado para esta equipa.
                                </td>
                            </tr>
                        ) : (
                            jogosFiltrados.map((j) => {
                                const resultado = getResultado(j);
                                return (
                                    <tr key={j.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-400">{j.data} · {j.hora}</td>
                                        <td className="px-6 py-4 font-semibold text-white">vs {j.adversario}</td>
                                        <td className="px-6 py-4 text-slate-400">{j.equipa}</td>
                                        <td className="px-6 py-4 text-slate-400">{j.local}</td>
                                        <td className={`px-6 py-4 ${resultado.style}`}>{resultado.label}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[j.estado]}`}>
                                                {j.estado}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
