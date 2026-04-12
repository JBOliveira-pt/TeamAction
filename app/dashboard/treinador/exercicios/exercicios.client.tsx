// Componente cliente de exercicios (treinador).
"use client";
import React, { useState, useEffect, useMemo } from "react";

type Exercicio = {
    id: string;
    nome: string;
    descricao: string;
    categoria: string;
    duracao_min: number;
    nivel: string;
    created_at: string;
};

const CATEGORIAS = ["Técnico", "Tático", "Físico", "Misto"] as const;
const NIVEIS = ["Fácil", "Médio", "Intenso", "Difícil"] as const;
type Categoria = (typeof CATEGORIAS)[number];
type Nivel = (typeof NIVEIS)[number];

const CATEGORIA_COLORS: Record<Categoria, string> = {
    Técnico: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Tático: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Físico: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    Misto: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const NIVEL_COLORS: Record<Nivel, string> = {
    Fácil: "bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    Médio: "bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    Intenso:
        "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
    Difícil: "bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const CATEGORIA_ICONS: Record<Categoria, string> = {
    Técnico: "🎯",
    Tático: "🛡️",
    Físico: "💪",
    Misto: "🤾",
};

type FormState = {
    nome: string;
    descricao: string;
    categoria: Categoria;
    duracao_min: string | number;
    nivel: Nivel;
};

const FORM_VAZIO: FormState = {
    nome: "",
    descricao: "",
    categoria: "Técnico",
    duracao_min: "",
    nivel: "Fácil",
};

function CampoTexto({
    label,
    obrigatorio,
    erro,
    children,
}: {
    label: string;
    obrigatorio?: boolean;
    erro?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {label}
                {obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {erro && <p className="text-xs text-red-500">{erro}</p>}
        </div>
    );
}

const INPUT_CLASS =
    "w-full rounded-xl border px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all";
const INPUT_ERRO = "border-red-400";
const INPUT_OK = "border-gray-300 dark:border-gray-700";

function FormExercicio({
    form,
    setForm,
    erros,
    saving,
    onSubmit,
    onCancel,
    labelSubmit,
}: {
    form: FormState;
    setForm: React.Dispatch<React.SetStateAction<FormState>>;
    erros: Record<string, string>;
    saving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    labelSubmit: string;
}) {
    return (
        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
            {erros.geral && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">
                    {erros.geral}
                </p>
            )}

            <CampoTexto label="Nome" obrigatorio erro={erros.nome}>
                <input
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Remate em Suspensão"
                    className={`${INPUT_CLASS} ${erros.nome ? INPUT_ERRO : INPUT_OK}`}
                    value={form.nome}
                    onChange={(e) =>
                        setForm((v) => ({ ...v, nome: e.target.value }))
                    }
                />
                <p className="text-xs text-gray-400 text-right">
                    {form.nome.length}/100
                </p>
            </CampoTexto>

            <CampoTexto label="Descrição" obrigatorio erro={erros.descricao}>
                <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Descreva o objectivo e como executar o exercício"
                    className={`${INPUT_CLASS} resize-none ${erros.descricao ? INPUT_ERRO : INPUT_OK}`}
                    value={form.descricao}
                    onChange={(e) =>
                        setForm((v) => ({ ...v, descricao: e.target.value }))
                    }
                />
                <p className="text-xs text-gray-400 text-right">
                    {form.descricao.length}/500
                </p>
            </CampoTexto>

            <div className="grid grid-cols-2 gap-3">
                <CampoTexto
                    label="Categoria"
                    obrigatorio
                    erro={erros.categoria}
                >
                    <select
                        className={`${INPUT_CLASS} ${erros.categoria ? INPUT_ERRO : INPUT_OK}`}
                        value={form.categoria}
                        onChange={(e) =>
                            setForm((v) => ({
                                ...v,
                                categoria: e.target.value as Categoria,
                            }))
                        }
                    >
                        {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </CampoTexto>

                <CampoTexto label="Nível" obrigatorio erro={erros.nivel}>
                    <select
                        className={`${INPUT_CLASS} ${erros.nivel ? INPUT_ERRO : INPUT_OK}`}
                        value={form.nivel}
                        onChange={(e) =>
                            setForm((v) => ({
                                ...v,
                                nivel: e.target.value as Nivel,
                            }))
                        }
                    >
                        {NIVEIS.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </CampoTexto>
            </div>

            <CampoTexto
                label="Duração (minutos)"
                obrigatorio
                erro={erros.duracao_min}
            >
                <input
                    type="number"
                    min={5}
                    max={120}
                    placeholder="Ex: 15"
                    className={`${INPUT_CLASS} ${erros.duracao_min ? INPUT_ERRO : INPUT_OK}`}
                    value={form.duracao_min}
                    onChange={(e) =>
                        setForm((v) => ({ ...v, duracao_min: e.target.value }))
                    }
                />
                {!erros.duracao_min && (
                    <p className="text-xs text-gray-400">
                        Entre 5 e 120 minutos
                    </p>
                )}
            </CampoTexto>

            <div className="flex gap-2 pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                    {saving ? "A guardar..." : labelSubmit}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}

export default function Exercicios() {
    const [exercicios, setExercicios] = useState<Exercicio[]>([]);
    const [loading, setLoading] = useState(true);

    const [pesquisa, setPesquisa] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState<"Todos" | Categoria>(
        "Todos",
    );

    // Modal criar
    const [showCriar, setShowCriar] = useState(false);
    const [formCriar, setFormCriar] = useState<FormState>(FORM_VAZIO);
    const [errosCriar, setErrosCriar] = useState<Record<string, string>>({});
    const [savingCriar, setSavingCriar] = useState(false);

    // Modal editar
    const [exercicioEdit, setExercicioEdit] = useState<Exercicio | null>(null);
    const [formEdit, setFormEdit] = useState<FormState>(FORM_VAZIO);
    const [errosEdit, setErrosEdit] = useState<Record<string, string>>({});
    const [savingEdit, setSavingEdit] = useState(false);

    // Buscar exercícios
    useEffect(() => {
        fetch("/api/exercicios")
            .then((r) => r.json())
            .then((data) => {
                setExercicios(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const exerciciosFiltrados = useMemo(() => {
        return exercicios.filter((e) => {
            const matchCategoria =
                filtroCategoria === "Todos" || e.categoria === filtroCategoria;
            const matchPesquisa =
                pesquisa === "" ||
                e.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
                e.descricao.toLowerCase().includes(pesquisa.toLowerCase());
            return matchCategoria && matchPesquisa;
        });
    }, [exercicios, filtroCategoria, pesquisa]);

    // Validação partilhada
    function validar(form: FormState) {
        const e: Record<string, string> = {};
        if (!form.nome.trim() || form.nome.trim().length < 3)
            e.nome = "Nome deve ter pelo menos 3 caracteres.";
        if (form.nome.trim().length > 100)
            e.nome = "Nome não pode ter mais de 100 caracteres.";
        if (!form.descricao.trim()) e.descricao = "Descrição obrigatória.";
        if (form.descricao.trim().length > 500)
            e.descricao = "Descrição não pode ter mais de 500 caracteres.";
        const dur = Number(form.duracao_min);
        if (!form.duracao_min || isNaN(dur) || dur < 5 || dur > 120)
            e.duracao_min = "Duração entre 5 e 120 minutos.";
        return e;
    }

    // Criar
    async function handleCriar(e: React.FormEvent) {
        e.preventDefault();
        const erros = validar(formCriar);
        if (Object.keys(erros).length > 0) {
            setErrosCriar(erros);
            return;
        }
        setErrosCriar({});
        setSavingCriar(true);
        try {
            const res = await fetch("/api/exercicios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formCriar,
                    duracao_min: Number(formCriar.duracao_min),
                }),
            });
            if (res.ok) {
                const novo: Exercicio = await res.json();
                setExercicios((prev) => [novo, ...prev]);
                setShowCriar(false);
                setFormCriar(FORM_VAZIO);
            } else {
                setErrosCriar({ geral: await res.text() });
            }
        } finally {
            setSavingCriar(false);
        }
    }

    // Editar
    function abrirEditar(ex: Exercicio) {
        setExercicioEdit(ex);
        setFormEdit({
            nome: ex.nome,
            descricao: ex.descricao,
            categoria: ex.categoria as Categoria,
            duracao_min: ex.duracao_min,
            nivel: ex.nivel as Nivel,
        });
        setErrosEdit({});
    }

    async function handleEditar(e: React.FormEvent) {
        e.preventDefault();
        if (!exercicioEdit) return;
        const erros = validar(formEdit);
        if (Object.keys(erros).length > 0) {
            setErrosEdit(erros);
            return;
        }
        setErrosEdit({});
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/exercicios/${exercicioEdit.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formEdit,
                    duracao_min: Number(formEdit.duracao_min),
                }),
            });
            if (res.ok) {
                setExercicios((prev) =>
                    prev.map((ex) =>
                        ex.id === exercicioEdit.id
                            ? {
                                  ...ex,
                                  ...formEdit,
                                  duracao_min: Number(formEdit.duracao_min),
                              }
                            : ex,
                    ),
                );
                setExercicioEdit(null);
            } else {
                setErrosEdit({ geral: await res.text() });
            }
        } finally {
            setSavingEdit(false);
        }
    }

    async function eliminarExercicio(id: string) {
        await fetch(`/api/exercicios/${id}`, { method: "DELETE" });
        setExercicios((prev) => prev.filter((ex) => ex.id !== id));
        setExercicioEdit(null);
    }

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            {/* ── MODAL CRIAR ───────────────────────────────────────────── */}
            {showCriar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🤾</span>
                                <div>
                                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                        Criar Exercício
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Adicione um exercício à biblioteca
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCriar(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xl font-bold transition-all"
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>
                        <FormExercicio
                            form={formCriar}
                            setForm={setFormCriar}
                            erros={errosCriar}
                            saving={savingCriar}
                            onSubmit={handleCriar}
                            onCancel={() => setShowCriar(false)}
                            labelSubmit="Guardar Exercício"
                        />
                    </div>
                </div>
            )}

            {/* ── MODAL EDITAR ──────────────────────────────────────────── */}
            {exercicioEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✏️</span>
                                <div>
                                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                        Editar Exercício
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                        {exercicioEdit.nome}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setExercicioEdit(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xl font-bold transition-all"
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>
                        <FormExercicio
                            form={formEdit}
                            setForm={setFormEdit}
                            erros={errosEdit}
                            saving={savingEdit}
                            onSubmit={handleEditar}
                            onCancel={() => setExercicioEdit(null)}
                            labelSubmit="Guardar Alterações"
                        />
                        <div className="px-6 pb-6">
                            <button
                                onClick={() =>
                                    eliminarExercicio(exercicioEdit.id)
                                }
                                className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl transition-all text-sm border border-red-200 dark:border-red-800"
                            >
                                Eliminar Exercício
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CABEÇALHO ─────────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-400 flex items-center gap-3">
                        <span>🤾</span> Exercícios
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Biblioteca de exercícios · {exercicios.length} exercício
                        {exercicios.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
                    onClick={() => {
                        setFormCriar(FORM_VAZIO);
                        setErrosCriar({});
                        setShowCriar(true);
                    }}
                >
                    <span className="text-xl">＋</span> Criar Exercício
                </button>
            </div>

            {/* ── FILTROS ───────────────────────────────────────────────── */}
            <div className="mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center">
                <input
                    type="text"
                    placeholder="Pesquisar exercícios..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    className="w-full md:w-72 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 placeholder:text-gray-400"
                />
                <div className="flex flex-wrap gap-2">
                    {(["Todos", ...CATEGORIAS] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() =>
                                setFiltroCategoria(cat as "Todos" | Categoria)
                            }
                            className={`px-3 py-1.5 rounded-lg font-bold text-sm border transition-all ${
                                filtroCategoria === cat
                                    ? "bg-teal-600 text-white border-teal-600"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── GRELHA ────────────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-16 text-gray-400">
                    A carregar exercícios...
                </div>
            ) : exerciciosFiltrados.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    {exercicios.length === 0
                        ? "Ainda não há exercícios. Crie o primeiro!"
                        : "Nenhum exercício encontrado para os filtros aplicados."}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {exerciciosFiltrados.map((ex) => (
                        <div
                            key={ex.id}
                            onClick={() => abrirEditar(ex)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-2xl shrink-0">
                                        {CATEGORIA_ICONS[
                                            ex.categoria as Categoria
                                        ] ?? "🤾"}
                                    </span>
                                    <span className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">
                                        {ex.nome}
                                    </span>
                                </div>
                                <span
                                    className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${CATEGORIA_COLORS[ex.categoria as Categoria] ?? ""}`}
                                >
                                    {ex.categoria}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                                {ex.descricao}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ⏱ {ex.duracao_min} min
                                </span>
                                <span
                                    className={`px-2 py-1 rounded-lg text-xs font-bold ${NIVEL_COLORS[ex.nivel as Nivel] ?? ""}`}
                                >
                                    {ex.nivel}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
