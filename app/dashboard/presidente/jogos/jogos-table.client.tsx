// Componente cliente de jogos (presidente).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RegistarResultadoModal from "./_components/RegistarResultadoModal.client";
import ConvocatoriaModal from "./_components/ConvocatoriaModal.client";
import EditarDataModal from "./_components/EditarDataModal.client";

type Jogo = {
    id: string;
    adversario: string;
    data: string;
    casa_fora: string;
    resultado_nos: number | null;
    resultado_adv: number | null;
    estado: string;
    equipa_id: string;
    equipa_nome: string;
    hora_inicio: string | null;
    hora_fim: string | null;
};

const estadoStyle: Record<string, string> = {
    realizado: "bg-slate-500/10 text-gray-500 dark:text-gray-400",
    agendado: "bg-cyan-500/10 text-cyan-400",
    cancelado: "bg-red-500/10 text-red-400",
};

function getResultado(j: Jogo) {
    if (j.estado === "agendado")
        return { label: "—", style: "text-gray-400 dark:text-gray-500" };
    if (j.resultado_nos != null && j.resultado_adv != null) {
        if (j.resultado_nos > j.resultado_adv)
            return {
                label: `${j.resultado_nos}-${j.resultado_adv} V`,
                style: "text-emerald-400 font-bold",
            };
        if (j.resultado_nos < j.resultado_adv)
            return {
                label: `${j.resultado_nos}-${j.resultado_adv} D`,
                style: "text-red-400 font-bold",
            };
        return {
            label: `${j.resultado_nos}-${j.resultado_adv} E`,
            style: "text-amber-400 font-bold",
        };
    }
    return { label: "—", style: "text-gray-400" };
}

export default function JogosTable({ jogos }: { jogos: Jogo[] }) {
    const [filtroEquipa, setFiltroEquipa] = useState("Todas");
    const router = useRouter();

    const equipasUnicas = [
        "Todas",
        ...Array.from(new Set(jogos.map((j) => j.equipa_nome))),
    ];

    const jogosFiltrados =
        filtroEquipa === "Todas"
            ? jogos
            : jogos.filter((j) => j.equipa_nome === filtroEquipa);

    const realizados = jogosFiltrados.filter((j) => j.estado === "realizado");
    const agendados = jogosFiltrados.filter((j) => j.estado === "agendado");
    const vitorias = realizados.filter(
        (j) => j.resultado_nos! > j.resultado_adv!,
    ).length;

    return (
        <div className="space-y-6">
            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Total de Jogos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {jogosFiltrados.length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Vitórias
                    </p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">
                        {vitorias}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Realizados
                    </p>
                    <p className="text-3xl font-bold text-gray-600 dark:text-gray-300 mt-2">
                        {realizados.length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Agendados
                    </p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">
                        {agendados.length}
                    </p>
                </div>
            </div>

            {/* Próximos jogos */}
            {agendados.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/20 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                        📅 Próximos Jogos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {agendados.slice(0, 3).map((j) => (
                            <div
                                key={j.id}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50"
                            >
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {new Date(j.data).toLocaleDateString(
                                        "pt-PT",
                                        { day: "2-digit", month: "short" },
                                    )}
                                    {j.hora_inicio && (
                                        <span className="ml-1">
                                            {j.hora_inicio.slice(0, 5)}
                                        </span>
                                    )}
                                </p>
                                <p className="text-gray-900 dark:text-white font-semibold mt-1">
                                    vs {j.adversario}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {j.equipa_nome} · {j.casa_fora}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabela com filtro */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        📋 Todos os Jogos
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        {equipasUnicas.map((eq) => (
                            <button
                                key={eq}
                                onClick={() => setFiltroEquipa(eq)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    filtroEquipa === eq
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                                {eq}
                            </button>
                        ))}
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left px-6 py-4">Data</th>
                            <th className="text-left px-6 py-4">Adversário</th>
                            <th className="text-left px-6 py-4">Equipa</th>
                            <th className="text-left px-6 py-4">Local</th>
                            <th className="text-left px-6 py-4">Resultado</th>
                            <th className="text-left px-6 py-4">Estado</th>
                            <th className="text-left px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {jogosFiltrados.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm"
                                >
                                    Nenhum jogo encontrado para esta equipa.
                                </td>
                            </tr>
                        ) : (
                            jogosFiltrados.map((j) => {
                                const resultado = getResultado(j);
                                const dataJogo = new Date(j.data);
                                dataJogo.setHours(0, 0, 0, 0);
                                const agora = new Date();
                                const hojeMeia = new Date();
                                hojeMeia.setHours(0, 0, 0, 0);
                                let jogoTerminado = false;
                                if (dataJogo < hojeMeia) {
                                    jogoTerminado = true;
                                } else if (
                                    dataJogo.getTime() === hojeMeia.getTime() &&
                                    j.hora_fim
                                ) {
                                    const [hf, mf] = j.hora_fim
                                        .split(":")
                                        .map(Number);
                                    if (
                                        agora.getHours() > hf ||
                                        (agora.getHours() === hf &&
                                            agora.getMinutes() >= mf)
                                    ) {
                                        jogoTerminado = true;
                                    }
                                }
                                return (
                                    <tr
                                        key={j.id}
                                        className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            <span>
                                                {new Date(
                                                    j.data,
                                                ).toLocaleDateString("pt-PT", {
                                                    day: "2-digit",
                                                    month: "short",
                                                })}
                                            </span>
                                            {j.hora_inicio && (
                                                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                                                    {j.hora_inicio.slice(0, 5)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                            {j.adversario}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {j.equipa_nome}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 capitalize">
                                            {j.casa_fora}
                                        </td>
                                        <td
                                            className={`px-6 py-4 ${resultado.style}`}
                                        >
                                            {resultado.label}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${jogoTerminado && j.estado === "agendado" ? "bg-amber-500/10 text-amber-400" : (estadoStyle[j.estado] ?? "bg-slate-500/10 text-slate-400")}`}
                                            >
                                                {jogoTerminado &&
                                                j.estado === "agendado"
                                                    ? "terminado"
                                                    : j.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {j.estado === "agendado" &&
                                                    !jogoTerminado && (
                                                        <EditarDataModal
                                                            jogo={{
                                                                id: j.id,
                                                                adversario:
                                                                    j.adversario,
                                                                data: j.data,
                                                                hora_inicio:
                                                                    j.hora_inicio,
                                                                hora_fim:
                                                                    j.hora_fim,
                                                            }}
                                                            onSaved={() =>
                                                                router.refresh()
                                                            }
                                                        />
                                                    )}
                                                {j.estado !== "cancelado" &&
                                                    jogoTerminado && (
                                                        <RegistarResultadoModal
                                                            jogo={{
                                                                id: j.id,
                                                                adversario:
                                                                    j.adversario,
                                                                data: j.data,
                                                            }}
                                                        />
                                                    )}
                                                {j.estado !== "cancelado" &&
                                                    !jogoTerminado &&
                                                    j.equipa_id && (
                                                        <ConvocatoriaModal
                                                            jogoId={j.id}
                                                            equipaId={
                                                                j.equipa_id
                                                            }
                                                            adversario={
                                                                j.adversario
                                                            }
                                                            data={j.data}
                                                        />
                                                    )}
                                            </div>
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
