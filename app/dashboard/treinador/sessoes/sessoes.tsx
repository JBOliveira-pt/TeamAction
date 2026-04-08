"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";

type Sessao = {
    id: string;
    data: string;
    hora: string;
    tipo: string;
    duracao_min: number;
    local: string | null;
    notas: string | null;
    equipa_id: string | null;
    equipa_nome: string | null;
    criado_por_nome: string | null;
    created_at: string;
};

type Equipa = { id: string; nome: string };
type Atleta = { id: string; nome: string; numero_camisola: number | null; posicao: string | null };
type Estado = "P" | "F" | "J";
type LinhaAssid = { atleta_id: string; estado: Estado; comentario: string };
type Tab = "detalhes" | "editar" | "assiduidade";

const ESTADO_COR_ATIVO: Record<Estado, string> = {
    P: "bg-green-500 text-white border-transparent",
    F: "bg-red-500 text-white border-transparent",
    J: "bg-yellow-400 text-gray-900 border-transparent",
};
const ESTADO_COR_INATIVO = "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600";

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

const FORM_VAZIO = {
    data: hojeISO(),
    hora: "",
    tipo: "Tático" as Tipo,
    duracao_min: "" as string | number,
    local: "",
    notas: "",
    equipa_id: "",
};

export default function Sessoes({ equipas, autoOpenModal = false }: { equipas: Equipa[]; autoOpenModal?: boolean }) {
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<"Todas" | Tipo>("Todas");

    // ── Modal Nova Sessão ──
    const [showModal, setShowModal] = useState(autoOpenModal);
    const [saving, setSaving] = useState(false);
    const [erros, setErros] = useState<Record<string, string>>({});
    const [form, setForm] = useState(FORM_VAZIO);

    // ── Modal detalhe/editar/assiduidade ──
    const [sessaoAberta, setSessaoAberta] = useState<Sessao | null>(null);
    const [tab, setTab] = useState<Tab>("detalhes");

    // Edit state (dentro do modal)
    const [editForm, setEditForm] = useState(FORM_VAZIO);
    const [editSaving, setEditSaving] = useState(false);
    const [editErros, setEditErros] = useState<Record<string, string>>({});

    // Assiduidade state
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [assid, setAssid] = useState<LinhaAssid[]>([]);
    const [loadingAssid, setLoadingAssid] = useState(false);
    const [savingAssid, setSavingAssid] = useState(false);
    const [assidSaved, setAssidSaved] = useState(false);
    const [erroAssid, setErroAssid] = useState("");

    // Toast
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    function showToast(msg: string, ok = true) {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    }

    // Fetch sessões
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

    const stats = useMemo(() => {
        const total = sessoes.length;
        const horas = sessoes.reduce((acc, s) => acc + (s.duracao_min ?? 0), 0);
        return { total, horas: Math.round(horas / 60) };
    }, [sessoes]);

    // ── Abrir modal de detalhe ──
    function abrirSessao(s: Sessao, t: Tab = "detalhes") {
        setSessaoAberta(s);
        setTab(t);
        setEditErros({});
        setEditForm({
            data: s.data?.slice(0, 10) ?? "",
            hora: s.hora?.slice(0, 5) ?? "",
            tipo: (s.tipo as Tipo) ?? "Tático",
            duracao_min: s.duracao_min ?? "",
            local: s.local ?? "",
            notas: s.notas ?? "",
            equipa_id: s.equipa_id ?? "",
        });
        // fetch assiduidade em background
        fetchAssid(s.id);
    }

    function fecharSessao() {
        setSessaoAberta(null);
        setAssid([]);
        setAtletas([]);
        setErroAssid("");
        setAssidSaved(false);
    }

    // ── Fetch assiduidade ──
    const fetchAssid = useCallback((sessaoId: string) => {
        setLoadingAssid(true);
        setErroAssid("");
        fetch(`/api/assiduidade?sessao_id=${sessaoId}`)
            .then(async (r) => {
                if (!r.ok) throw new Error(`Erro ${r.status}`);
                return r.json() as Promise<{ atletas: Atleta[]; registos: { atleta_id: string; estado: string; comentario: string | null }[] }>;
            })
            .then((d) => {
                const lista = Array.isArray(d?.atletas) ? d.atletas : [];
                const regs  = Array.isArray(d?.registos) ? d.registos : [];
                setAtletas(lista);
                setAssid(lista.map((a) => {
                    const reg = regs.find((r) => r.atleta_id === a.id);
                    return { atleta_id: a.id, estado: (reg?.estado ?? "P") as Estado, comentario: reg?.comentario ?? "" };
                }));
            })
            .catch(() => setErroAssid("Não foi possível carregar os atletas."))
            .finally(() => setLoadingAssid(false));
    }, []);

    async function guardarAssid() {
        if (!sessaoAberta) return;
        setSavingAssid(true);
        setErroAssid("");
        try {
            const res = await fetch("/api/assiduidade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessao_id: sessaoAberta.id, registos: assid }),
            });
            if (!res.ok) throw new Error();
            setAssidSaved(true);
            setTimeout(() => setAssidSaved(false), 2500);
            showToast("Assiduidade guardada!");
        } catch {
            setErroAssid("Erro ao guardar. Tente novamente.");
        } finally {
            setSavingAssid(false);
        }
    }

    // ── Validação ──
    function validarForm(f: typeof FORM_VAZIO) {
        const e: Record<string, string> = {};
        if (!f.data) e.data = "Data obrigatória.";
        if (!f.hora) e.hora = "Hora obrigatória.";
        if (!f.tipo) e.tipo = "Tipo obrigatório.";
        const dur = Number(f.duracao_min);
        if (!f.duracao_min || isNaN(dur) || dur < 15 || dur > 300)
            e.duracao_min = "Duração entre 15 e 300 minutos.";
        return e;
    }

    // ── Criar sessão ──
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errosV = validarForm(form);
        if (Object.keys(errosV).length > 0) { setErros(errosV); return; }
        setErros({});
        setSaving(true);
        try {
            const res = await fetch("/api/sessoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: form.data,
                    hora: form.hora,
                    tipo: form.tipo,
                    duracao_min: Number(form.duracao_min),
                    local: form.local || undefined,
                    notas: form.notas || undefined,
                    equipa_id: form.equipa_id || undefined,
                }),
            });
            if (res.ok) {
                const nova: Sessao = await res.json();
                const equipaNome = equipas.find((eq) => eq.id === form.equipa_id)?.nome ?? null;
                setSessoes((prev) => [{ ...nova, equipa_nome: equipaNome, criado_por_nome: null }, ...prev]);
                setShowModal(false);
                setForm({ ...FORM_VAZIO, data: hojeISO() });
                showToast("Sessão criada com sucesso!");
            } else {
                const msg = await res.text();
                setErros({ geral: msg });
                showToast(msg || "Erro ao criar sessão.", false);
            }
        } catch {
            showToast("Erro de ligação. Tente novamente.", false);
        } finally {
            setSaving(false);
        }
    }

    // ── Editar sessão ──
    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!sessaoAberta) return;
        const errosV = validarForm(editForm);
        if (Object.keys(errosV).length > 0) { setEditErros(errosV); return; }
        setEditErros({});
        setEditSaving(true);
        try {
            const res = await fetch(`/api/sessoes/${sessaoAberta.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: editForm.data,
                    hora: editForm.hora,
                    tipo: editForm.tipo,
                    duracao_min: Number(editForm.duracao_min),
                    local: editForm.local || undefined,
                    notas: editForm.notas || undefined,
                    equipa_id: editForm.equipa_id || undefined,
                }),
            });
            if (res.ok) {
                const atualizada = await res.json() as Sessao;
                const equipaNome = equipas.find((eq) => eq.id === editForm.equipa_id)?.nome ?? null;
                const sessaoAtualizada: Sessao = {
                    ...sessaoAberta,
                    ...atualizada,
                    equipa_nome: equipaNome,
                };
                setSessoes((prev) => prev.map((s) => s.id === sessaoAberta.id ? sessaoAtualizada : s));
                setSessaoAberta(sessaoAtualizada);
                setTab("detalhes");
                showToast("Sessão atualizada!");
            } else {
                const msg = await res.text();
                setEditErros({ geral: msg });
                showToast(msg || "Erro ao guardar.", false);
            }
        } catch {
            showToast("Erro de ligação. Tente novamente.", false);
        } finally {
            setEditSaving(false);
        }
    }

    // ── Eliminar sessão ──
    async function eliminarSessao(id: string) {
        await fetch(`/api/sessoes/${id}`, { method: "DELETE" });
        setSessoes((prev) => prev.filter((s) => s.id !== id));
        fecharSessao();
        showToast("Sessão eliminada.");
    }

    // ── Campos de formulário (reutilizável) ──
    function FormCampos({
        f, setF, errs, disabled = false,
    }: {
        f: typeof FORM_VAZIO;
        setF: (fn: (v: typeof FORM_VAZIO) => typeof FORM_VAZIO) => void;
        errs: Record<string, string>;
        disabled?: boolean;
    }) {
        const inputCls = (campo: string) =>
            `w-full rounded-xl border px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none ${errs[campo] ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`;

        return (
            <>
                {errs.geral && (
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{errs.geral}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Data <span className="text-red-500">*</span></label>
                        <input type="date" disabled={disabled} className={inputCls("data")} value={f.data} onChange={(e) => setF((v) => ({ ...v, data: e.target.value }))} />
                        {errs.data && <p className="text-xs text-red-500">{errs.data}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Hora <span className="text-red-500">*</span></label>
                        <input type="time" disabled={disabled} className={inputCls("hora")} value={f.hora} onChange={(e) => setF((v) => ({ ...v, hora: e.target.value }))} />
                        {errs.hora && <p className="text-xs text-red-500">{errs.hora}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Tipo <span className="text-red-500">*</span></label>
                        <select disabled={disabled} className={inputCls("tipo")} value={f.tipo} onChange={(e) => setF((v) => ({ ...v, tipo: e.target.value as Tipo }))}>
                            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Duração (min) <span className="text-red-500">*</span></label>
                        <input type="number" min={15} max={300} placeholder="90" disabled={disabled} className={inputCls("duracao_min")} value={f.duracao_min} onChange={(e) => setF((v) => ({ ...v, duracao_min: e.target.value }))} />
                        {errs.duracao_min && <p className="text-xs text-red-500">{errs.duracao_min}</p>}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Local <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                    <input type="text" placeholder="Ex: Pavilhão Municipal" disabled={disabled} className={inputCls("local")} value={f.local} onChange={(e) => setF((v) => ({ ...v, local: e.target.value }))} maxLength={200} />
                </div>
                {equipas.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Equipa <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                        <select disabled={disabled} className={inputCls("equipa_id")} value={f.equipa_id} onChange={(e) => setF((v) => ({ ...v, equipa_id: e.target.value }))}>
                            <option value="">— Sem equipa —</option>
                            {equipas.map((eq) => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
                        </select>
                    </div>
                )}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Notas <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                    <textarea rows={3} disabled={disabled} placeholder="Ex: Foco na transição defensiva" className={`${inputCls("notas")} resize-none`} value={f.notas} onChange={(e) => setF((v) => ({ ...v, notas: e.target.value }))} maxLength={500} />
                    <p className="text-xs text-gray-400 text-right">{f.notas.length}/500</p>
                </div>
            </>
        );
    }

    return (
        <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">

            {/* ── TOAST ─────────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
                    {toast.msg}
                </div>
            )}

            {/* ── MODAL NOVA SESSÃO ─────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📝</span>
                                <div>
                                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Nova Sessão</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Registe uma sessão de treino</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                            <FormCampos f={form} setF={setForm} errs={erros} />
                            <div className="flex gap-2 pt-1">
                                <button type="submit" disabled={saving} className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all text-sm">
                                    {saving ? "A guardar..." : "Criar Sessão"}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all text-sm">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL DETALHE / EDITAR / ASSIDUIDADE ─────────────────── */}
            {sessaoAberta && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                                    {formatData(sessaoAberta.data)} · {sessaoAberta.hora?.slice(0, 5)}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white mr-1 ${TIPO_COLORS[sessaoAberta.tipo as Tipo] ?? "bg-gray-500"}`}>{sessaoAberta.tipo}</span>
                                    {sessaoAberta.duracao_min} min {sessaoAberta.local ? `· ${sessaoAberta.local}` : ""}
                                </p>
                            </div>
                            <button onClick={fecharSessao} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold shrink-0">×</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
                            {(["detalhes", "editar", "assiduidade"] as Tab[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-all border-b-2 ${tab === t ? "border-cyan-500 text-cyan-600 dark:text-cyan-400" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                                >
                                    {t === "detalhes" ? "Detalhes" : t === "editar" ? "Editar" : "Assiduidade"}
                                </button>
                            ))}
                        </div>

                        {/* Tab: Detalhes */}
                        {tab === "detalhes" && (
                            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Data</p>
                                        <p className="font-bold text-blue-600">{formatData(sessaoAberta.data)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Hora</p>
                                        <p className="font-bold text-blue-600">{sessaoAberta.hora?.slice(0, 5) ?? "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Tipo</p>
                                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${TIPO_COLORS[sessaoAberta.tipo as Tipo] ?? "bg-gray-500"}`}>{sessaoAberta.tipo}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Duração</p>
                                        <p className="font-semibold">{sessaoAberta.duracao_min} min</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Equipa</p>
                                        <p className="font-semibold">{sessaoAberta.equipa_nome ?? "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Local</p>
                                        <p className="font-semibold">{sessaoAberta.local ?? "—"}</p>
                                    </div>
                                </div>
                                {sessaoAberta.notas && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Notas</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">{sessaoAberta.notas}</p>
                                    </div>
                                )}
                                {sessaoAberta.criado_por_nome && (
                                    <p className="text-xs text-gray-400">Criado por {sessaoAberta.criado_por_nome}</p>
                                )}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setTab("editar")}
                                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                                    >
                                        Editar Sessão
                                    </button>
                                    <button
                                        onClick={() => eliminarSessao(sessaoAberta.id)}
                                        className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl transition-all text-sm border border-red-200 dark:border-red-800"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab: Editar */}
                        {tab === "editar" && (
                            <form onSubmit={handleEdit} className="p-5 flex flex-col gap-4 overflow-y-auto">
                                <FormCampos f={editForm} setF={setEditForm} errs={editErros} />
                                <div className="flex gap-2 pt-1">
                                    <button type="submit" disabled={editSaving} className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all text-sm">
                                        {editSaving ? "A guardar..." : "Guardar Alterações"}
                                    </button>
                                    <button type="button" onClick={() => setTab("detalhes")} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all text-sm">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tab: Assiduidade */}
                        {tab === "assiduidade" && (
                            <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                                {/* Legenda */}
                                <div className="flex gap-3 text-xs font-semibold">
                                    <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-white text-xs">P</span> Presente</span>
                                    <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-white text-xs">F</span> Falta</span>
                                    <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-yellow-400 flex items-center justify-center text-gray-900 text-xs">J</span> Justificado</span>
                                </div>

                                {loadingAssid ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">A carregar atletas...</div>
                                ) : erroAssid && atletas.length === 0 ? (
                                    <div className="text-center py-8 text-red-500 text-sm">{erroAssid}</div>
                                ) : atletas.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">Sem atletas ativos na organização.</div>
                                ) : (
                                    <>
                                        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                                            {atletas.map((a) => {
                                                const estado = assid.find((l) => l.atleta_id === a.id)?.estado ?? "P";
                                                return (
                                                    <div key={a.id} className="flex items-center justify-between py-2.5 gap-3">
                                                        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">
                                                            {a.numero_camisola != null && <span className="text-xs text-gray-400 mr-1.5">#{a.numero_camisola}</span>}
                                                            {a.nome}
                                                        </span>
                                                        <div className="flex gap-1 shrink-0">
                                                            {(["P", "F", "J"] as Estado[]).map((est) => (
                                                                <button
                                                                    key={est}
                                                                    onClick={() => setAssid((prev) => prev.map((l) => l.atleta_id === a.id ? { ...l, estado: est } : l))}
                                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${estado === est ? ESTADO_COR_ATIVO[est] : ESTADO_COR_INATIVO}`}
                                                                >
                                                                    {est}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {erroAssid && <p className="text-xs text-red-500 text-center">{erroAssid}</p>}
                                        <button
                                            onClick={guardarAssid}
                                            disabled={savingAssid}
                                            className={`w-full font-bold py-2.5 rounded-xl transition-all text-sm ${assidSaved ? "bg-green-500 text-white" : "bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white"}`}
                                        >
                                            {assidSaved ? "✓ Guardado!" : savingAssid ? "A guardar..." : "Guardar Assiduidade"}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── CABEÇALHO ─────────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-3">
                        <span>🏋️</span> Sessões de Treino
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registo e gestão de treinos da época</p>
                </div>
                <button
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow transition-all text-sm flex items-center gap-2"
                    onClick={() => { setForm({ ...FORM_VAZIO, data: hojeISO() }); setErros({}); setShowModal(true); }}
                >
                    <span className="text-lg">＋</span> Nova Sessão
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
                    <span className="text-xl font-bold text-cyan-600">{sessoes.length > 0 ? formatData(sessoes[0].data) : "—"}</span>
                    <span className="text-xs text-gray-400">{sessoes.length > 0 ? sessoes[0].tipo : "Sem registos"}</span>
                </div>
            </div>

            {/* ── FILTROS ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(["Todas", ...TIPOS] as const).map((t) => (
                    <button key={t} onClick={() => setFiltroTipo(t as "Todas" | Tipo)} className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all ${filtroTipo === t ? "bg-cyan-600 text-white border-cyan-600" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"}`}>
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
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hora</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duração</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Equipa</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Local</th>
                                <th className="p-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessoesFiltradas.map((s) => (
                                <tr key={s.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-3 font-bold text-blue-600 whitespace-nowrap">{formatData(s.data)}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400">{s.hora ? s.hora.slice(0, 5) : "—"}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-lg font-bold text-xs text-white ${TIPO_COLORS[s.tipo as Tipo] ?? "bg-gray-500"}`}>{s.tipo}</span>
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300">{s.duracao_min} min</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400">{s.equipa_nome ?? "—"}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400 max-w-[120px] truncate">{s.local ?? "—"}</td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                className="bg-gray-100 dark:bg-gray-700 text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all text-xs"
                                                onClick={() => abrirSessao(s, "detalhes")}
                                            >
                                                Ver
                                            </button>
                                            <button
                                                className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all text-xs"
                                                onClick={() => abrirSessao(s, "editar")}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 font-bold px-3 py-1.5 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-all text-xs"
                                                onClick={() => abrirSessao(s, "assiduidade")}
                                            >
                                                Assid.
                                            </button>
                                        </div>
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
