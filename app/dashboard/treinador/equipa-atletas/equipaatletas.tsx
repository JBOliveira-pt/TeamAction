"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

type Atleta = {
    id: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
    estado: string;
    equipa_id: string | null;
    equipa_nome: string | null;
    user_id: string | null;
};

type AtletaResultado = {
    id: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
    estado: string;
    equipa_id: string | null;
    equipa_nome: string | null;
    user_id: string | null;
    image_url: string | null;
};

type Equipa = { id: string; nome: string };

type ConvitePendente = {
    id: string;
    atleta_nome: string;
    equipa_nome: string | null;
    created_at: string;
};

const estadoCor: Record<string, string> = {
    Ativo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Lesionado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Suspenso:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Inativo: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

/* ── Toast ── */
function Toast({ msg, tipo }: { msg: string; tipo: "ok" | "erro" }) {
    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 ${tipo === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
        >
            {tipo === "ok" ? "✓" : "✕"} {msg}
        </div>
    );
}

/* ── Modal Todos os Atletas ── */
function ModalTodosAtletas({
    equipas,
    onClose,
    onConviteEnviado,
}: {
    equipas: Equipa[];
    onClose: () => void;
    onConviteEnviado: (atletaNome: string) => void;
}) {
    const [todos, setTodos] = useState<AtletaResultado[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("");
    const [atletaSelecionado, setAtletaSelecionado] =
        useState<AtletaResultado | null>(null);
    const [equipaId, setEquipaId] = useState(equipas[0]?.id ?? "");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        fetch("/api/atletas/todos")
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setTodos(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const visiveis = todos.filter((a) =>
        a.nome.toLowerCase().includes(filtro.toLowerCase()),
    );

    const enviarConvite = async () => {
        if (!atletaSelecionado) return;
        setErro("");
        setEnviando(true);
        const equipa = equipas.find((e) => e.id === equipaId);
        const res = await fetch("/api/convites-equipa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                atleta_id: atletaSelecionado.id,
                equipa_id: equipaId || undefined,
                equipa_nome: equipa?.nome,
            }),
        });
        setEnviando(false);
        if (res.ok) {
            onConviteEnviado(atletaSelecionado.nome);
            onClose();
        } else {
            setErro(await res.text());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                            Todos os Atletas
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Seleciona um atleta para convidar
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
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
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                    <input
                        autoFocus
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Filtrar por nome..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1.5">
                    {loading && (
                        <p className="text-xs text-gray-400 text-center py-4">
                            A carregar...
                        </p>
                    )}
                    {!loading && visiveis.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">
                            Nenhum atleta encontrado.
                        </p>
                    )}
                    {visiveis.map((a) => (
                        <button
                            key={a.id}
                            onClick={() => {
                                setAtletaSelecionado(a);
                                setErro("");
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${atletaSelecionado?.id === a.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                        >
                            <div className="flex items-center gap-3">
                                {a.image_url ? (
                                    <Image
                                        src={a.image_url}
                                        alt={a.nome}
                                        width={36}
                                        height={36}
                                        className="w-9 h-9 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                                            {a.nome.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                        {a.nome}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {a.posicao ?? "—"}
                                        {a.numero_camisola
                                            ? ` · #${a.numero_camisola}`
                                            : ""}
                                        {a.equipa_nome
                                            ? ` · ${a.equipa_nome}`
                                            : ""}
                                    </p>
                                </div>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${estadoCor[a.estado] ?? estadoCor.Inativo}`}
                                >
                                    {a.estado}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
                {atletaSelecionado && (
                    <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                        <div className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-semibold text-blue-800 dark:text-blue-300">
                            ✓ {atletaSelecionado.nome} selecionado
                        </div>
                        {equipas.length > 0 && (
                            <select
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={equipaId}
                                onChange={(e) => setEquipaId(e.target.value)}
                            >
                                <option value="">Sem equipa definida</option>
                                {equipas.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nome}
                                    </option>
                                ))}
                            </select>
                        )}
                        {erro && <p className="text-xs text-red-500">{erro}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={enviarConvite}
                                disabled={enviando}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all"
                            >
                                {enviando ? "A enviar..." : "Enviar Convite"}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Modal Adicionar Atleta (pesquisa + convite) ── */
function ModalAdicionarAtleta({
    equipas,
    onClose,
    onConviteEnviado,
}: {
    equipas: Equipa[];
    onClose: () => void;
    onConviteEnviado: (atletaNome: string) => void;
}) {
    const [pesquisa, setPesquisa] = useState("");
    const [resultados, setResultados] = useState<AtletaResultado[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [atletaSelecionado, setAtletaSelecionado] =
        useState<AtletaResultado | null>(null);
    const [equipaId, setEquipaId] = useState(equipas[0]?.id ?? "");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        if (pesquisa.trim().length < 2) {
            timer.current = setTimeout(() => setResultados([]), 0);
        } else {
            timer.current = setTimeout(async () => {
                setBuscando(true);
                const res = await fetch(
                    `/api/atletas/pesquisar?q=${encodeURIComponent(pesquisa.trim())}`,
                );
                if (res.ok) setResultados(await res.json());
                setBuscando(false);
            }, 300);
        }
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [pesquisa]);

    const enviarConvite = async () => {
        if (!atletaSelecionado) return;
        setErro("");
        setEnviando(true);
        const equipa = equipas.find((e) => e.id === equipaId);
        const res = await fetch("/api/convites-equipa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                atleta_id: atletaSelecionado.id,
                equipa_id: equipaId || undefined,
                equipa_nome: equipa?.nome,
            }),
        });
        setEnviando(false);
        if (res.ok) {
            onConviteEnviado(atletaSelecionado.nome);
            onClose();
        } else {
            setErro(await res.text());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                            Adicionar Atleta
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Pesquisa um atleta registado na plataforma
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

                <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
                    {/* Campo de pesquisa */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                            Nome do atleta
                        </label>
                        <input
                            autoFocus
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Pesquisar por nome..."
                            value={pesquisa}
                            onChange={(e) => {
                                setPesquisa(e.target.value);
                                setAtletaSelecionado(null);
                                setErro("");
                            }}
                        />
                    </div>

                    {/* Resultados */}
                    {buscando && (
                        <p className="text-xs text-gray-400 text-center">
                            A pesquisar...
                        </p>
                    )}

                    {!buscando && resultados.length > 0 && (
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                            {resultados.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => {
                                        setAtletaSelecionado(a);
                                        setPesquisa(a.nome);
                                        setResultados([]);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${atletaSelecionado?.id === a.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                {a.nome}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {a.posicao ?? "—"}
                                                {a.numero_camisola
                                                    ? ` · #${a.numero_camisola}`
                                                    : ""}
                                                {a.equipa_nome
                                                    ? ` · ${a.equipa_nome}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoCor[a.estado] ?? estadoCor.Inativo}`}
                                        >
                                            {a.estado}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!buscando &&
                        pesquisa.trim().length >= 2 &&
                        resultados.length === 0 &&
                        !atletaSelecionado && (
                            <p className="text-sm text-gray-400 text-center py-2">
                                Nenhum atleta encontrado.
                            </p>
                        )}

                    {/* Seleção de equipa */}
                    {atletaSelecionado && (
                        <>
                            <div className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-semibold text-blue-800 dark:text-blue-300">
                                ✓ {atletaSelecionado.nome} selecionado
                            </div>

                            {equipas.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Equipa de destino
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={equipaId}
                                        onChange={(e) =>
                                            setEquipaId(e.target.value)
                                        }
                                    >
                                        <option value="">
                                            Sem equipa definida
                                        </option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-xs text-yellow-800 dark:text-yellow-300">
                                🔔 Será enviada uma notificação ao atleta para
                                aceitar ou recusar o convite.
                            </div>

                            {erro && (
                                <p className="text-xs text-red-500">{erro}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                    <button
                        onClick={enviarConvite}
                        disabled={!atletaSelecionado || enviando}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all"
                    >
                        {enviando ? "A enviar..." : "Enviar Convite"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal Criar Atleta (wizard multi-step) ── */
type WizardStep =
    | "choice"
    | "fake-form"
    | "email-check"
    | "invite-internal"
    | "invite-external";

function ModalCriarAtleta({
    equipas,
    onClose,
    onCriado,
}: {
    equipas: Equipa[];
    onClose: () => void;
    onCriado: (nome: string, suspenso: boolean) => void;
}) {
    const [step, setStep] = useState<WizardStep>("choice");

    // Fake athlete form
    const [nome, setNome] = useState("");
    const [posicao, setPosicao] = useState("");
    const [numeroCamisola, setNumeroCamisola] = useState("");
    const [equipaId, setEquipaId] = useState(equipas[0]?.id ?? "");
    const [maoDominante, setMaoDominante] = useState("");

    // Real athlete email check
    const [email, setEmail] = useState("");
    const [verificando, setVerificando] = useState(false);
    const [emailResult, setEmailResult] = useState<{
        existe: boolean;
        nome?: string;
        account_type?: string | null;
        menor_idade?: boolean;
        responsavel_nome?: string | null;
        responsavel_email?: string | null;
        responsavel_ativo?: boolean;
    } | null>(null);

    // Shared
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-verify email
    useEffect(() => {
        if (step !== "email-check") return;
        setEmailResult(null);
        if (timer.current) clearTimeout(timer.current);
        const emailTrimmed = email.trim().toLowerCase();
        if (!emailTrimmed.includes("@") || emailTrimmed.length < 5) return;
        timer.current = setTimeout(async () => {
            setVerificando(true);
            try {
                const res = await fetch(
                    `/api/atletas/verificar-email?email=${encodeURIComponent(emailTrimmed)}`,
                );
                if (res.ok) setEmailResult(await res.json());
            } finally {
                setVerificando(false);
            }
        }, 400);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [email, step]);

    // Pre-fill name from verification when going to invite-internal
    useEffect(() => {
        if (step === "invite-internal" && emailResult?.nome && !nome) {
            setNome(emailResult.nome);
        }
    }, [step, emailResult, nome]);

    const criarAtleta = async (comEmail: boolean) => {
        if (!nome.trim()) {
            setErro("O nome é obrigatório.");
            return;
        }
        setErro("");
        setEnviando(true);
        const equipa = equipas.find((e) => e.id === equipaId);
        const res = await fetch("/api/treinador/criar-atleta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: nome.trim(),
                posicao: posicao.trim() || null,
                numero_camisola: numeroCamisola
                    ? parseInt(numeroCamisola)
                    : null,
                equipa_id: equipaId || null,
                equipa_nome: equipa?.nome ?? null,
                email: comEmail ? email.trim() : null,
                mao_dominante: maoDominante || null,
            }),
        });
        setEnviando(false);
        if (res.ok) {
            const data = await res.json();
            onCriado(nome.trim(), data.suspenso === true);
            onClose();
        } else {
            setErro(await res.text());
        }
    };

    const closeIcon = (
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
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
    );

    const backButton = (target: WizardStep) => (
        <button
            onClick={() => {
                setErro("");
                setStep(target);
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
            ← Voltar
        </button>
    );

    /* ── Step indicator ── */
    const stepNumber =
        step === "choice"
            ? 1
            : step === "fake-form" || step === "email-check"
              ? 2
              : 3;
    const totalSteps = step === "fake-form" ? 2 : step === "choice" ? 1 : 3;

    const stepIndicator = (
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-gray-100 dark:border-gray-700">
            {Array.from({ length: totalSteps > 1 ? totalSteps : 3 }).map(
                (_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < stepNumber ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    />
                ),
            )}
            <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                {stepNumber}/{totalSteps > 1 ? totalSteps : 3}
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                {/* ═══════ STEP 1: CHOICE ═══════ */}
                {step === "choice" && (
                    <>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    Adicionar Atleta
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Que tipo de atleta queres adicionar?
                                </p>
                            </div>
                            {closeIcon}
                        </div>
                        {stepIndicator}
                        <div className="px-5 py-6 flex flex-col gap-3">
                            <button
                                onClick={() => setStep("email-check")}
                                className="w-full p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">👤</span>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            Atleta Real
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Verificar se já existe na plataforma
                                            e enviar convite
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setStep("fake-form")}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🤖</span>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                            Atleta Fictício
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Criar um perfil sem conta real
                                            (treinos, testes, etc.)
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700"></div>
                    </>
                )}

                {/* ═══════ STEP 2A: FAKE FORM ═══════ */}
                {step === "fake-form" && (
                    <>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    Atleta Fictício
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Perfil sem vínculo a conta real
                                </p>
                            </div>
                            {closeIcon}
                        </div>
                        {stepIndicator}
                        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                    Nome Completo{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <input
                                    autoFocus
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="Ex: João Silva"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Posição
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={posicao}
                                        onChange={(e) =>
                                            setPosicao(e.target.value)
                                        }
                                    >
                                        <option value="">Seleciona</option>
                                        <option value="Guarda-Redes">Guarda-Redes</option>
                                        <option value="Defesa Central">Defesa Central</option>
                                        <option value="Defesa Esquerdo">Defesa Esquerdo</option>
                                        <option value="Defesa Direito">Defesa Direito</option>
                                        <option value="Médio Defensivo">Médio Defensivo</option>
                                        <option value="Médio Centro">Médio Centro</option>
                                        <option value="Médio Ofensivo">Médio Ofensivo</option>
                                        <option value="Extremo Esquerdo">Extremo Esquerdo</option>
                                        <option value="Extremo Direito">Extremo Direito</option>
                                        <option value="Avançado Centro">Avançado Centro</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Nº Camisola
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="—"
                                        value={numeroCamisola}
                                        onChange={(e) =>
                                            setNumeroCamisola(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            {equipas.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Equipa
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={equipaId}
                                        onChange={(e) =>
                                            setEquipaId(e.target.value)
                                        }
                                    >
                                        <option value="">Sem equipa</option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                    Mão Dominante
                                </label>
                                <select
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={maoDominante}
                                    onChange={(e) =>
                                        setMaoDominante(e.target.value)
                                    }
                                >
                                    <option value="">Seleciona</option>
                                    <option value="direita">Direita</option>
                                    <option value="esquerda">Esquerda</option>
                                    <option value="ambidestro">
                                        Ambidestro
                                    </option>
                                </select>
                            </div>
                            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    🤖 Este atleta será criado sem e-mail e sem
                                    vínculo a nenhum perfil real da plataforma.
                                </p>
                            </div>
                            {erro && (
                                <p className="text-xs text-red-500">{erro}</p>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                            {backButton("choice")}
                            <button
                                onClick={() => criarAtleta(false)}
                                disabled={!nome.trim() || enviando}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all"
                            >
                                {enviando
                                    ? "A criar..."
                                    : "Criar Atleta Fictício"}
                            </button>
                        </div>
                    </>
                )}

                {/* ═══════ STEP 2B: EMAIL CHECK ═══════ */}
                {step === "email-check" && (
                    <>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    Verificar Atleta
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Introduz o e-mail do atleta para verificar
                                </p>
                            </div>
                            {closeIcon}
                        </div>
                        {stepIndicator}
                        <div className="px-5 py-5 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                    E-mail do atleta
                                </label>
                                <input
                                    autoFocus
                                    type="email"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="exemplo@email.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErro("");
                                    }}
                                />
                            </div>
                            {verificando && (
                                <p className="text-xs text-gray-400 text-center">
                                    A verificar...
                                </p>
                            )}
                            {!verificando &&
                                emailResult?.existe &&
                                emailResult.account_type &&
                                emailResult.account_type !== "atleta" && (
                                    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 p-4 flex flex-col gap-2">
                                        <p className="text-sm font-bold text-red-800 dark:text-red-300">
                                            ✕ Não é possível adicionar como
                                            atleta
                                        </p>
                                        {emailResult.nome && (
                                            <p className="text-xs text-red-700 dark:text-red-400">
                                                Nome:{" "}
                                                <span className="font-semibold">
                                                    {emailResult.nome}
                                                </span>
                                            </p>
                                        )}
                                        <p className="text-xs text-red-700 dark:text-red-400">
                                            Este utilizador está registado como{" "}
                                            <strong className="capitalize">
                                                {emailResult.account_type}
                                            </strong>
                                            . Apenas contas do tipo{" "}
                                            <strong>Atleta</strong> podem ser
                                            adicionadas à equipa.
                                        </p>
                                    </div>
                                )}
                            {!verificando &&
                                emailResult?.existe &&
                                (!emailResult.account_type ||
                                    emailResult.account_type === "atleta") && (
                                    <div className="flex flex-col gap-3">
                                        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 p-4 flex flex-col gap-2">
                                            <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                                ✓ Atleta encontrado na
                                                plataforma
                                            </p>
                                            {emailResult.nome && (
                                                <p className="text-xs text-green-700 dark:text-green-400">
                                                    Nome:{" "}
                                                    <span className="font-semibold">
                                                        {emailResult.nome}
                                                    </span>
                                                </p>
                                            )}
                                            <p className="text-xs text-green-700 dark:text-green-400">
                                                Podes enviar um convite interno
                                                para se juntar à tua equipa.
                                            </p>
                                        </div>
                                        {/* Menor de idade com responsável ativo */}
                                        {emailResult.menor_idade &&
                                            emailResult.responsavel_ativo && (
                                                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 flex flex-col gap-2">
                                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                                        👶 Atleta menor de idade
                                                    </p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-400">
                                                        Responsável:{" "}
                                                        <span className="font-semibold">
                                                            {
                                                                emailResult.responsavel_nome
                                                            }
                                                        </span>
                                                        {emailResult.responsavel_email && (
                                                            <span className="text-blue-500 dark:text-blue-400">
                                                                {" "}
                                                                (
                                                                {
                                                                    emailResult.responsavel_email
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-400">
                                                        O convite será enviado
                                                        ao responsável para
                                                        aprovação antes de o
                                                        atleta ser adicionado à
                                                        equipa.
                                                    </p>
                                                </div>
                                            )}
                                        {/* Menor de idade SEM responsável ativo */}
                                        {emailResult.menor_idade &&
                                            !emailResult.responsavel_ativo && (
                                                <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 p-4 flex flex-col gap-2">
                                                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                                                        ⚠️ Responsável não
                                                        encontrado
                                                    </p>
                                                    <p className="text-xs text-orange-700 dark:text-orange-400">
                                                        Este atleta é menor de
                                                        idade mas ainda não tem
                                                        um responsável com
                                                        perfil ativo na
                                                        plataforma.
                                                        {emailResult.responsavel_email && (
                                                            <span>
                                                                {" "}
                                                                E-mail indicado:{" "}
                                                                <strong>
                                                                    {
                                                                        emailResult.responsavel_email
                                                                    }
                                                                </strong>
                                                                .
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-orange-700 dark:text-orange-400">
                                                        O pedido ficará{" "}
                                                        <strong>
                                                            pendente
                                                        </strong>{" "}
                                                        até o responsável entrar
                                                        na plataforma e dar
                                                        andamento.
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                )}
                            {!verificando &&
                                emailResult &&
                                !emailResult.existe && (
                                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-4 flex flex-col gap-2">
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                            ⚠️ Atleta não encontrado
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400">
                                            Não existe nenhum utilizador com
                                            este e-mail. Podes enviar um convite
                                            externo via Administrador.
                                        </p>
                                    </div>
                                )}
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                            {!verificando &&
                                emailResult?.existe &&
                                (!emailResult.account_type ||
                                    emailResult.account_type === "atleta") && (
                                    <button
                                        onClick={() =>
                                            setStep("invite-internal")
                                        }
                                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow transition-all ${emailResult.menor_idade && !emailResult.responsavel_ativo ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
                                    >
                                        {emailResult.menor_idade
                                            ? emailResult.responsavel_ativo
                                                ? "Convite via Responsável →"
                                                : "Convite Pendente →"
                                            : "Enviar Convite Interno →"}
                                    </button>
                                )}
                            {!verificando &&
                                emailResult &&
                                !emailResult.existe && (
                                    <button
                                        onClick={() =>
                                            setStep("invite-external")
                                        }
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow transition-all"
                                    >
                                        Convite Externo →
                                    </button>
                                )}
                            {backButton("choice")}
                        </div>
                    </>
                )}

                {/* ═══════ STEP 3A: INVITE INTERNAL ═══════ */}
                {step === "invite-internal" && (
                    <>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    Convite Interno
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Adicionar atleta e enviar convite de equipa
                                </p>
                            </div>
                            {closeIcon}
                        </div>
                        {stepIndicator}
                        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
                            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 flex items-center gap-3">
                                <span className="text-xl">✅</span>
                                <div>
                                    <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                        {emailResult?.nome ?? "Atleta"}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        {email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                    Nome *
                                </label>
                                <input
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="Nome completo"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Posição
                                    </label>
                                    <input
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Ex: Avançado"
                                        value={posicao}
                                        onChange={(e) =>
                                            setPosicao(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Nº Camisola
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="—"
                                        value={numeroCamisola}
                                        onChange={(e) =>
                                            setNumeroCamisola(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            {equipas.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Equipa
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={equipaId}
                                        onChange={(e) =>
                                            setEquipaId(e.target.value)
                                        }
                                    >
                                        <option value="">Sem equipa</option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {emailResult?.menor_idade &&
                            emailResult.responsavel_ativo ? (
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 flex flex-col gap-1.5">
                                    <p className="text-xs text-blue-700 dark:text-blue-400">
                                        🔔 O convite será enviado ao responsável{" "}
                                        <strong>
                                            {emailResult.responsavel_nome}
                                        </strong>{" "}
                                        ({emailResult.responsavel_email}) para
                                        aprovação.
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-500">
                                        Só após aprovação do responsável o
                                        atleta será adicionado à equipa.
                                    </p>
                                </div>
                            ) : emailResult?.menor_idade &&
                              !emailResult?.responsavel_ativo ? (
                                <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 flex flex-col gap-1.5">
                                    <p className="text-xs text-orange-700 dark:text-orange-400">
                                        ⏳ O pedido ficará pendente até o
                                        responsável
                                        {emailResult.responsavel_email
                                            ? ` (${emailResult.responsavel_email})`
                                            : ""}{" "}
                                        se registar na plataforma.
                                    </p>
                                    <p className="text-xs text-orange-600 dark:text-orange-500">
                                        Quando o responsável entrar, receberá o
                                        pedido para aprovação.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                                    <p className="text-xs text-blue-700 dark:text-blue-400">
                                        🔔 Será criado o perfil de atleta e
                                        enviada uma notificação ao atleta para
                                        aceitar o convite de equipa.
                                    </p>
                                </div>
                            )}
                            {erro && (
                                <p className="text-xs text-red-500">{erro}</p>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                            <button
                                onClick={() => criarAtleta(true)}
                                disabled={!nome.trim() || enviando}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed ${emailResult?.menor_idade && !emailResult?.responsavel_ativo ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
                            >
                                {enviando
                                    ? "A enviar..."
                                    : emailResult?.menor_idade &&
                                        emailResult?.responsavel_ativo
                                      ? "Adicionar e Enviar ao Responsável"
                                      : emailResult?.menor_idade &&
                                          !emailResult?.responsavel_ativo
                                        ? "Adicionar (Pendente de Responsável)"
                                        : "Adicionar e Enviar Convite"}
                            </button>
                            {backButton("email-check")}
                        </div>
                    </>
                )}

                {/* ═══════ STEP 3B: INVITE EXTERNAL ═══════ */}
                {step === "invite-external" && (
                    <>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    Convite Externo
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Adicionar atleta e notificar o Administrador
                                </p>
                            </div>
                            {closeIcon}
                        </div>
                        {stepIndicator}
                        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-3">
                                <span className="text-xl">✉️</span>
                                <div>
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                        Email não registado
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        {email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                    Nome *
                                </label>
                                <input
                                    autoFocus
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="Nome completo do atleta"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Posição
                                    </label>
                                    <input
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Ex: Avançado"
                                        value={posicao}
                                        onChange={(e) =>
                                            setPosicao(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Nº Camisola
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="—"
                                        value={numeroCamisola}
                                        onChange={(e) =>
                                            setNumeroCamisola(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            {equipas.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                        Equipa
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={equipaId}
                                        onChange={(e) =>
                                            setEquipaId(e.target.value)
                                        }
                                    >
                                        <option value="">Sem equipa</option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    📨 O atleta será criado e o Administrador
                                    será notificado para enviar manualmente o
                                    convite de adesão à plataforma (via e-mail
                                    externo).
                                </p>
                            </div>
                            {erro && (
                                <p className="text-xs text-red-500">{erro}</p>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                            <button
                                onClick={() => criarAtleta(true)}
                                disabled={!nome.trim() || enviando}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all"
                            >
                                {enviando
                                    ? "A criar..."
                                    : "Criar e Notificar Admin"}
                            </button>
                            {backButton("email-check")}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Modal Editar Atleta Fictício ── */
function ModalEditarAtletaFake({
    atleta,
    equipas,
    onClose,
    onEditado,
}: {
    atleta: Atleta;
    equipas: Equipa[];
    onClose: () => void;
    onEditado: () => void;
}) {
    const [nome, setNome] = useState(atleta.nome);
    const [posicao, setPosicao] = useState(atleta.posicao ?? "");
    const [numeroCamisola, setNumeroCamisola] = useState(
        atleta.numero_camisola?.toString() ?? "",
    );
    const [estado, setEstado] = useState(atleta.estado);
    const [equipaId, setEquipaId] = useState(atleta.equipa_id ?? "");
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");

    const guardar = async () => {
        if (!nome.trim()) { setErro("O nome é obrigatório."); return; }
        setErro("");
        setSaving(true);
        const res = await fetch("/api/treinador/editar-atleta-fake", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                atleta_id: atleta.id,
                nome: nome.trim(),
                posicao: posicao || null,
                numero_camisola: numeroCamisola ? parseInt(numeroCamisola) : null,
                estado,
                equipa_id: equipaId || null,
            }),
        });
        setSaving(false);
        if (res.ok) { onEditado(); onClose(); }
        else setErro(await res.text());
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                            <span>🤖</span> Editar Atleta Fictício
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{atleta.nome}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                            Nome Completo <span className="text-red-400">*</span>
                        </label>
                        <input
                            autoFocus
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">Posição</label>
                            <select
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={posicao}
                                onChange={(e) => setPosicao(e.target.value)}
                            >
                                <option value="">Seleciona</option>
                                <option value="Guarda-Redes">Guarda-Redes</option>
                                <option value="Defesa Central">Defesa Central</option>
                                <option value="Defesa Esquerdo">Defesa Esquerdo</option>
                                <option value="Defesa Direito">Defesa Direito</option>
                                <option value="Médio Defensivo">Médio Defensivo</option>
                                <option value="Médio Centro">Médio Centro</option>
                                <option value="Médio Ofensivo">Médio Ofensivo</option>
                                <option value="Extremo Esquerdo">Extremo Esquerdo</option>
                                <option value="Extremo Direito">Extremo Direito</option>
                                <option value="Avançado Centro">Avançado Centro</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">Nº Camisola</label>
                            <input
                                type="number"
                                min="1"
                                max="99"
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="—"
                                value={numeroCamisola}
                                onChange={(e) => setNumeroCamisola(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">Estado</label>
                        <select
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="Ativo">Ativo</option>
                            <option value="Lesionado">Lesionado</option>
                            <option value="Suspenso">Suspenso</option>
                            <option value="Inativo">Inativo</option>
                        </select>
                    </div>
                    {equipas.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">Equipa</label>
                            <select
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={equipaId}
                                onChange={(e) => setEquipaId(e.target.value)}
                            >
                                <option value="">Sem equipa</option>
                                {equipas.map((e) => (
                                    <option key={e.id} value={e.id}>{e.nome}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {erro && <p className="text-xs text-red-500">{erro}</p>}
                </div>

                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                    <button
                        onClick={guardar}
                        disabled={!nome.trim() || saving}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all"
                    >
                        {saving ? "A guardar..." : "Guardar alterações"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Componente principal ── */
export default function EquipaAtletas({
    atletas: atletasIniciais,
    equipas,
    temClube,
}: {
    atletas: Atleta[];
    equipas: Equipa[];
    temClube: boolean;
}) {
    const [search, setSearch] = useState("");
    const [posicaoFiltro, setPosicaoFiltro] = useState("Todas");
    const [showAdicionar, setShowAdicionar] = useState(false);
    const [showTodos, setShowTodos] = useState(false);
    const [showCriarAtleta, setShowCriarAtleta] = useState(false);
    const [atletaModal, setAtletaModal] = useState<Atleta | null>(null);
    const [atletaEditar, setAtletaEditar] = useState<Atleta | null>(null);
    const [convitesPendentes, setConvitesPendentes] = useState<
        ConvitePendente[]
    >([]);
    const [toast, setToast] = useState<{
        msg: string;
        tipo: "ok" | "erro";
    } | null>(null);

    const showToast = useCallback((msg: string, tipo: "ok" | "erro" = "ok") => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 2500);
    }, []);

    useEffect(() => {
        fetch("/api/convites-equipa")
            .then((r) => (r.ok ? r.json() : []))
            .then(setConvitesPendentes)
            .catch(() => {});
    }, []);

    const posicoes = [
        "Todas",
        ...Array.from(
            new Set(
                atletasIniciais
                    .map((a) => a.posicao)
                    .filter(Boolean) as string[],
            ),
        ),
    ];

    const filtrados = atletasIniciais.filter((a) => {
        const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase());
        const matchPosicao =
            posicaoFiltro === "Todas" || a.posicao === posicaoFiltro;
        return matchSearch && matchPosicao;
    });

    const ativos = atletasIniciais.filter((a) => a.estado === "Ativo").length;
    const lesionados = atletasIniciais.filter(
        (a) => a.estado === "Lesionado",
    ).length;
    const suspensos = atletasIniciais.filter(
        (a) => a.estado === "Suspenso",
    ).length;

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">
            {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

            {/* Modal editar atleta fictício */}
            {atletaEditar && (
                <ModalEditarAtletaFake
                    atleta={atletaEditar}
                    equipas={equipas}
                    onClose={() => setAtletaEditar(null)}
                    onEditado={() => window.location.reload()}
                />
            )}

            {/* Modal ver atleta */}
            {atletaModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-extrabold text-base">
                                    {atletaModal.nome.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                        {atletaModal.nome}
                                        {!atletaModal.user_id && (
                                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                🤖 Fictício
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {atletaModal.posicao ?? "—"}
                                        {atletaModal.numero_camisola
                                            ? ` · #${atletaModal.numero_camisola}`
                                            : ""}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAtletaModal(null)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                        <div className="px-5 py-4 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    {
                                        label: "Estado",
                                        value: atletaModal.estado,
                                    },
                                    {
                                        label: "Posição",
                                        value: atletaModal.posicao ?? "—",
                                    },
                                    {
                                        label: "Nº Camisola",
                                        value: atletaModal.numero_camisola
                                            ? `#${atletaModal.numero_camisola}`
                                            : "—",
                                    },
                                    {
                                        label: "Equipa",
                                        value:
                                            atletaModal.equipa_nome ??
                                            "Sem equipa",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3"
                                    >
                                        <p className="text-[10px] font-semibold text-gray-400 tracking-wider">
                                            {item.label}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                            {!atletaModal.user_id && (
                                <button
                                    onClick={() => {
                                        setAtletaEditar(atletaModal);
                                        setAtletaModal(null);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                                >
                                    Editar
                                </button>
                            )}
                            <button
                                onClick={() => setAtletaModal(null)}
                                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal adicionar atleta */}
            {showAdicionar && (
                <ModalAdicionarAtleta
                    equipas={equipas}
                    onClose={() => setShowAdicionar(false)}
                    onConviteEnviado={(nome) => {
                        showToast(`Convite enviado para ${nome}!`);
                        // Refresh pending invites
                        fetch("/api/convites-equipa")
                            .then((r) => (r.ok ? r.json() : []))
                            .then(setConvitesPendentes)
                            .catch(() => {});
                    }}
                />
            )}

            {/* Modal Todos os Atletas */}
            {showTodos && (
                <ModalTodosAtletas
                    equipas={equipas}
                    onClose={() => setShowTodos(false)}
                    onConviteEnviado={(nome) => {
                        showToast(`Convite enviado para ${nome}!`);
                        fetch("/api/convites-equipa")
                            .then((r) => (r.ok ? r.json() : []))
                            .then(setConvitesPendentes)
                            .catch(() => {});
                    }}
                />
            )}

            {/* Modal Criar Atleta (apenas treinadores sem clube) */}
            {showCriarAtleta && (
                <ModalCriarAtleta
                    equipas={equipas}
                    onClose={() => setShowCriarAtleta(false)}
                    onCriado={(nome, suspenso) => {
                        if (suspenso) {
                            showToast(
                                `${nome} criado — suspenso por conflito de clube. Admin irá resolver.`,
                                "erro",
                            );
                        } else {
                            showToast(`${nome} adicionado à equipa!`);
                        }
                        // Recarregar a página para mostrar o novo atleta
                        window.location.reload();
                    }}
                />
            )}

            {/* Cabeçalho */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3">
                        <span>👥</span> Equipa
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {atletasIniciais.length} atletas registados
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Treinador sem clube: pode criar atletas diretamente */}
                    {!temClube && (
                        <button
                            onClick={() => setShowCriarAtleta(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-plus"
                                aria-hidden="true"
                            >
                                <path d="M5 12h14"></path>
                                <path d="M12 5v14"></path>
                            </svg>
                            Atleta
                        </button>
                    )}
                    {/* Treinador com clube: só pode convidar atletas do clube */}
                    {temClube && (
                        <>
                            <button
                                onClick={() => setShowAdicionar(true)}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow transition-all flex items-center gap-2"
                            >
                                🔍 Pesquisar Atleta
                            </button>
                            <button
                                onClick={() => setShowTodos(true)}
                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-semibold text-sm shadow transition-all flex items-center gap-2"
                            >
                                👥 Todos
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Convites pendentes */}
            {convitesPendentes.length > 0 && (
                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex flex-col gap-2">
                    <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300 tracking-wide">
                        🕐 Convites pendentes ({convitesPendentes.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {convitesPendentes.map((c) => (
                            <div
                                key={c.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                    {c.atleta_nome}
                                </span>
                                {c.equipa_nome && (
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                        {c.equipa_nome}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: "Total",
                        value: atletasIniciais.length,
                        color: "text-blue-600",
                        border: "border-blue-200 dark:border-blue-700",
                    },
                    {
                        label: "Ativos",
                        value: ativos,
                        color: "text-green-600",
                        border: "border-green-200 dark:border-green-700",
                    },
                    {
                        label: "Lesionados",
                        value: lesionados,
                        color: "text-red-600",
                        border: "border-red-200 dark:border-red-700",
                    },
                    {
                        label: "Suspensos",
                        value: suspensos,
                        color: "text-yellow-600",
                        border: "border-yellow-200 dark:border-yellow-700",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border ${s.border} shadow-sm flex flex-col`}
                    >
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                            {s.label}
                        </span>
                        <span className={`text-3xl font-bold mt-1 ${s.color}`}>
                            {s.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Grelha */}
            {atletasIniciais.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                    <span className="text-5xl">👥</span>
                    <p className="text-base font-medium">
                        Nenhum atleta registado.
                    </p>
                    <p className="text-sm text-gray-400 text-center max-w-sm">
                        Os atletas são registados pelo Presidente do clube.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtrados.map((atleta) => (
                        <div
                            key={atleta.id}
                            onClick={() => setAtletaModal(atleta)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xl font-extrabold flex-shrink-0 group-hover:scale-105 transition-transform">
                                    {atleta.nome.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                        {atleta.nome}
                                        {!atleta.user_id && (
                                            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                🤖
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {atleta.posicao ?? "—"}
                                    </div>
                                </div>
                                {atleta.numero_camisola && (
                                    <span className="ml-auto text-lg font-extrabold text-gray-200 dark:text-gray-700">
                                        #{atleta.numero_camisola}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${estadoCor[atleta.estado] ?? estadoCor.Inativo}`}
                                >
                                    {atleta.estado}
                                </span>
                                {atleta.equipa_nome && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
                                        {atleta.equipa_nome}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtrados.length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                            Nenhum atleta encontrado.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
