"use client";
import React, { useState } from "react";

type Membro = {
    id: number;
    nome: string;
    funcao: string;
    email: string;
    telefone: string;
    experiencia: string;
    contrato: string;
    desde: string;
    especialidade: string;
    disponivel: boolean;
};

export const staffInicial: Membro[] = [
    {
        id: 1,
        nome: "Ana Lopes",
        funcao: "Fisioterapeuta",
        email: "ana.lopes@teamaction.pt",
        telefone: "912 345 678",
        experiencia: "8 anos",
        contrato: "Efetivo",
        desde: "2019",
        especialidade: "Reabilitação desportiva",
        disponivel: true,
    },
    {
        id: 2,
        nome: "Pedro Almeida",
        funcao: "Treinador Adjunto",
        email: "pedro.almeida@teamaction.pt",
        telefone: "923 456 789",
        experiencia: "12 anos",
        contrato: "Efetivo",
        desde: "2017",
        especialidade: "Tática defensiva",
        disponivel: true,
    },
    {
        id: 3,
        nome: "Sara Rodrigues",
        funcao: "Nutricionista",
        email: "sara.rodrigues@teamaction.pt",
        telefone: "934 567 890",
        experiencia: "5 anos",
        contrato: "Parcial",
        desde: "2021",
        especialidade: "Nutrição desportiva de alta performance",
        disponivel: true,
    },
    {
        id: 4,
        nome: "Marco Ferreira",
        funcao: "Preparador Físico",
        email: "marco.ferreira@teamaction.pt",
        telefone: "945 678 901",
        experiencia: "10 anos",
        contrato: "Efetivo",
        desde: "2018",
        especialidade: "Força e condicionamento",
        disponivel: false,
    },
    {
        id: 5,
        nome: "Rita Sousa",
        funcao: "Médica Clínica",
        email: "rita.sousa@teamaction.pt",
        telefone: "956 789 012",
        experiencia: "15 anos",
        contrato: "Parcial",
        desde: "2020",
        especialidade: "Medicina desportiva",
        disponivel: true,
    },
    {
        id: 6,
        nome: "Hugo Martins",
        funcao: "Analista de Vídeo",
        email: "hugo.martins@teamaction.pt",
        telefone: "967 890 123",
        experiencia: "4 anos",
        contrato: "Efetivo",
        desde: "2022",
        especialidade: "Scout e análise tática",
        disponivel: true,
    },
];

const funcoesList = [
    "Treinador Adjunto",
    "Preparador Físico",
    "Fisioterapeuta",
    "Médica Clínica",
    "Nutricionista",
    "Analista de Vídeo",
];
const funcoesFiltro = ["Todas", ...funcoesList];
const contratosList = ["Efetivo", "Parcial"];

const funcaoCor: Record<string, string> = {
    "Treinador Adjunto":
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Preparador Físico":
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Fisioterapeuta:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "Médica Clínica":
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Nutricionista:
        "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
    "Analista de Vídeo":
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

const avatarCor: Record<string, string> = {
    "Treinador Adjunto":
        "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    "Preparador Físico":
        "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
    Fisioterapeuta:
        "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    "Médica Clínica":
        "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    Nutricionista:
        "bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300",
    "Analista de Vídeo":
        "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
};

const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition";

type ModalTipo = "ver" | "editar" | "criar";

const membroVazio: Omit<Membro, "id"> = {
    nome: "",
    funcao: "Treinador Adjunto",
    email: "",
    telefone: "",
    experiencia: "",
    contrato: "Efetivo",
    desde: "",
    especialidade: "",
    disponivel: true,
};

export default function EquipaTecnica() {
    const [staff, setStaff] = useState<Membro[]>(staffInicial);
    const [search, setSearch] = useState("");
    const [funcaoFiltro, setFuncaoFiltro] = useState("Todas");
    const [modalTipo, setModalTipo] = useState<ModalTipo | null>(null);
    const [membroModal, setMembroModal] = useState<Membro | null>(null);
    const [form, setForm] = useState<Omit<Membro, "id">>(membroVazio);
    const [nextId, setNextId] = useState(staffInicial.length + 1);

    const filtrados = staff.filter((s) => {
        const matchSearch =
            s.nome.toLowerCase().includes(search.toLowerCase()) ||
            s.funcao.toLowerCase().includes(search.toLowerCase());
        const matchFuncao =
            funcaoFiltro === "Todas" || s.funcao === funcaoFiltro;
        return matchSearch && matchFuncao;
    });

    function abrirVer(membro: Membro) {
        setMembroModal(membro);
        setModalTipo("ver");
    }
    function abrirEditar(membro: Membro) {
        setMembroModal(membro);
        setForm({ ...membro });
        setModalTipo("editar");
    }
    function abrirCriar() {
        setMembroModal(null);
        setForm({ ...membroVazio });
        setModalTipo("criar");
    }
    function fecharModal() {
        setModalTipo(null);
        setMembroModal(null);
    }

    function guardarEdicao() {
        if (!membroModal) return;
        setStaff((prev) =>
            prev.map((s) =>
                s.id === membroModal.id ? { ...form, id: membroModal.id } : s,
            ),
        );
        fecharModal();
    }
    function guardarNovo() {
        if (!form.nome.trim()) return;
        setStaff((prev) => [...prev, { ...form, id: nextId }]);
        setNextId((n) => n + 1);
        fecharModal();
    }
    function removerMembro(id: number) {
        if (!confirm("Remover membro da equipa técnica?")) return;
        setStaff((prev) => prev.filter((s) => s.id !== id));
        fecharModal();
    }

    const efetivos = staff.filter((s) => s.contrato === "Efetivo").length;
    const parciais = staff.filter((s) => s.contrato === "Parcial").length;

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">
            {/* ── MODAL ── */}
            {modalTipo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                {modalTipo === "criar" ? (
                                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                                        <span className="text-violet-600 dark:text-violet-400 text-lg font-bold">
                                            ＋
                                        </span>
                                    </div>
                                ) : (
                                    membroModal && (
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-base ${avatarCor[membroModal.funcao] ?? "bg-gray-100 text-gray-600"}`}
                                        >
                                            {membroModal.nome.charAt(0)}
                                        </div>
                                    )
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                        {modalTipo === "criar"
                                            ? "Novo Membro"
                                            : modalTipo === "editar"
                                              ? "Editar Membro"
                                              : membroModal?.nome}
                                    </h3>
                                    {(modalTipo === "ver" ||
                                        modalTipo === "editar") &&
                                        membroModal && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {membroModal.funcao}
                                            </p>
                                        )}
                                </div>
                            </div>
                            <button
                                onClick={fecharModal}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Corpo */}
                        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
                            {modalTipo === "ver" && membroModal && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${funcaoCor[membroModal.funcao] ?? "bg-gray-100 text-gray-600"}`}
                                        >
                                            {membroModal.funcao}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${membroModal.disponivel ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                                        >
                                            {membroModal.disponivel
                                                ? "● Disponível"
                                                : "● Indisponível"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                label: "Email",
                                                value: membroModal.email,
                                                full: true,
                                            },
                                            {
                                                label: "Telefone",
                                                value: membroModal.telefone,
                                            },
                                            {
                                                label: "Contrato",
                                                value: membroModal.contrato,
                                            },
                                            {
                                                label: "Experiência",
                                                value: membroModal.experiencia,
                                            },
                                            {
                                                label: "No clube desde",
                                                value: membroModal.desde,
                                            },
                                            {
                                                label: "Especialidade",
                                                value: membroModal.especialidade,
                                                full: true,
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 ${item.full ? "col-span-2" : ""}`}
                                            >
                                                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                    {item.label}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 break-words">
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(modalTipo === "editar" ||
                                modalTipo === "criar") && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Nome completo
                                            </label>
                                            <input
                                                className={inputClass}
                                                placeholder="Nome do membro"
                                                value={form.nome}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        nome: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Função
                                            </label>
                                            <select
                                                className={inputClass}
                                                value={form.funcao}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        funcao: e.target.value,
                                                    }))
                                                }
                                            >
                                                {funcoesList.map((f) => (
                                                    <option key={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Contrato
                                            </label>
                                            <select
                                                className={inputClass}
                                                value={form.contrato}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        contrato:
                                                            e.target.value,
                                                    }))
                                                }
                                            >
                                                {contratosList.map((c) => (
                                                    <option key={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Email
                                            </label>
                                            <input
                                                className={inputClass}
                                                type="email"
                                                placeholder="email@teamaction.pt"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        email: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Telefone
                                            </label>
                                            <input
                                                className={inputClass}
                                                placeholder="9XX XXX XXX"
                                                value={form.telefone}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        telefone:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Experiência
                                            </label>
                                            <input
                                                className={inputClass}
                                                placeholder="Ex: 5 anos"
                                                value={form.experiencia}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        experiencia:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                No clube desde
                                            </label>
                                            <input
                                                className={inputClass}
                                                placeholder="Ex: 2020"
                                                value={form.desde}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        desde: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Disponibilidade
                                            </label>
                                            <select
                                                className={inputClass}
                                                value={
                                                    form.disponivel
                                                        ? "sim"
                                                        : "não"
                                                }
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        disponivel:
                                                            e.target.value ===
                                                            "sim",
                                                    }))
                                                }
                                            >
                                                <option value="sim">
                                                    Disponível
                                                </option>
                                                <option value="não">
                                                    Indisponível
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                Especialidade
                                            </label>
                                            <input
                                                className={inputClass}
                                                placeholder="Área de especialização"
                                                value={form.especialidade}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        especialidade:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                            {modalTipo === "ver" && membroModal && (
                                <>
                                    <button
                                        onClick={() =>
                                            removerMembro(membroModal.id)
                                        }
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-all"
                                    >
                                        Remover
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={fecharModal}
                                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                        >
                                            Fechar
                                        </button>
                                        <button
                                            onClick={() =>
                                                abrirEditar(membroModal)
                                            }
                                            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 shadow transition-all flex items-center gap-1.5"
                                        >
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.914l-3 1 1-3a4 4 0 01.914-1.414z"
                                                />
                                            </svg>
                                            Editar
                                        </button>
                                    </div>
                                </>
                            )}
                            {modalTipo === "editar" && membroModal && (
                                <>
                                    <button
                                        onClick={() => abrirVer(membroModal)}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={guardarEdicao}
                                        disabled={!form.nome.trim()}
                                        className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-all"
                                    >
                                        Guardar alterações
                                    </button>
                                </>
                            )}
                            {modalTipo === "criar" && (
                                <>
                                    <button
                                        onClick={fecharModal}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={guardarNovo}
                                        disabled={!form.nome.trim()}
                                        className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-all flex items-center gap-1.5"
                                    >
                                        <span>＋</span> Adicionar Membro
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-violet-700 dark:text-violet-400 flex items-center gap-3">
                        <span>🧑‍💼</span> Equipa Técnica
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Seniores Masculinos · {staff.length} membros
                    </p>
                </div>
                <button
                    onClick={abrirCriar}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Adicionar Membro
                </button>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[
                    {
                        label: "Total",
                        value: staff.length,
                        color: "text-violet-600",
                        border: "border-violet-200 dark:border-violet-700",
                    },
                    {
                        label: "Contrato Efetivo",
                        value: efetivos,
                        color: "text-blue-600",
                        border: "border-blue-200 dark:border-blue-700",
                    },
                    {
                        label: "Contrato Parcial",
                        value: parciais,
                        color: "text-orange-600",
                        border: "border-orange-200 dark:border-orange-700",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border ${s.border} shadow-sm flex flex-col`}
                    >
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {s.label}
                        </span>
                        <span className={`text-3xl font-bold mt-1 ${s.color}`}>
                            {s.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Pesquisa e filtros */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Pesquisar membro..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[180px] px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <div className="flex flex-wrap gap-1.5">
                    {funcoesFiltro.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFuncaoFiltro(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                funcaoFiltro === f
                                    ? "bg-violet-600 text-white border-violet-600"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grelha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtrados.map((membro) => (
                    <div
                        key={membro.id}
                        onClick={() => abrirVer(membro)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold flex-shrink-0 group-hover:scale-105 transition-transform ${avatarCor[membro.funcao] ?? "bg-gray-100 text-gray-600"}`}
                            >
                                {membro.nome.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                    {membro.nome}
                                </div>
                                <span
                                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${funcaoCor[membro.funcao] ?? "bg-gray-100 text-gray-600"}`}
                                >
                                    {membro.funcao}
                                </span>
                            </div>
                            <span
                                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${membro.disponivel ? "bg-green-500" : "bg-red-400"}`}
                                title={
                                    membro.disponivel
                                        ? "Disponível"
                                        : "Indisponível"
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                                <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wide">
                                    Experiência
                                </div>
                                <div className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                                    {membro.experiencia}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                                <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wide">
                                    Contrato
                                </div>
                                <div className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                                    {membro.contrato}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate border-t border-gray-100 dark:border-gray-700 pt-3">
                            ✉️ {membro.email}
                        </div>
                    </div>
                ))}
                {filtrados.length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-400 dark:text-gray-600 text-sm">
                        Nenhum membro encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
