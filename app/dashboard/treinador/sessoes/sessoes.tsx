"use client";
import React, { useState, useEffect, useMemo } from "react";

type Sessao = {
    id: string;
    data: string;
    tipo: string;
    duracao_min: number;
    observacoes: string | null;
    equipa_nome: string | null;
    created_at: string;
};

type Equipa = { id: string; nome: string };

const TIPOS = ["Tático", "Físico", "Técnico", "Misto"] as const;
type Tipo = (typeof TIPOS)[number];

const TIPO_COLORS: Record<Tipo, string> = {
    "Tático":  "bg-cyan-600",
    "Físico":  "bg-yellow-500",
    "Técnico": "bg-indigo-600",
    "Misto":   "bg-violet-600",
};

function formatData(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function hojeISO() {
    return new Date().toISOString().slice(0, 10);
}

export default function Sessoes({ equipas }: { equipas: Equipa[] }) {
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [loading, setLoading] = useState(true);

    const [filtroTipo, setFiltroTipo] = useState<"Todas" | Tipo>("Todas");

    // Modal Nova Sessão
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [erros, setErros] = useState<Record<string, string>>({});
    const [form, setForm] = useState({
        data: hojeISO(),
        tipo: "Tático" as Tipo,
        duracao_min: "" as string | number,
        observacoes: "",
        equipa_id: "",
    });

    // Modal Ver/Eliminar
    const [sessaoView, setSessaoView] = useState<Sessao | null>(null);

    // Fetch sessoes do Neon
    useEffect(() => {
        fetch("/api/sessoes")
            .then((r) => r.json())
            .then((data) => { setSessoes(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const sessoesFiltradas = useMemo(
        () => filtroTipo === "Todas" ? sessoes : sessoes.filter((s) => s.tipo === filtroTipo),
        [sessoes, filtroTipo],
    );

    // Estatísticas
    const stats = useMemo(() => {
        const total = sessoes.length;
        const horas = sessoes.reduce((acc, s) => acc + s.duracao_min, 0);
        return { total, horas: Math.round(horas / 60) };
    }, [sessoes]);

    // Validação
    function validar() {
        const e: Record<string, string> = {};
        if (!form.data) e.data = "Data obrigatória.";
        if (!form.tipo) e.tipo = "Tipo obrigatório.";
        const dur = Number(form.duracao_min);
        if (!form.duracao_min || isNaN(dur) || dur < 15 || dur > 300)
            e.duracao_min = "Duração entre 15 e 300 minutos.";
        return e;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errosValidacao = validar();
        if (Object.keys(errosValidacao).length > 0) { setErros(errosValidacao); return; }
        setErros({});
        setSaving(true);
        try {
            const res = await fetch("/api/sessoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    duracao_min: Number(form.duracao_min),
                    equipa_id: form.equipa_id || undefined,
                }),
            });
            if (res.ok) {
                const nova: Sessao = await res.json();
                // equipa_nome não vem no POST, buscar do array de equipas
                const equipaNome = equipas.find((eq) => eq.id === form.equipa_id)?.nome ?? null;
                setSessoes((prev) => [{ ...nova, equipa_nome: equipaNome }, ...prev]);
                setShowModal(false);
                setForm({ data: hojeISO(), tipo: "Tático", duracao_min: "", observacoes: "", equipa_id: "" });
            } else {
                const msg = await res.text();
                setErros({ geral: msg });
            }
        } finally {
            setSaving(false);
        }
    }

    async function eliminarSessao(id: string) {
        await fetch(`/api/sessoes/${id}`, { method: "DELETE" });
        setSessoes((prev) => prev.filter((s) => s.id !== id));
        setSessaoView(null);
    }

    function abrirModal() {
        setForm({ data: hojeISO(), tipo: "Tático", duracao_min: "", observacoes: "", equipa_id: "" });
        setErros({});
        setShowModal(true);
    }

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">

            {/* ── MODAL VER SESSÃO ──────────────────────────────────────── */}
            {sessaoView && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🏋️</span>
                                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                    Detalhe da Sessão
                                </h3>
                            </div>
                            <button
                                onClick={() => setSessaoView(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xl font-bold transition-all"
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Data</p>
                                    <p className="font-bold text-blue-600">{formatData(sessaoView.data)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Tipo</p>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${TIPO_COLORS[sessaoView.tipo as Tipo] ?? "bg-gray-500"}`}>
                                        {sessaoView.tipo}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Duração</p>
                                    <p className="font-semibold">{sessaoView.duracao_min} min</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Equipa</p>
                                    <p className="font-semibold">{sessaoView.equipa_nome ?? "—"}</p>
                                </div>
                            </div>
                            {sessaoView.observacoes && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Observações</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                        {sessaoView.observacoes}
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={() => eliminarSessao(sessaoView.id)}
                                className="w-full mt-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl transition-all text-sm border border-red-200 dark:border-red-800"
                            >
                                Eliminar Sessão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL NOVA SESSÃO ─────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📝</span>
                                <div>
                                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Nova Sessão</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Registe uma sessão de treino</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xl font-bold transition-all"
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                            {erros.geral && (
                                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">
                                    {erros.geral}
                                </p>
                            )}

                            {/* Data */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Data <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    className={`w-full rounded-xl border px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all ${erros.data ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}
                                    value={form.data}
                                    onChange={(e) => setForm((v) => ({ ...v, data: e.target.value }))}
                                />
                                {erros.data && <p className="text-xs text-red-500">{erros.data}</p>}
                            </div>

                            {/* Tipo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Tipo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`w-full rounded-xl border px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all ${erros.tipo ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}
                                    value={form.tipo}
                                    onChange={(e) => setForm((v) => ({ ...v, tipo: e.target.value as Tipo }))}
                                >
                                    {TIPOS.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                {erros.tipo && <p className="text-xs text-red-500">{erros.tipo}</p>}
                            </div>

                            {/* Duração */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Duração (minutos) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={15}
                                    max={300}
                                    placeholder="Ex: 90"
                                    className={`w-full rounded-xl border px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all ${erros.duracao_min ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}
                                    value={form.duracao_min}
                                    onChange={(e) => setForm((v) => ({ ...v, duracao_min: e.target.value }))}
                                />
                                {erros.duracao_min
                                    ? <p className="text-xs text-red-500">{erros.duracao_min}</p>
                                    : <p className="text-xs text-gray-400">Entre 15 e 300 minutos</p>
                                }
                            </div>

                            {/* Equipa (opcional) */}
                            {equipas.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Equipa <span className="text-gray-400 font-normal">(opcional)</span>
                                    </label>
                                    <select
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
                                        value={form.equipa_id}
                                        onChange={(e) => setForm((v) => ({ ...v, equipa_id: e.target.value }))}
                                    >
                                        <option value="">— Sem equipa —</option>
                                        {equipas.map((eq) => (
                                            <option key={eq.id} value={eq.id}>{eq.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Observações */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Observações <span className="text-gray-400 font-normal">(opcional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Ex: Foco na transição defensiva"
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all resize-none"
                                    value={form.observacoes}
                                    onChange={(e) => setForm((v) => ({ ...v, observacoes: e.target.value }))}
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-400 text-right">{form.observacoes.length}/500</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all"
                                >
                                    {saving ? "A guardar..." : "Criar Sessão"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── CABEÇALHO ─────────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-3">
                        <span>🏋️</span> Sessões de Treino
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Registo e gestão de treinos da época
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow transition-all text-base flex items-center gap-2"
                    onClick={abrirModal}
                >
                    <span className="text-xl">＋</span> Nova Sessão
                </button>
            </div>

            {/* ── ESTATÍSTICAS ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Sessões</span>
                    <span className="text-3xl font-bold text-blue-600">{stats.total}</span>
                    <span className="text-xs text-gray-400">Esta época</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Horas de Treino</span>
                    <span className="text-3xl font-bold text-emerald-500">{stats.horas}h</span>
                    <span className="text-xs text-gray-400">Total acumulado</span>
                </div>
                <div className="col-span-2 md:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Última Sessão</span>
                    <span className="text-xl font-bold text-cyan-600">
                        {sessoes.length > 0 ? formatData(sessoes[0].data) : "—"}
                    </span>
                    <span className="text-xs text-gray-400">
                        {sessoes.length > 0 ? sessoes[0].tipo : "Sem registos"}
                    </span>
                </div>
            </div>

            {/* ── FILTROS ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(["Todas", ...TIPOS] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setFiltroTipo(t as "Todas" | Tipo)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                            filtroTipo === t
                                ? "bg-cyan-600 text-white border-cyan-600"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* ── TABELA ────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">A carregar sessões...</div>
                ) : sessoesFiltradas.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        {filtroTipo === "Todas" ? "Ainda não há sessões registadas." : `Sem sessões do tipo "${filtroTipo}".`}
                    </div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-900">
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Data</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duração</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Equipa</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Observações</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {sessoesFiltradas.map((s) => (
                                <tr key={s.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-3 font-bold text-blue-600 whitespace-nowrap">
                                        {formatData(s.data)}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-lg font-bold text-xs text-white ${TIPO_COLORS[s.tipo as Tipo] ?? "bg-gray-500"}`}>
                                            {s.tipo}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300">
                                        {s.duracao_min} min
                                    </td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400">
                                        {s.equipa_nome ?? "—"}
                                    </td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {s.observacoes ?? "—"}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            className="bg-gray-100 dark:bg-gray-700 text-blue-600 font-bold px-4 py-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all text-xs"
                                            onClick={() => setSessaoView(s)}
                                        >
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
