"use client";
import { useState, useEffect } from "react";
import { BarChart2, Plus, X } from "lucide-react";

type Jogo = {
    id: string;
    adversario: string;
    data: string;
    hora_inicio: string | null;
    equipa_nome: string | null;
    estado: string;
    is_mine: boolean;
};

function jogoJaComecou(jogo: Jogo): boolean {
    const dia = new Date(jogo.data.slice(0, 10));
    dia.setHours(0, 0, 0, 0);
    const agora = new Date();
    const hojeMeia = new Date();
    hojeMeia.setHours(0, 0, 0, 0);

    if (dia > hojeMeia) return false;
    if (dia < hojeMeia) return true;

    // Mesmo dia — verificar hora_inicio
    if (jogo.hora_inicio) {
        const [h, m] = jogo.hora_inicio.slice(0, 5).split(":").map(Number);
        if (
            agora.getHours() < h ||
            (agora.getHours() === h && agora.getMinutes() < m)
        ) {
            return false;
        }
    }
    return true;
}

type Atleta = {
    id: string;
    nome: string;
    numero_camisola: number | null;
};

type Evento = {
    id: string;
    atleta_nome: string | null;
    tipo: string;
    minuto: number | null;
    observacoes: string | null;
};

const TIPOS_EVENTO = [
    "Golo Feito",
    "Golo Sofrido",
    "Assistência",
    "Falta",
    "Cartão Amarelo",
    "Cartão Vermelho",
    "Substituição",
];

const TIPO_BADGE: Record<string, string> = {
    "Golo Feito": "bg-green-600",
    "Golo Sofrido": "bg-red-500",
    Assistência: "bg-blue-600",
    Falta: "bg-orange-500",
    "Cartão Amarelo": "bg-yellow-500",
    "Cartão Vermelho": "bg-red-600",
    Substituição: "bg-purple-600",
};

const ESTADO_BADGE: Record<string, string> = {
    agendado:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    realizado:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    cancelado: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function EstatisticasAoVivo({
    jogos,
    atletas,
}: {
    jogos: Jogo[];
    atletas: Atleta[];
}) {
    const [jogoId, setJogoId] = useState("");
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(
        null,
    );

    const [form, setForm] = useState({
        tipo: "Golo Feito",
        atleta_id: "",
        minuto: "",
        observacoes: "",
    });

    const jogoSelecionado = jogos.find((j) => j.id === jogoId);
    const jaComecou = jogoSelecionado ? jogoJaComecou(jogoSelecionado) : false;
    const isMine = jogoSelecionado?.is_mine ?? false;
    const podeRegistar = jaComecou && isMine;

    useEffect(() => {
        if (!jogoId) {
            setEventos([]);
            return;
        }
        setLoading(true);
        fetch(`/api/eventos-jogo?jogo_id=${jogoId}`)
            .then((r) => r.json())
            .then((data) => setEventos(Array.isArray(data) ? data : []))
            .catch(() => setEventos([]))
            .finally(() => setLoading(false));
    }, [jogoId]);

    function showToast(msg: string, ok = true) {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!jogoId) return;
        setSaving(true);
        try {
            const res = await fetch("/api/eventos-jogo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jogo_id: jogoId,
                    tipo: form.tipo,
                    atleta_id: form.atleta_id || undefined,
                    minuto: form.minuto ? parseInt(form.minuto) : undefined,
                    observacoes: form.observacoes || undefined,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            setShowModal(false);
            setForm({
                tipo: "Golo Feito",
                atleta_id: "",
                minuto: "",
                observacoes: "",
            });
            const updated = await fetch(
                `/api/eventos-jogo?jogo_id=${jogoId}`,
            ).then((r) => r.json());
            setEventos(Array.isArray(updated) ? updated : []);
            showToast("Evento registado com sucesso.");
        } catch (err: unknown) {
            showToast(
                err instanceof Error ? err.message : "Erro ao registar evento.",
                false,
            );
        } finally {
            setSaving(false);
        }
    }

    const statsByTipo = TIPOS_EVENTO.reduce<Record<string, number>>(
        (acc, t) => {
            acc[t] = eventos.filter((e) => e.tipo === t).length;
            return acc;
        },
        {},
    );

    return (
        <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 p-6 flex flex-col gap-6">
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
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <BarChart2 size={24} className="text-red-500" />
                        Live Stats
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Seleciona um jogo e regista eventos — golos, faltas,
                        cartões e substituições.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    disabled={!podeRegistar}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm shadow transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Registar Evento
                </button>
            </div>

            {/* Selector de Jogo */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Selecionar Jogo
                </label>
                {jogos.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        Nenhum jogo registado.
                    </p>
                ) : (
                    <select
                        value={jogoId}
                        onChange={(e) => setJogoId(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="">— Selecionar jogo —</option>
                        {jogos.map((j) => (
                            <option key={j.id} value={j.id}>
                                vs {j.adversario} ·{" "}
                                {new Date(j.data).toLocaleDateString("pt-PT")}
                                {j.equipa_nome ? ` · ${j.equipa_nome}` : ""}
                                {!j.is_mine ? " (adversário)" : ""}
                            </option>
                        ))}
                    </select>
                )}
                {jogoSelecionado && !jaComecou && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-medium">
                        ⏳ Este jogo ainda não começou. O registo de eventos
                        estará disponível a partir de{" "}
                        <strong>
                            {new Date(
                                jogoSelecionado.data.slice(0, 10),
                            ).toLocaleDateString("pt-PT")}
                            {jogoSelecionado.hora_inicio
                                ? ` às ${jogoSelecionado.hora_inicio.slice(0, 5)}`
                                : ""}
                        </strong>
                        .
                    </div>
                )}
                {jogoSelecionado && jaComecou && !isMine && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        👁️ Este jogo foi criado pelo adversário. Pode ver as
                        estatísticas, mas não pode registar eventos.
                    </div>
                )}
                {jogoSelecionado && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">
                            vs {jogoSelecionado.adversario}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">
                            {new Date(jogoSelecionado.data).toLocaleDateString(
                                "pt-PT",
                            )}
                        </span>
                        {jogoSelecionado.equipa_nome && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">
                                {jogoSelecionado.equipa_nome}
                            </span>
                        )}
                        <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${ESTADO_BADGE[jogoSelecionado.estado] ?? "bg-gray-100 text-gray-600"}`}
                        >
                            {jogoSelecionado.estado}
                        </span>
                    </div>
                )}
            </div>

            {jogoId && (
                <>
                    {/* Contadores por tipo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {TIPOS_EVENTO.map((tipo) => (
                            <div
                                key={tipo}
                                className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow text-center border border-gray-200 dark:border-gray-700"
                            >
                                <div
                                    className={`inline-block px-2 py-0.5 rounded text-xs text-white font-bold mb-2 ${TIPO_BADGE[tipo]}`}
                                >
                                    {tipo}
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {statsByTipo[tipo]}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabela de eventos */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-900 dark:text-white text-sm">
                            Eventos Registados ({eventos.length})
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-400">
                                A carregar...
                            </div>
                        ) : eventos.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">
                                Nenhum evento registado para este jogo.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                Tipo
                                            </th>
                                            <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                Atleta
                                            </th>
                                            <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                Minuto
                                            </th>
                                            <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                Observações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventos.map((ev) => (
                                            <tr
                                                key={ev.id}
                                                className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                            >
                                                <td className="p-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-xs text-white font-semibold ${TIPO_BADGE[ev.tipo] ?? "bg-gray-500"}`}
                                                    >
                                                        {ev.tipo}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-900 dark:text-white">
                                                    {ev.atleta_nome ?? "—"}
                                                </td>
                                                <td className="p-3 text-gray-600 dark:text-gray-400">
                                                    {ev.minuto != null
                                                        ? `${ev.minuto}'`
                                                        : "—"}
                                                </td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                                                    {ev.observacoes ?? "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal Registar Evento */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Registar Evento
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form
                            onSubmit={handleSubmit}
                            className="p-5 flex flex-col gap-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipo de Evento *
                                </label>
                                <select
                                    value={form.tipo}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            tipo: e.target.value,
                                        }))
                                    }
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                >
                                    {TIPOS_EVENTO.map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Atleta
                                </label>
                                <select
                                    value={form.atleta_id}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            atleta_id: e.target.value,
                                        }))
                                    }
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">— Nenhum —</option>
                                    {atletas.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.nome}
                                            {a.numero_camisola
                                                ? ` (#${a.numero_camisola})`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Minuto
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={120}
                                    value={form.minuto}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            minuto: e.target.value,
                                        }))
                                    }
                                    placeholder="ex: 45"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Observações
                                </label>
                                <textarea
                                    value={form.observacoes}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            observacoes: e.target.value,
                                        }))
                                    }
                                    rows={2}
                                    placeholder="Notas adicionais..."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-sm resize-none text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-all"
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
