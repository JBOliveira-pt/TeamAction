"use client";
import { useState } from "react";
import { Activity, Plus, X } from "lucide-react";

type Avaliacao = {
    id: string;
    atleta_id: string;
    atleta_nome: string;
    data: string;
    velocidade_30m: number | null;
    impulsao_vertical: number | null;
    vo2max: number | null;
    forca_kg: number | null;
    observacoes: string | null;
};

type Atleta = {
    id: string;
    nome: string;
};

export default function CondicaoFisica({
    avaliacoes: initialAvaliacoes,
    atletas,
}: {
    avaliacoes: Avaliacao[];
    atletas: Atleta[];
}) {
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(initialAvaliacoes);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const [form, setForm] = useState({
        atleta_id: "",
        data: new Date().toISOString().split("T")[0],
        velocidade_30m: "",
        impulsao_vertical: "",
        vo2max: "",
        forca_kg: "",
        observacoes: "",
    });

    function showToast(msg: string, ok = true) {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    }

    function resetForm() {
        setForm({
            atleta_id: "",
            data: new Date().toISOString().split("T")[0],
            velocidade_30m: "",
            impulsao_vertical: "",
            vo2max: "",
            forca_kg: "",
            observacoes: "",
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.atleta_id) return;
        setSaving(true);
        try {
            const res = await fetch("/api/avaliacoes-fisicas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    atleta_id: form.atleta_id,
                    data: form.data,
                    velocidade_30m: form.velocidade_30m
                        ? parseFloat(form.velocidade_30m)
                        : undefined,
                    impulsao_vertical: form.impulsao_vertical
                        ? parseInt(form.impulsao_vertical)
                        : undefined,
                    vo2max: form.vo2max ? parseFloat(form.vo2max) : undefined,
                    forca_kg: form.forca_kg ? parseFloat(form.forca_kg) : undefined,
                    observacoes: form.observacoes || undefined,
                }),
            });
            if (!res.ok) throw new Error(await res.text());

            const atletaNome =
                atletas.find((a) => a.id === form.atleta_id)?.nome ?? "";
            const nova: Avaliacao = {
                id: (await res.json()).id,
                atleta_id: form.atleta_id,
                atleta_nome: atletaNome,
                data: form.data,
                velocidade_30m: form.velocidade_30m
                    ? parseFloat(form.velocidade_30m)
                    : null,
                impulsao_vertical: form.impulsao_vertical
                    ? parseInt(form.impulsao_vertical)
                    : null,
                vo2max: form.vo2max ? parseFloat(form.vo2max) : null,
                forca_kg: form.forca_kg ? parseFloat(form.forca_kg) : null,
                observacoes: form.observacoes || null,
            };
            setAvaliacoes((prev) => [nova, ...prev]);
            setShowModal(false);
            resetForm();
            showToast("Avaliação registada com sucesso.");
        } catch (err: unknown) {
            showToast(
                err instanceof Error ? err.message : "Erro ao registar avaliação.",
                false,
            );
        } finally {
            setSaving(false);
        }
    }

    // Summary stats
    const ultimaData = avaliacoes[0]?.data
        ? new Date(avaliacoes[0].data).toLocaleDateString("pt-PT")
        : null;
    const vels = avaliacoes
        .map((a) => a.velocidade_30m)
        .filter((v): v is number => v != null);
    const melhorVel = vels.length > 0 ? Math.min(...vels).toFixed(2) : null;
    const mediaVel =
        vels.length > 0 ? (vels.reduce((s, v) => s + v, 0) / vels.length).toFixed(2) : null;

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
                    <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                        <Activity size={24} className="text-orange-500" />
                        Condição Física
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Avaliações físicas do plantel — velocidade, impulsão, VO2max e
                        força.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold text-sm shadow transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Nova Avaliação
                </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Total de Avaliações
                    </div>
                    <div className="text-3xl font-bold text-orange-600">
                        {avaliacoes.length}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Última Avaliação
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {ultimaData ?? "—"}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Melhor Velocidade 30m
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {melhorVel ? `${melhorVel}s` : "—"}
                        {mediaVel && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                média {mediaVel}s
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabela de avaliações */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-900 dark:text-white text-sm">
                    Histórico de Avaliações ({avaliacoes.length})
                </div>
                {avaliacoes.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        Nenhuma avaliação registada. Clica em &quot;Nova Avaliação&quot; para começar.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Atleta
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Data
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Vel. 30m
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Impulsão
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        VO2max
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Força (kg)
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Obs.
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {avaliacoes.map((av) => (
                                    <tr
                                        key={av.id}
                                        className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                    >
                                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                                            {av.atleta_nome}
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            {new Date(av.data).toLocaleDateString("pt-PT")}
                                        </td>
                                        <td className="p-3 text-gray-900 dark:text-white">
                                            {av.velocidade_30m != null ? `${av.velocidade_30m}s` : "—"}
                                        </td>
                                        <td className="p-3 text-gray-900 dark:text-white">
                                            {av.impulsao_vertical != null
                                                ? `${av.impulsao_vertical}cm`
                                                : "—"}
                                        </td>
                                        <td className="p-3 text-gray-900 dark:text-white">
                                            {av.vo2max != null ? av.vo2max : "—"}
                                        </td>
                                        <td className="p-3 text-gray-900 dark:text-white">
                                            {av.forca_kg != null ? `${av.forca_kg}kg` : "—"}
                                        </td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                                            {av.observacoes ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Nova Avaliação */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Nova Avaliação Física
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
                                    Atleta <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.atleta_id}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, atleta_id: e.target.value }))
                                    }
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">— Selecionar atleta —</option>
                                    {atletas.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Data <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    max={new Date().toISOString().split("T")[0]}
                                    value={form.data}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, data: e.target.value }))
                                    }
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                />
                                <p className="text-xs text-gray-400 mt-1">Não pode ser uma data futura.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Velocidade 30m (s) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={2.5}
                                        max={10}
                                        value={form.velocidade_30m}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                velocidade_30m: e.target.value,
                                            }))
                                        }
                                        placeholder="ex: 4.20"
                                        required
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">2.50 – 10.00 s</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Impulsão Vertical (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={10}
                                        max={150}
                                        value={form.impulsao_vertical}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                impulsao_vertical: e.target.value,
                                            }))
                                        }
                                        placeholder="ex: 52"
                                        required
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">10 – 150 cm</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        VO2max <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min={10}
                                        max={90}
                                        value={form.vo2max}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, vo2max: e.target.value }))
                                        }
                                        placeholder="ex: 54.3"
                                        required
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">10 – 90 ml/kg/min</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Força Press (kg) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={10}
                                        max={300}
                                        value={form.forca_kg}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, forca_kg: e.target.value }))
                                        }
                                        placeholder="ex: 98"
                                        required
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">10 – 300 kg</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Observações <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={form.observacoes}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, observacoes: e.target.value }))
                                    }
                                    rows={2}
                                    maxLength={500}
                                    placeholder="Notas sobre o desempenho ou condição do atleta..."
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm resize-none text-gray-900 dark:text-gray-100"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{form.observacoes.length}/500</p>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-all"
                                >
                                    {saving ? "A guardar..." : "Registar"}
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
