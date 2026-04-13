// Componente cliente de jogos (treinador).
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import ConvocatoriaModal from "@/app/dashboard/presidente/jogos/_components/ConvocatoriaModal.client";

type Equipa = { id: string; nome: string; escalao: string };

type Jogo = {
    id: string;
    adversario: string;
    data: string;
    casa_fora: string;
    local: string | null;
    estado: string;
    resultado_nos: number | null;
    resultado_adv: number | null;
    equipa_id: string | null;
    equipa_nome: string | null;
    adversario_fake: boolean;
    hora_inicio: string | null;
    hora_fim: string | null;
    mirror_game_id: string | null;
    resposta_adversario: string | null;
    proposta_data: string | null;
    proposta_hora: string | null;
};

type Clube = {
    id: string;
    name: string;
    cidade: string | null;
    desporto: string | null;
};

type EquipaTreinador = {
    organization_id: string;
    nome: string;
    treinador_nome: string;
};

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
const hojeISO = hoje.toISOString().split("T")[0];

/* ── Toast ────────────────────────────────────────────────────────────── */
function Toast({ msg, tipo }: { msg: string; tipo: "ok" | "erro" }) {
    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 ${tipo === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
        >
            {tipo === "ok" ? "✓" : "✕"} {msg}
        </div>
    );
}

/* ── Badge de estado ──────────────────────────────────────────────────── */
function EstadoBadge({ estado }: { estado: string }) {
    const map: Record<string, string> = {
        agendado:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        realizado:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        cancelado:
            "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    };
    const label: Record<string, string> = {
        agendado: "Agendado",
        realizado: "Realizado",
        cancelado: "Cancelado",
    };
    return (
        <span
            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${map[estado] ?? map.agendado}`}
        >
            {label[estado] ?? estado}
        </span>
    );
}

/* ── Resultado badge ──────────────────────────────────────────────────── */

/* ── Badge resposta adversário ────────────────────────────────────────── */
function RespostaAdversarioBadge({ resposta }: { resposta: string | null }) {
    if (!resposta || resposta === "pendente")
        return (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                ⏳ Pendente
            </span>
        );
    if (resposta === "aceite")
        return (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                ✓ Confirmado
            </span>
        );
    if (resposta === "recusado")
        return (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                ✕ Recusado
            </span>
        );
    if (resposta === "nova_proposta")
        return (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                📅 Nova proposta
            </span>
        );
    return null;
}

/* ── Botões de resposta (para jogo espelhado) ─────────────────────────── */
function BotoesRespostaJogo({
    jogo,
    onResponded,
}: {
    jogo: Jogo;
    onResponded: (resposta: string) => void;
}) {
    const [enviando, setEnviando] = useState(false);
    const [showProposta, setShowProposta] = useState(false);
    const [propostaData, setPropostaData] = useState("");
    const [propostaHora, setPropostaHora] = useState("");
    const [erro, setErro] = useState("");

    const responder = async (
        resposta: "aceite" | "recusado" | "nova_proposta",
    ) => {
        setErro("");
        setEnviando(true);
        try {
            const res = await fetch(`/api/jogos/${jogo.id}/resposta`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resposta,
                    proposta_data:
                        resposta === "nova_proposta" ? propostaData : null,
                    proposta_hora:
                        resposta === "nova_proposta"
                            ? propostaHora || null
                            : null,
                }),
            });
            if (res.ok) {
                onResponded(resposta);
            } else {
                setErro(await res.text());
            }
        } catch {
            setErro("Erro de rede.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
                <button
                    onClick={() => responder("aceite")}
                    disabled={enviando}
                    className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-all disabled:opacity-50"
                >
                    ✓ Concordar
                </button>
                <button
                    onClick={() => responder("recusado")}
                    disabled={enviando}
                    className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all disabled:opacity-50"
                >
                    ✕ Discordar
                </button>
                <button
                    onClick={() => setShowProposta(!showProposta)}
                    disabled={enviando}
                    className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all disabled:opacity-50"
                >
                    📅 Propor
                </button>
            </div>
            {showProposta && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                Nova data *
                            </label>
                            <input
                                type="date"
                                required
                                className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                value={propostaData}
                                onChange={(e) =>
                                    setPropostaData(e.target.value)
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                Nova hora
                            </label>
                            <input
                                type="time"
                                className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                value={propostaHora}
                                onChange={(e) =>
                                    setPropostaHora(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <button
                        onClick={() =>
                            propostaData && responder("nova_proposta")
                        }
                        disabled={!propostaData || enviando}
                        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all"
                    >
                        {enviando ? "A enviar..." : "Enviar proposta"}
                    </button>
                </div>
            )}
            {erro && <p className="text-xs text-red-500">{erro}</p>}
        </div>
    );
}
function ResultadoBadge({ nos, adv }: { nos: number; adv: number }) {
    const cor =
        nos > adv ? "bg-green-600" : nos < adv ? "bg-red-600" : "bg-yellow-500";
    const letra = nos > adv ? "V" : nos < adv ? "D" : "E";
    return (
        <span
            className={`px-3 py-1 rounded-lg font-bold text-xs text-white ${cor}`}
        >
            {nos}-{adv} {letra}
        </span>
    );
}

function formatData(iso: string) {
    return new Date(iso).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/* ── Tipos Live Stats ─────────────────────────────────────────────────── */
type EventoJogo = {
    id: string;
    atleta_nome: string | null;
    tipo: string;
    minuto: number | null;
    observacoes: string | null;
};

const TIPO_EMOJI: Record<string, string> = {
    "Golo Feito": "⚽",
    "Golo Sofrido": "🥅",
    Assistência: "👟",
    Falta: "⚠️",
    "Cartão Amarelo": "🟨",
    "Cartão Vermelho": "🟥",
    Substituição: "🔄",
};

const TIPO_COR: Record<string, string> = {
    "Golo Feito": "bg-green-600",
    "Golo Sofrido": "bg-red-500",
    Assistência: "bg-blue-600",
    Falta: "bg-orange-500",
    "Cartão Amarelo": "bg-yellow-500",
    "Cartão Vermelho": "bg-red-600",
    Substituição: "bg-purple-600",
};

/* ── Modal Detalhe do Jogo ─────────────────────────────────────────────── */
function ModalDetalheJogo({
    jogo,
    onClose,
}: {
    jogo: Jogo;
    onClose: () => void;
}) {
    const [eventos, setEventos] = useState<EventoJogo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/eventos-jogo?jogo_id=${jogo.id}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setEventos(Array.isArray(data) ? data : []))
            .catch(() => setEventos([]))
            .finally(() => setLoading(false));
    }, [jogo.id]);

    const tiposUnicos = [
        "Golo Feito",
        "Golo Sofrido",
        "Assistência",
        "Falta",
        "Cartão Amarelo",
        "Cartão Vermelho",
        "Substituição",
    ];
    const contagens = tiposUnicos.reduce<Record<string, number>>((acc, t) => {
        acc[t] = eventos.filter((e) => e.tipo === t).length;
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        📋 Detalhe do Jogo
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto p-5 flex flex-col gap-5">
                    {/* Info do jogo */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                Adversário
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1">
                                {jogo.adversario_fake && <span>🤖</span>}
                                {jogo.adversario}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                Data
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                                {formatData(jogo.data)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                Hora
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                                {jogo.hora_inicio
                                    ? `${jogo.hora_inicio.slice(0, 5)} — ${jogo.hora_fim?.slice(0, 5) ?? "?"}`
                                    : "—"}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                Local
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                                {jogo.casa_fora === "casa"
                                    ? "🏠 Casa"
                                    : "✈️ Fora"}
                                {jogo.local ? ` · ${jogo.local}` : ""}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                Estado
                            </span>
                            <span>
                                <EstadoBadge estado={jogo.estado} />
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                Resultado
                            </span>
                            <span className="text-sm">
                                {jogo.resultado_nos !== null &&
                                jogo.resultado_adv !== null ? (
                                    <ResultadoBadge
                                        nos={jogo.resultado_nos}
                                        adv={jogo.resultado_adv}
                                    />
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Contadores Live Stats */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Live Stats
                        </h4>
                        {loading ? (
                            <p className="text-xs text-gray-400 text-center py-3">
                                A carregar...
                            </p>
                        ) : eventos.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-3">
                                Nenhum evento registado neste jogo.
                            </p>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
                                    {tiposUnicos.map((t) => (
                                        <div
                                            key={t}
                                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="text-base">
                                                {TIPO_EMOJI[t]}
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {contagens[t]}
                                            </div>
                                            <div className="text-[9px] text-gray-400 uppercase leading-tight">
                                                {t}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Timeline de eventos */}
                                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                                    {eventos.map((ev) => (
                                        <div
                                            key={ev.id}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
                                        >
                                            <span
                                                className={`px-1.5 py-0.5 rounded text-[10px] text-white font-bold ${TIPO_COR[ev.tipo] ?? "bg-gray-500"}`}
                                            >
                                                {ev.tipo}
                                            </span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1">
                                                {ev.atleta_nome ?? "—"}
                                            </span>
                                            {ev.minuto != null && (
                                                <span className="text-xs text-gray-400 font-mono">
                                                    {ev.minuto}&apos;
                                                </span>
                                            )}
                                            {ev.observacoes && (
                                                <span
                                                    className="text-[10px] text-gray-400 truncate max-w-[120px]"
                                                    title={ev.observacoes}
                                                >
                                                    {ev.observacoes}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Rodapé */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal Registar Resultado ──────────────────────────────────────────── */
function ModalResultado({
    jogo,
    onSave,
    onClose,
}: {
    jogo: Jogo;
    onSave: (id: string, nos: number, adv: number) => Promise<void>;
    onClose: () => void;
}) {
    const [nos, setNos] = useState(jogo.resultado_nos?.toString() ?? "");
    const [adv, setAdv] = useState(jogo.resultado_adv?.toString() ?? "");
    const [saving, setSaving] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const n = parseInt(nos),
            a = parseInt(adv);
        if (isNaN(n) || isNaN(a) || n < 0 || a < 0) return;
        setSaving(true);
        await onSave(jogo.id, n, a);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                        🏆 Registar Resultado
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    vs{" "}
                    <strong className="text-gray-800 dark:text-gray-100">
                        {jogo.adversario}
                    </strong>{" "}
                    · {formatData(jogo.data)}
                </p>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Nós
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="99"
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-3 bg-gray-50 dark:bg-gray-800 text-center text-2xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                value={nos}
                                onChange={(e) => setNos(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <span className="text-2xl font-bold text-gray-400 mt-5">
                            —
                        </span>
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Adversário
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="99"
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-3 bg-gray-50 dark:bg-gray-800 text-center text-2xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                value={adv}
                                onChange={(e) => setAdv(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                        >
                            {saving ? "A guardar..." : "Guardar"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Modal Editar Data/Hora ─────────────────────────────────────────────── */
function ModalEditarData({
    jogo,
    onSave,
    onClose,
}: {
    jogo: Jogo;
    onSave: (
        id: string,
        data: string,
        horaInicio: string,
        horaFim: string,
    ) => Promise<void>;
    onClose: () => void;
}) {
    const [dataJogo, setDataJogo] = useState(jogo.data.split("T")[0]);
    const [horaInicio, setHoraInicio] = useState(jogo.hora_inicio ?? "");
    const [horaFim, setHoraFim] = useState(jogo.hora_fim ?? "");
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dataJogo) return;
        const d = new Date(dataJogo);
        d.setHours(0, 0, 0, 0);
        if (d < hoje) {
            setErro("Não é possível remarcar para uma data passada.");
            return;
        }
        if (dataJogo === hojeISO && horaInicio) {
            const agora = new Date();
            const [h, m] = horaInicio.split(":").map(Number);
            if (
                h < agora.getHours() ||
                (h === agora.getHours() && m <= agora.getMinutes())
            ) {
                setErro("Não é possível remarcar para uma hora já passada.");
                return;
            }
        }
        setErro("");
        setSaving(true);
        await onSave(jogo.id, dataJogo, horaInicio, horaFim);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                        📅 Alterar Data/Hora
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    vs{" "}
                    <strong className="text-gray-800 dark:text-gray-100">
                        {jogo.adversario}
                    </strong>
                </p>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            Nova data
                        </label>
                        <input
                            type="date"
                            min={hojeISO}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            value={dataJogo}
                            onChange={(e) => {
                                setDataJogo(e.target.value);
                                setErro("");
                            }}
                            required
                            autoFocus
                        />
                        {erro && <p className="text-xs text-red-500">{erro}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Hora de início
                            </label>
                            <div className="flex gap-1">
                                <select
                                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-2 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    value={
                                        horaInicio
                                            ? horaInicio.split(":")[0]
                                            : ""
                                    }
                                    onChange={(e) => {
                                        const h = e.target.value;
                                        const m = horaInicio
                                            ? horaInicio.split(":")[1]
                                            : "00";
                                        if (h && m) {
                                            setHoraInicio(`${h}:${m}`);
                                            const totalMin =
                                                parseInt(h) * 60 +
                                                parseInt(m) +
                                                90;
                                            const fimH =
                                                Math.floor(totalMin / 60) % 24;
                                            const fimM = totalMin % 60;
                                            setHoraFim(
                                                `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                            );
                                        } else {
                                            setHoraInicio(h ? `${h}:00` : "");
                                        }
                                    }}
                                >
                                    <option value="">HH</option>
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option
                                            key={i}
                                            value={String(i).padStart(2, "0")}
                                        >
                                            {String(i).padStart(2, "0")}
                                        </option>
                                    ))}
                                </select>
                                <span className="flex items-center text-gray-500 font-bold">
                                    :
                                </span>
                                <select
                                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-2 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    value={
                                        horaInicio
                                            ? horaInicio.split(":")[1]
                                            : ""
                                    }
                                    onChange={(e) => {
                                        const m = e.target.value;
                                        const h = horaInicio
                                            ? horaInicio.split(":")[0]
                                            : "";
                                        if (h && m) {
                                            setHoraInicio(`${h}:${m}`);
                                            const totalMin =
                                                parseInt(h) * 60 +
                                                parseInt(m) +
                                                90;
                                            const fimH =
                                                Math.floor(totalMin / 60) % 24;
                                            const fimM = totalMin % 60;
                                            setHoraFim(
                                                `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                            );
                                        }
                                    }}
                                >
                                    <option value="">MM</option>
                                    {["00", "15", "30", "45"].map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Hora terminada
                            </label>
                            <input
                                type="time"
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                value={horaFim}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                        >
                            {saving ? "A guardar..." : "Guardar"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Modal Novo Jogo (fluxo em passos) ─────────────────────────────────── */
function ModalNovoJogo({
    equipas,
    onCreate,
    onClose,
}: {
    equipas: Equipa[];
    onCreate: (data: {
        adversario: string;
        data: string;
        casa_fora: string;
        local: string;
        equipa_id: string;
        hora_inicio: string;
        hora_fim: string;
        adversario_org_id: string | null;
    }) => Promise<void>;
    onClose: () => void;
}) {
    const [passo, setPasso] = useState<1 | 2 | 3>(1);
    const [adversarioNaPlataforma, setAdversarioNaPlataforma] = useState<
        boolean | null
    >(null);
    const [adversarioPossuiClube, setAdversarioPossuiClube] = useState<
        boolean | null
    >(null);

    const [pesquisa, setPesquisa] = useState("");
    const [resultados, setResultados] = useState<Clube[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [clubeSelecionado, setClubeSelecionado] = useState<Clube | null>(
        null,
    );
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [equipasAdv, setEquipasAdv] = useState<
        { id: string; nome: string }[]
    >([]);
    const [equipaAdvSelecionada, setEquipaAdvSelecionada] = useState<{
        id: string;
        nome: string;
    } | null>(null);
    const [equipasLoadedForClubeId, setEquipasLoadedForClubeId] = useState<
        string | null
    >(null);
    const [semEquipas, setSemEquipas] = useState(false);
    const loadingEquipas =
        clubeSelecionado !== null &&
        equipasLoadedForClubeId !== clubeSelecionado.id;

    const [pesquisaTreinador, setPesquisaTreinador] = useState("");
    const [resultadosTreinador, setResultadosTreinador] = useState<
        EquipaTreinador[]
    >([]);
    const [buscandoTreinador, setBuscandoTreinador] = useState(false);
    const [equipaTreinadorSelecionada, setEquipaTreinadorSelecionada] =
        useState<EquipaTreinador | null>(null);
    const searchTimerTreinador = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const [nomeManual, setNomeManual] = useState("");

    const [dataJogo, setDataJogo] = useState("");
    const [casaFora, setCasaFora] = useState("casa");
    const [local, setLocal] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [equipaId, setEquipaId] = useState(equipas[0]?.id ?? "");
    const escalaoSelecionado =
        equipas.find((e) => e.id === equipaId)?.escalao ?? "";
    const [saving, setSaving] = useState(false);
    const [erroData, setErroData] = useState("");

    const resultadosMostrar =
        adversarioPossuiClube === true && pesquisa.trim().length >= 2
            ? resultados
            : [];

    useEffect(() => {
        if (adversarioPossuiClube !== true || pesquisa.trim().length < 2)
            return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setBuscando(true);
            const res = await fetch(
                `/api/clubes?q=${encodeURIComponent(pesquisa.trim())}`,
            );
            if (res.ok) setResultados(await res.json());
            else setResultados([]);
            setBuscando(false);
        }, 350);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [pesquisa, adversarioPossuiClube]);

    useEffect(() => {
        if (!clubeSelecionado) return;
        const id = clubeSelecionado.id;
        let cancelled = false;
        const params = new URLSearchParams({ clube_id: id });
        if (escalaoSelecionado) params.set("escalao", escalaoSelecionado);
        fetch(`/api/equipas?${params}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: { id: string; nome: string }[]) => {
                if (cancelled) return;
                setEquipasAdv(data);
                setEquipaAdvSelecionada(null);
                setSemEquipas(data.length === 0);
                setEquipasLoadedForClubeId(id);
            })
            .catch(() => {
                if (cancelled) return;
                setSemEquipas(true);
                setEquipasLoadedForClubeId(id);
            });
        return () => {
            cancelled = true;
        };
    }, [clubeSelecionado, escalaoSelecionado]);

    useEffect(() => {
        if (
            adversarioPossuiClube !== false ||
            pesquisaTreinador.trim().length < 2
        )
            return;
        if (searchTimerTreinador.current)
            clearTimeout(searchTimerTreinador.current);
        searchTimerTreinador.current = setTimeout(async () => {
            setBuscandoTreinador(true);
            const params = new URLSearchParams({ q: pesquisaTreinador.trim() });
            if (escalaoSelecionado) params.set("escalao", escalaoSelecionado);
            const res = await fetch(
                `/api/treinador/pesquisar-equipas?${params}`,
            );
            if (res.ok) setResultadosTreinador(await res.json());
            else setResultadosTreinador([]);
            setBuscandoTreinador(false);
        }, 350);
        return () => {
            if (searchTimerTreinador.current)
                clearTimeout(searchTimerTreinador.current);
        };
    }, [pesquisaTreinador, adversarioPossuiClube, escalaoSelecionado]);

    const adversarioFinal = adversarioNaPlataforma
        ? adversarioPossuiClube === true
            ? (clubeSelecionado?.name ?? "")
            : (equipaTreinadorSelecionada?.nome ?? "")
        : nomeManual.trim();

    const validarEAvancar = () => {
        if (!adversarioFinal || adversarioFinal.length < 2) return;
        setPasso(3);
    };

    const submitJogo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adversarioFinal || !dataJogo) return;
        const d = new Date(dataJogo);
        d.setHours(0, 0, 0, 0);
        if (d < hoje) {
            setErroData("Não é possível agendar um jogo em data já passada.");
            return;
        }
        if (dataJogo === hojeISO && horaInicio) {
            const agora = new Date();
            const [h, m] = horaInicio.split(":").map(Number);
            if (
                h < agora.getHours() ||
                (h === agora.getHours() && m <= agora.getMinutes())
            ) {
                setErroData("Não é possível agendar para uma hora já passada.");
                return;
            }
        }
        setErroData("");
        setSaving(true);
        await onCreate({
            adversario: adversarioFinal,
            data: dataJogo,
            casa_fora: casaFora,
            local,
            equipa_id: equipaId,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            adversario_org_id: adversarioNaPlataforma
                ? adversarioPossuiClube
                    ? (clubeSelecionado?.id ?? null)
                    : (equipaTreinadorSelecionada?.organization_id ?? null)
                : null,
        });
        setSaving(false);
    };

    const handleBack = () => {
        if (passo === 2) {
            setPasso(1);
            setAdversarioNaPlataforma(null);
            setAdversarioPossuiClube(null);
            setPesquisa("");
            setResultados([]);
            setClubeSelecionado(null);
            setEquipasAdv([]);
            setEquipaAdvSelecionada(null);
            setSemEquipas(false);
            setPesquisaTreinador("");
            setResultadosTreinador([]);
            setEquipaTreinadorSelecionada(null);
            setNomeManual("");
        } else if (passo === 3) {
            setPasso(2);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        {passo > 1 && (
                            <button
                                onClick={handleBack}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-lg"
                            >
                                ←
                            </button>
                        )}
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                🏆 Novo Jogo
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Passo {passo} de 3
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="h-1 bg-gray-100 dark:bg-gray-800">
                    <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${(passo / 3) * 100}%` }}
                    />
                </div>

                <div className="p-5 flex flex-col gap-5">
                    {passo === 1 && (
                        <>
                            {equipas.length > 1 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Equipa{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                        value={equipaId}
                                        onChange={(e) => {
                                            setEquipaId(e.target.value);
                                            setClubeSelecionado(null);
                                            setEquipasAdv([]);
                                            setEquipaAdvSelecionada(null);
                                            setSemEquipas(false);
                                            setEquipaTreinadorSelecionada(null);
                                            setPesquisaTreinador("");
                                            setResultadosTreinador([]);
                                        }}
                                    >
                                        {equipas.map((eq) => (
                                            <option key={eq.id} value={eq.id}>
                                                {eq.nome} ({eq.escalao})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {escalaoSelecionado && (
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                        {escalaoSelecionado}
                                    </span>
                                    Apenas adversários do mesmo escalão
                                </div>
                            )}

                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                                    O adversário está cadastrado na plataforma?
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Se a equipa adversária também usa o
                                    TeamAction, pode pesquisá-la.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setAdversarioNaPlataforma(true);
                                        setPasso(2);
                                    }}
                                    className="flex-1 border-2 border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1"
                                >
                                    <span className="text-xl">🔍</span>
                                    <span>Sim, pesquisar</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setAdversarioNaPlataforma(false);
                                        setPasso(2);
                                    }}
                                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1"
                                >
                                    <span className="text-xl">✏️</span>
                                    <span>Não, escrever</span>
                                </button>
                            </div>
                        </>
                    )}

                    {passo === 2 && adversarioNaPlataforma === true && (
                        <>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-3">
                                    A equipa adversária possui um clube?
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setAdversarioPossuiClube(true);
                                            setEquipaTreinadorSelecionada(null);
                                            setPesquisaTreinador("");
                                            setResultadosTreinador([]);
                                        }}
                                        className={`flex-1 border-2 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${adversarioPossuiClube === true ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                    >
                                        <span className="text-xl">🏟️</span>
                                        <span>Sim</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAdversarioPossuiClube(false);
                                            setClubeSelecionado(null);
                                            setPesquisa("");
                                            setResultados([]);
                                            setEquipasAdv([]);
                                            setEquipaAdvSelecionada(null);
                                            setSemEquipas(false);
                                        }}
                                        className={`flex-1 border-2 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${adversarioPossuiClube === false ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                    >
                                        <span className="text-xl">👤</span>
                                        <span>Não</span>
                                    </button>
                                </div>
                            </div>

                            {adversarioPossuiClube === true && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Pesquisar clube adversário{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            autoFocus
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                            placeholder="Nome do clube..."
                                            value={pesquisa}
                                            onChange={(e) => {
                                                setPesquisa(e.target.value);
                                                setClubeSelecionado(null);
                                            }}
                                        />
                                    </div>

                                    {buscando && (
                                        <p className="text-xs text-gray-400 text-center">
                                            A pesquisar...
                                        </p>
                                    )}

                                    {!buscando &&
                                        resultadosMostrar.length > 0 && (
                                            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                                                {resultadosMostrar.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => {
                                                            setClubeSelecionado(
                                                                c,
                                                            );
                                                            setPesquisa(c.name);
                                                            setResultados([]);
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${clubeSelecionado?.id === c.id ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                                                    >
                                                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                            {c.name}
                                                        </p>
                                                        {(c.cidade ||
                                                            c.desporto) && (
                                                            <p className="text-xs text-gray-400">
                                                                {[
                                                                    c.desporto,
                                                                    c.cidade,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(
                                                                        " · ",
                                                                    )}
                                                            </p>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                    {!buscando &&
                                        pesquisa.trim().length >= 2 &&
                                        resultadosMostrar.length === 0 &&
                                        !clubeSelecionado && (
                                            <p className="text-sm text-gray-400 text-center py-2">
                                                Nenhum clube encontrado na
                                                plataforma.
                                            </p>
                                        )}

                                    {clubeSelecionado && loadingEquipas && (
                                        <p className="text-xs text-gray-400 text-center">
                                            A carregar equipas...
                                        </p>
                                    )}

                                    {clubeSelecionado &&
                                        !loadingEquipas &&
                                        semEquipas && (
                                            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm font-medium">
                                                <span>⚠️</span>
                                                <span>
                                                    Este clube ainda não tem
                                                    equipas cadastradas na
                                                    plataforma.
                                                </span>
                                            </div>
                                        )}

                                    {clubeSelecionado &&
                                        !loadingEquipas &&
                                        !semEquipas &&
                                        equipasAdv.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    Selecionar equipa{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                                    value={
                                                        equipaAdvSelecionada?.id ??
                                                        ""
                                                    }
                                                    onChange={(e) => {
                                                        const found =
                                                            equipasAdv.find(
                                                                (eq) =>
                                                                    eq.id ===
                                                                    e.target
                                                                        .value,
                                                            ) ?? null;
                                                        setEquipaAdvSelecionada(
                                                            found,
                                                        );
                                                    }}
                                                >
                                                    <option value="">
                                                        Escolher equipa...
                                                    </option>
                                                    {equipasAdv.map((eq) => (
                                                        <option
                                                            key={eq.id}
                                                            value={eq.id}
                                                        >
                                                            {eq.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                    <button
                                        onClick={validarEAvancar}
                                        disabled={
                                            !clubeSelecionado ||
                                            semEquipas ||
                                            !equipaAdvSelecionada
                                        }
                                        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                                    >
                                        Continuar →
                                    </button>
                                </>
                            )}

                            {adversarioPossuiClube === false && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Pesquisar organização do treinador{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            autoFocus
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                            placeholder="Nome da equipa ou do treinador..."
                                            value={pesquisaTreinador}
                                            onChange={(e) => {
                                                setPesquisaTreinador(
                                                    e.target.value,
                                                );
                                                setEquipaTreinadorSelecionada(
                                                    null,
                                                );
                                            }}
                                        />
                                    </div>

                                    {buscandoTreinador && (
                                        <p className="text-xs text-gray-400 text-center">
                                            A pesquisar...
                                        </p>
                                    )}

                                    {!buscandoTreinador &&
                                        pesquisaTreinador.trim().length >= 2 &&
                                        resultadosTreinador.length > 0 && (
                                            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                                                {resultadosTreinador.map(
                                                    (e) => (
                                                        <button
                                                            key={
                                                                e.organization_id
                                                            }
                                                            onClick={() => {
                                                                setEquipaTreinadorSelecionada(
                                                                    e,
                                                                );
                                                                setPesquisaTreinador(
                                                                    e.nome,
                                                                );
                                                                setResultadosTreinador(
                                                                    [],
                                                                );
                                                            }}
                                                            className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${equipaTreinadorSelecionada?.organization_id === e.organization_id ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                                                        >
                                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                                {e.nome}
                                                            </p>
                                                            {e.treinador_nome && (
                                                                <p className="text-xs text-gray-400">
                                                                    Treinador:{" "}
                                                                    {
                                                                        e.treinador_nome
                                                                    }
                                                                </p>
                                                            )}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                    {!buscandoTreinador &&
                                        pesquisaTreinador.trim().length >= 2 &&
                                        resultadosTreinador.length === 0 &&
                                        !equipaTreinadorSelecionada && (
                                            <p className="text-sm text-gray-400 text-center py-2">
                                                Nenhuma equipa de treinador
                                                encontrada.
                                            </p>
                                        )}

                                    <button
                                        onClick={validarEAvancar}
                                        disabled={!equipaTreinadorSelecionada}
                                        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                                    >
                                        Continuar →
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {passo === 2 && adversarioNaPlataforma === false && (
                        <>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                                    Criar equipa adversária
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Esta equipa não está na plataforma. Será
                                    criada como equipa fictícia (🤖) apenas para
                                    registar este jogo.
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Nome da equipa adversária{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    autoFocus
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    placeholder="Ex: FC Maia"
                                    value={nomeManual}
                                    onChange={(e) =>
                                        setNomeManual(e.target.value)
                                    }
                                    maxLength={100}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        nomeManual.trim().length >= 2 &&
                                        validarEAvancar()
                                    }
                                />
                                <p className="text-xs text-gray-400 text-right">
                                    {nomeManual.length}/100
                                </p>
                            </div>
                            <button
                                onClick={validarEAvancar}
                                disabled={nomeManual.trim().length < 2}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                            >
                                Continuar →
                            </button>
                        </>
                    )}

                    {passo === 3 && (
                        <form
                            onSubmit={submitJogo}
                            className="flex flex-col gap-4"
                        >
                            <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm font-semibold text-amber-800 dark:text-amber-300">
                                vs {adversarioFinal}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Data <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    min={hojeISO}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    value={dataJogo}
                                    onChange={(e) => {
                                        setDataJogo(e.target.value);
                                        setErroData("");
                                    }}
                                    required
                                />
                                {erroData && (
                                    <p className="text-xs text-red-500">
                                        {erroData}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Casa / Fora{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    value={casaFora}
                                    onChange={(e) =>
                                        setCasaFora(e.target.value)
                                    }
                                >
                                    <option value="casa">Casa</option>
                                    <option value="fora">Fora</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Hora de início{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-1">
                                        <select
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-2 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                            value={
                                                horaInicio
                                                    ? horaInicio.split(":")[0]
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const h = e.target.value;
                                                const m = horaInicio
                                                    ? horaInicio.split(":")[1]
                                                    : "00";
                                                if (h && m) {
                                                    const newVal = `${h}:${m}`;
                                                    setHoraInicio(newVal);
                                                    const totalMin =
                                                        parseInt(h) * 60 +
                                                        parseInt(m) +
                                                        90;
                                                    const fimH =
                                                        Math.floor(
                                                            totalMin / 60,
                                                        ) % 24;
                                                    const fimM = totalMin % 60;
                                                    setHoraFim(
                                                        `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                                    );
                                                } else {
                                                    setHoraInicio(
                                                        h ? `${h}:00` : "",
                                                    );
                                                }
                                            }}
                                            required
                                        >
                                            <option value="">HH</option>
                                            {Array.from(
                                                { length: 24 },
                                                (_, i) => (
                                                    <option
                                                        key={i}
                                                        value={String(
                                                            i,
                                                        ).padStart(2, "0")}
                                                    >
                                                        {String(i).padStart(
                                                            2,
                                                            "0",
                                                        )}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <span className="flex items-center text-gray-500 font-bold">
                                            :
                                        </span>
                                        <select
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-2 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                            value={
                                                horaInicio
                                                    ? horaInicio.split(":")[1]
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const m = e.target.value;
                                                const h = horaInicio
                                                    ? horaInicio.split(":")[0]
                                                    : "";
                                                if (h && m) {
                                                    const newVal = `${h}:${m}`;
                                                    setHoraInicio(newVal);
                                                    const totalMin =
                                                        parseInt(h) * 60 +
                                                        parseInt(m) +
                                                        90;
                                                    const fimH =
                                                        Math.floor(
                                                            totalMin / 60,
                                                        ) % 24;
                                                    const fimM = totalMin % 60;
                                                    setHoraFim(
                                                        `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                                    );
                                                }
                                            }}
                                            required
                                        >
                                            <option value="">MM</option>
                                            {["00", "15", "30", "45"].map(
                                                (m) => (
                                                    <option key={m} value={m}>
                                                        {m}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Hora terminada{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        value={horaFim}
                                        readOnly
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Local
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    placeholder="Ex: Pavilhão Municipal"
                                    value={local}
                                    onChange={(e) => setLocal(e.target.value)}
                                    maxLength={100}
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow"
                                >
                                    {saving ? "A agendar..." : "Agendar Jogo"}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Componente principal ─────────────────────────────────────────────── */
export default function Jogos({
    equipas,
    autoOpenModal = false,
}: {
    equipas: Equipa[];
    autoOpenModal?: boolean;
}) {
    const [jogos, setJogos] = useState<Jogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNovoJogo, setShowNovoJogo] = useState(autoOpenModal);
    const [modalResultado, setModalResultado] = useState<Jogo | null>(null);
    const [modalEditarData, setModalEditarData] = useState<Jogo | null>(null);
    const [modalDetalhe, setModalDetalhe] = useState<Jogo | null>(null);
    const [toast, setToast] = useState<{
        msg: string;
        tipo: "ok" | "erro";
    } | null>(null);

    const showToast = useCallback((msg: string, tipo: "ok" | "erro" = "ok") => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 2500);
    }, []);

    useEffect(() => {
        fetch("/api/jogos")
            .then((r) => (r.ok ? r.json() : []))
            .then((data: Jogo[]) => setJogos(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    /* ── Stats ── */
    const realizados = jogos.filter(
        (j) => j.estado === "realizado" && j.resultado_nos !== null,
    );
    const vitorias = realizados.filter(
        (j) => j.resultado_nos! > j.resultado_adv!,
    ).length;
    const empates = realizados.filter(
        (j) => j.resultado_nos === j.resultado_adv,
    ).length;
    const derrotas = realizados.filter(
        (j) => j.resultado_nos! < j.resultado_adv!,
    ).length;
    const proximoJogo = jogos.find((j) => {
        if (j.estado !== "agendado") return false;
        const dataJogo = new Date(j.data);
        dataJogo.setHours(0, 0, 0, 0);
        if (dataJogo > hoje) return true;
        if (dataJogo < hoje) return false;
        // Mesmo dia: verificar se hora_fim já passou
        if (j.hora_fim) {
            const agora = new Date();
            const [h, m] = j.hora_fim.split(":").map(Number);
            if (
                h < agora.getHours() ||
                (h === agora.getHours() && m <= agora.getMinutes())
            ) {
                return false;
            }
        }
        return true;
    });

    /* ── Criar jogo ── */
    const criarJogo = async (data: {
        adversario: string;
        data: string;
        casa_fora: string;
        local: string;
        equipa_id: string;
        hora_inicio: string;
        hora_fim: string;
        adversario_org_id: string | null;
    }) => {
        const res = await fetch("/api/jogos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const novo: Jogo = await res.json();
            setJogos((prev) => [novo, ...prev]);
            setShowNovoJogo(false);
            showToast("Jogo agendado com sucesso!");
        } else {
            showToast(await res.text(), "erro");
        }
    };

    /* ── Registar resultado ── */
    const registarResultado = async (id: string, nos: number, adv: number) => {
        const res = await fetch(`/api/jogos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resultado_nos: nos,
                resultado_adv: adv,
                estado: "realizado",
            }),
        });
        if (res.ok) {
            setJogos((prev) =>
                prev.map((j) =>
                    j.id === id
                        ? {
                              ...j,
                              resultado_nos: nos,
                              resultado_adv: adv,
                              estado: "realizado",
                          }
                        : j,
                ),
            );
            setModalResultado(null);
            showToast("Resultado registado!");
        } else {
            showToast("Erro ao registar resultado.", "erro");
        }
    };

    /* ── Editar data/hora ── */
    const editarData = async (
        id: string,
        data: string,
        horaInicio: string,
        horaFim: string,
    ) => {
        const res = await fetch(`/api/jogos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data,
                hora_inicio: horaInicio || null,
                hora_fim: horaFim || null,
            }),
        });
        if (res.ok) {
            setJogos((prev) =>
                prev.map((j) =>
                    j.id === id
                        ? {
                              ...j,
                              data,
                              hora_inicio: horaInicio || null,
                              hora_fim: horaFim || null,
                          }
                        : j,
                ),
            );
            setModalEditarData(null);
            showToast("Data alterada com sucesso!");
        } else {
            showToast("Erro ao alterar data.", "erro");
        }
    };

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-6">
            {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

            {showNovoJogo && (
                <ModalNovoJogo
                    equipas={equipas}
                    onCreate={criarJogo}
                    onClose={() => setShowNovoJogo(false)}
                />
            )}

            {modalResultado && (
                <ModalResultado
                    jogo={modalResultado}
                    onSave={registarResultado}
                    onClose={() => setModalResultado(null)}
                />
            )}

            {modalEditarData && (
                <ModalEditarData
                    jogo={modalEditarData}
                    onSave={editarData}
                    onClose={() => setModalEditarData(null)}
                />
            )}

            {modalDetalhe && (
                <ModalDetalheJogo
                    jogo={modalDetalhe}
                    onClose={() => setModalDetalhe(null)}
                />
            )}

            {/* ── Cabeçalho ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center gap-3">
                        <span>🏆</span> Jogos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Planeie e acompanhe jogos e competições.
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow transition-all flex items-center gap-2"
                    onClick={() => setShowNovoJogo(true)}
                >
                    <span className="text-base">＋</span> Novo Jogo
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-xl p-5 shadow-sm flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Jogos Realizados
                    </span>
                    <span className="text-3xl font-bold text-orange-600">
                        {realizados.length}
                    </span>
                    {realizados.length > 0 && (
                        <span className="text-xs text-gray-400">
                            {vitorias}V · {empates}E · {derrotas}D
                        </span>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl p-5 shadow-sm flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Próximo Jogo
                    </span>
                    {proximoJogo ? (
                        <>
                            <span className="text-lg font-bold text-green-600 truncate">
                                vs {proximoJogo.adversario}
                            </span>
                            <span className="text-xs text-gray-400">
                                {formatData(proximoJogo.data)} ·{" "}
                                {proximoJogo.casa_fora === "casa"
                                    ? "Casa"
                                    : "Fora"}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-400 mt-1">
                            Sem jogos agendados
                        </span>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-xl p-5 shadow-sm flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Total Agendados
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                        {jogos.filter((j) => j.estado === "agendado").length}
                    </span>
                    <span className="text-xs text-gray-400">
                        jogos por realizar
                    </span>
                </div>
            </div>

            {/* ── Lista de jogos ── */}
            <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
                    <span>🏅</span> Todos os Jogos
                </h3>

                {loading ? (
                    <div className="flex justify-center py-12 text-gray-400 text-sm">
                        A carregar...
                    </div>
                ) : jogos.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                        <span className="text-5xl">🏟️</span>
                        <p className="text-base font-medium">
                            Nenhum jogo registado.
                        </p>
                        <button
                            onClick={() => setShowNovoJogo(true)}
                            className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all"
                        >
                            Agendar primeiro jogo
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Data
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Adversário
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Local
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Estado
                                    </th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Resultado
                                    </th>
                                    <th className="p-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {jogos.map((j) => {
                                    const dataJogoDate = new Date(j.data);
                                    dataJogoDate.setHours(0, 0, 0, 0);
                                    let jogoTerminado = dataJogoDate < hoje;
                                    if (
                                        !jogoTerminado &&
                                        dataJogoDate.getTime() ===
                                            hoje.getTime() &&
                                        j.hora_fim
                                    ) {
                                        const agora = new Date();
                                        const [fh, fm] = j.hora_fim
                                            .split(":")
                                            .map(Number);
                                        if (
                                            fh < agora.getHours() ||
                                            (fh === agora.getHours() &&
                                                fm <= agora.getMinutes())
                                        ) {
                                            jogoTerminado = true;
                                        }
                                    }
                                    const semResultado =
                                        j.estado !== "cancelado" &&
                                        j.resultado_nos === null &&
                                        jogoTerminado;
                                    return (
                                        <tr
                                            key={j.id}
                                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all"
                                        >
                                            <td className="p-3 font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                {formatData(j.data)}
                                                {j.hora_inicio && (
                                                    <span className="text-xs text-gray-400 ml-1">
                                                        {j.hora_inicio}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1">
                                                    {j.adversario_fake && (
                                                        <span title="Equipa fictícia (não está na plataforma)">
                                                            🤖
                                                        </span>
                                                    )}
                                                    {j.adversario}
                                                </p>
                                            </td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">
                                                {j.casa_fora === "casa"
                                                    ? "🏠 Casa"
                                                    : "✈️ Fora"}
                                                {j.local && (
                                                    <span className="text-xs text-gray-400 block">
                                                        {j.local}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <EstadoBadge
                                                        estado={j.estado}
                                                    />
                                                    {j.estado === "agendado" &&
                                                        !j.adversario_fake &&
                                                        j.resposta_adversario && (
                                                            <RespostaAdversarioBadge
                                                                resposta={
                                                                    j.resposta_adversario
                                                                }
                                                            />
                                                        )}
                                                    {j.resposta_adversario ===
                                                        "nova_proposta" &&
                                                        j.proposta_data && (
                                                            <span className="text-[10px] text-purple-600 dark:text-purple-400">
                                                                Proposta:{" "}
                                                                {new Date(
                                                                    j.proposta_data,
                                                                ).toLocaleDateString(
                                                                    "pt-PT",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                    },
                                                                )}
                                                                {j.proposta_hora &&
                                                                    ` ${j.proposta_hora}`}
                                                            </span>
                                                        )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {j.resultado_nos !== null &&
                                                j.resultado_adv !== null ? (
                                                    <ResultadoBadge
                                                        nos={j.resultado_nos}
                                                        adv={j.resultado_adv}
                                                    />
                                                ) : semResultado ? (
                                                    <span className="text-xs text-gray-400">
                                                        Sem resultado
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300 dark:text-gray-600">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() =>
                                                            setModalDetalhe(j)
                                                        }
                                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all whitespace-nowrap"
                                                    >
                                                        👁️ Ver
                                                    </button>
                                                    {/* Botões de resposta para jogos espelhados (agendados pelo adversário) */}
                                                    {j.estado === "agendado" &&
                                                        !jogoTerminado &&
                                                        j.mirror_game_id &&
                                                        j.resposta_adversario ===
                                                            "pendente" && (
                                                            <BotoesRespostaJogo
                                                                jogo={j}
                                                                onResponded={(
                                                                    resposta,
                                                                ) => {
                                                                    setJogos(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    x,
                                                                                ) =>
                                                                                    x.id ===
                                                                                    j.id
                                                                                        ? {
                                                                                              ...x,
                                                                                              resposta_adversario:
                                                                                                  resposta,
                                                                                          }
                                                                                        : x,
                                                                            ),
                                                                    );
                                                                    showToast(
                                                                        resposta ===
                                                                            "aceite"
                                                                            ? "Jogo confirmado!"
                                                                            : resposta ===
                                                                                "recusado"
                                                                              ? "Jogo recusado."
                                                                              : "Proposta enviada!",
                                                                    );
                                                                }}
                                                            />
                                                        )}
                                                    {semResultado && (
                                                        <button
                                                            onClick={() =>
                                                                setModalResultado(
                                                                    j,
                                                                )
                                                            }
                                                            className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all whitespace-nowrap"
                                                        >
                                                            + Resultado
                                                        </button>
                                                    )}
                                                    {j.estado === "agendado" &&
                                                        !jogoTerminado && (
                                                            <button
                                                                onClick={() =>
                                                                    setModalEditarData(
                                                                        j,
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all whitespace-nowrap"
                                                            >
                                                                📅 Editar
                                                            </button>
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
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
