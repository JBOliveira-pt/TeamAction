"use client";
import { useState } from "react";
import { Leaf, Plus, X } from "lucide-react";

type Plano = {
    id: string;
    nome: string;
    descricao: string | null;
    objetivo: string | null;
    observacoes: string | null;
    created_at: string;
};

const OBJETIVOS = ["Pré-Jogo", "Recuperação", "Massa Muscular", "Perda de Peso"] as const;

const OBJETIVO_BADGE: Record<string, string> = {
    "Pré-Jogo": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "Recuperação": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "Massa Muscular": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "Perda de Peso": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

export default function Nutricao({ planos: initialPlanos }: { planos: Plano[] }) {
    const [planos, setPlanos] = useState<Plano[]>(initialPlanos);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const [form, setForm] = useState({
        nome: "",
        descricao: "",
        objetivo: "",
        observacoes: "",
    });

    function showToast(msg: string, ok = true) {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    }

    function resetForm() {
        setForm({ nome: "", descricao: "", objetivo: "", observacoes: "" });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.nome.trim()) return;
        setSaving(true);
        try {
            const res = await fetch("/api/planos-nutricao", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: form.nome,
                    descricao: form.descricao || undefined,
                    objetivo: form.objetivo || undefined,
                    observacoes: form.observacoes || undefined,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const { id } = await res.json();
            const novo: Plano = {
                id,
                nome: form.nome.trim(),
                descricao: form.descricao || null,
                objetivo: form.objetivo || null,
                observacoes: form.observacoes || null,
                created_at: new Date().toISOString(),
            };
            setPlanos((prev) => [novo, ...prev]);
            setShowModal(false);
            resetForm();
            showToast("Plano criado com sucesso.");
        } catch (err: unknown) {
            showToast(
                err instanceof Error ? err.message : "Erro ao criar plano.",
                false,
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 p-6 flex flex-col gap-6">
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg text-sm text-white ${toast.ok ? "bg-blue-600" : "bg-red-600"}`}
                >
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Leaf size={24} className="text-green-500" />
                        Nutrição
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Planos nutricionais criados para o plantel.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm shadow transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Novo Plano
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {OBJETIVOS.map((obj) => {
                    const count = planos.filter((p) => p.objetivo === obj).length;
                    return (
                        <div
                            key={obj}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center"
                        >
                            <span
                                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${OBJETIVO_BADGE[obj]}`}
                            >
                                {obj}
                            </span>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {count}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lista de planos */}
            {planos.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-10 text-center text-sm text-gray-400">
                    Nenhum plano criado. Clica em &quot;Novo Plano&quot; para começar.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {planos.map((p) => (
                        <div
                            key={p.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                    {p.nome}
                                </h3>
                                {p.objetivo && (
                                    <span
                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${OBJETIVO_BADGE[p.objetivo] ?? "bg-gray-100 text-gray-600"}`}
                                    >
                                        {p.objetivo}
                                    </span>
                                )}
                            </div>
                            {p.descricao && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {p.descricao}
                                </p>
                            )}
                            {p.observacoes && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {p.observacoes}
                                </p>
                            )}
                            <div className="text-xs text-gray-400 mt-auto pt-1 border-t border-gray-100 dark:border-gray-700">
                                {new Date(p.created_at).toLocaleDateString("pt-PT")}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Novo Plano */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Novo Plano Nutricional
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, nome: e.target.value }))
                                    }
                                    required
                                    placeholder="ex: Plano Pré-Jogo Sábado"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Objetivo
                                </label>
                                <select
                                    value={form.objetivo}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, objetivo: e.target.value }))
                                    }
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">— Sem objetivo —</option>
                                    {OBJETIVOS.map((o) => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    value={form.descricao}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, descricao: e.target.value }))
                                    }
                                    rows={2}
                                    placeholder="Breve descrição do plano..."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm resize-none text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Observações
                                </label>
                                <textarea
                                    value={form.observacoes}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, observacoes: e.target.value }))
                                    }
                                    rows={2}
                                    placeholder="Notas adicionais, restrições, etc."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm resize-none text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-all"
                                >
                                    {saving ? "A guardar..." : "Criar Plano"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 rounded-lg text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
