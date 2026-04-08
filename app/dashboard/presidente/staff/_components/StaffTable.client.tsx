"use client";

import { useState, useMemo } from "react";
import { EditarMembroModal } from "./EditarMembroModal.client";
import { RemoverMembroModal } from "./RemoverMembroModal.client";
import { getEscaloesPermitidos } from "@/app/lib/grau-escalao-compat";
import { ChevronDown } from "lucide-react";

type StaffRow = {
    id: string;
    nome: string;
    funcao: string;
    equipa_id: string | null;
    equipa_nome: string | null;
    equipa_escalao: string | null;
    user_id: string | null;
    user_email: string | null;
    estado: string;
    created_at: string;
    grau_id: number | null;
    grau_nome: string | null;
};

type EquipaProp = { id: string; nome: string; escalao: string };
type UserProp = {
    id: string;
    name: string;
    email: string;
    imageurl: string | null;
};

const funcaoColors: Record<string, string> = {
    "Treinador Principal":
        "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    "Treinador Adjunto":
        "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Fisioterapeuta:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "Preparador Físico":
        "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    "Team Manager": "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    Médico: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    Nutricionista: "bg-lime-500/10 text-lime-400 border border-lime-500/20",
    Delegado: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
};

function getFuncaoColor(funcao: string) {
    return (
        funcaoColors[funcao] ??
        "bg-slate-500/10 text-slate-400 border border-slate-500/20"
    );
}

const selectClass =
    "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 transition-colors";

export default function StaffTable({
    staff,
    equipas,
    users,
}: {
    staff: StaffRow[];
    equipas: EquipaProp[];
    users: UserProp[];
}) {
    const [filtroFuncao, setFiltroFuncao] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroEquipa, setFiltroEquipa] = useState("");

    // Valores únicos para filtros
    const funcoes = useMemo(
        () => [...new Set(staff.map((s) => s.funcao))].sort(),
        [staff],
    );
    const estados = useMemo(
        () => [...new Set(staff.map((s) => s.estado))].sort(),
        [staff],
    );
    const equipasUnicas = useMemo(() => {
        const nomes = staff
            .filter((s) => s.equipa_nome)
            .map((s) => ({ id: s.equipa_id!, nome: s.equipa_nome! }));
        const map = new Map(nomes.map((n) => [n.id, n.nome]));
        return [...map.entries()]
            .map(([id, nome]) => ({ id, nome }))
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [staff]);

    const filtrados = useMemo(() => {
        return staff.filter((s) => {
            if (filtroFuncao && s.funcao !== filtroFuncao) return false;
            if (filtroEstado && s.estado !== filtroEstado) return false;
            if (filtroEquipa === "__sem__" && s.equipa_id) return false;
            if (
                filtroEquipa &&
                filtroEquipa !== "__sem__" &&
                s.equipa_id !== filtroEquipa
            )
                return false;
            return true;
        });
    }, [staff, filtroFuncao, filtroEstado, filtroEquipa]);

    const isTreinador = (funcao: string) =>
        funcao === "Treinador Principal" || funcao === "Treinador Adjunto";

    const temFiltros = filtroFuncao || filtroEstado || filtroEquipa;

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {staff.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Nenhum membro de staff registado ainda.
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">
                        Clica em &quot;Adicionar Membro&quot; para começar.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                    <th className="text-left px-6 py-4">
                                        Nome
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            Função
                                            <select
                                                value={filtroFuncao}
                                                onChange={(e) =>
                                                    setFiltroFuncao(
                                                        e.target.value,
                                                    )
                                                }
                                                className={selectClass}
                                            >
                                                <option value="">Todas</option>
                                                {funcoes.map((f) => (
                                                    <option key={f} value={f}>
                                                        {f}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        Curso
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            Estado
                                            <select
                                                value={filtroEstado}
                                                onChange={(e) =>
                                                    setFiltroEstado(
                                                        e.target.value,
                                                    )
                                                }
                                                className={selectClass}
                                            >
                                                <option value="">Todos</option>
                                                {estados.map((e) => (
                                                    <option key={e} value={e}>
                                                        {e === "ativo"
                                                            ? "Ativo"
                                                            : e === "suspenso"
                                                              ? "Suspenso"
                                                              : "Pendente"}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            Equipa
                                            <select
                                                value={filtroEquipa}
                                                onChange={(e) =>
                                                    setFiltroEquipa(
                                                        e.target.value,
                                                    )
                                                }
                                                className={selectClass}
                                            >
                                                <option value="">Todas</option>
                                                <option value="__sem__">
                                                    Sem equipa
                                                </option>
                                                {equipasUnicas.map((eq) => (
                                                    <option
                                                        key={eq.id}
                                                        value={eq.id}
                                                    >
                                                        {eq.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        Entrada
                                    </th>
                                    <th className="text-left px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                    >
                                        {/* Nome */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-violet-400">
                                                        {s.nome
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {s.nome}
                                                        {!s.user_id && (
                                                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                                🤖 Fictício
                                                            </span>
                                                        )}
                                                    </p>
                                                    {s.user_email && (
                                                        <p className="text-xs text-gray-400">
                                                            {s.user_email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Função */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${getFuncaoColor(s.funcao)}`}
                                            >
                                                {s.funcao}
                                            </span>
                                        </td>

                                        {/* Curso (só treinadores) */}
                                        <td className="px-6 py-4">
                                            {isTreinador(s.funcao) &&
                                            s.grau_id ? (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        {s.grau_nome}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {getEscaloesPermitidos(
                                                            s.grau_id,
                                                        ).join(", ")}
                                                    </p>
                                                </div>
                                            ) : isTreinador(s.funcao) ? (
                                                <span className="text-xs italic text-gray-400">
                                                    Sem curso
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    s.estado === "ativo"
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                        : s.estado ===
                                                            "suspenso"
                                                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                }`}
                                            >
                                                {s.estado === "ativo"
                                                    ? "Ativo"
                                                    : s.estado === "suspenso"
                                                      ? "Suspenso"
                                                      : "Pendente"}
                                            </span>
                                        </td>

                                        {/* Equipa */}
                                        <td className="px-6 py-4">
                                            {s.equipa_nome ? (
                                                <div>
                                                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {s.equipa_nome}
                                                    </p>
                                                    {s.equipa_escalao && (
                                                        <p className="text-xs text-gray-400">
                                                            {s.equipa_escalao}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-gray-400">
                                                    Sem equipa
                                                </span>
                                            )}
                                        </td>

                                        {/* Entrada */}
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                                            {s.created_at
                                                ? new Date(
                                                      s.created_at,
                                                  ).toLocaleDateString("pt-PT")
                                                : "—"}
                                        </td>

                                        {/* Ações */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <EditarMembroModal
                                                    membro={{
                                                        id: s.id,
                                                        nome: s.nome,
                                                        funcao: s.funcao,
                                                        equipaid: s.equipa_id,
                                                        userid: s.user_id,
                                                    }}
                                                    equipas={equipas}
                                                    users={users}
                                                />
                                                <RemoverMembroModal
                                                    id={s.id}
                                                    nome={s.nome}
                                                    isReal={!!s.user_id}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtrados.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-sm text-gray-400"
                                        >
                                            Nenhum resultado para os filtros
                                            selecionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {temFiltros && (
                        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                {filtrados.length} de {staff.length} membros
                            </p>
                            <button
                                onClick={() => {
                                    setFiltroFuncao("");
                                    setFiltroEstado("");
                                    setFiltroEquipa("");
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
