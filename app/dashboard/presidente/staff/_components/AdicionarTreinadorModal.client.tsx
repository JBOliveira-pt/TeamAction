"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { adicionarMembro, getEscaloesByUserAction } from "@/app/lib/actions";
import {
    GRAUS_TECNICOS,
    getEscaloesPermitidos,
} from "@/app/lib/grau-escalao-compat";
import { X, Loader2 } from "lucide-react";

type WizardStep =
    | "choice"
    | "fake-form"
    | "email-check"
    | "invite-internal"
    | "invite-external";

const FUNCOES_TREINADOR = [
    { value: "Treinador Principal", label: "Treinador Principal" },
    { value: "Treinador Adjunto", label: "Treinador Adjunto" },
];

type Equipa = { id: string; nome: string; escalao: string };

export function AdicionarTreinadorModal({ equipas }: { equipas: Equipa[] }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<WizardStep>("choice");

    // Shared fields
    const [funcao, setFuncao] = useState("Treinador Principal");
    const [nome, setNome] = useState("");
    const [equipaId, setEquipaId] = useState("");
    const [grauId, setGrauId] = useState<number>(0);

    // Email check
    const [email, setEmail] = useState("");
    const [verificando, setVerificando] = useState(false);
    const [emailResult, setEmailResult] = useState<{
        existe: boolean;
        user_id?: string;
        nome?: string;
        account_type?: string | null;
    } | null>(null);

    // Escalões do treinador encontrado
    const [escaloesTreinador, setEscaloesTreinador] = useState<string[]>([]);
    const [loadingEscaloes, setLoadingEscaloes] = useState(false);

    // Submission
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Equipas filtradas pelo grau técnico (fake) ou escalões do treinador (real)
    const equipasFiltradas = useMemo(() => {
        // Para treinadores fictícios: filtrar por grau selecionado
        if (grauId > 0) {
            const permitidos = getEscaloesPermitidos(grauId);
            return equipas.filter((e) => permitidos.includes(e.escalao));
        }
        // Para treinadores reais: filtrar pelos escalões do curso
        if (escaloesTreinador.length > 0) {
            return equipas.filter((e) => escaloesTreinador.includes(e.escalao));
        }
        return equipas;
    }, [equipas, grauId, escaloesTreinador]);

    function handleClose() {
        setOpen(false);
        setStep("choice");
        setFuncao("Treinador Principal");
        setNome("");
        setEquipaId("");
        setGrauId(0);
        setEmail("");
        setEmailResult(null);
        setEscaloesTreinador([]);
        setErro("");
    }

    // Auto-verify email
    useEffect(() => {
        if (step !== "email-check") return;
        setEmailResult(null);
        setEscaloesTreinador([]);
        if (timer.current) clearTimeout(timer.current);
        const emailTrimmed = email.trim().toLowerCase();
        if (!emailTrimmed.includes("@") || emailTrimmed.length < 5) return;
        timer.current = setTimeout(async () => {
            setVerificando(true);
            try {
                const res = await fetch(
                    `/api/atletas/verificar-email?email=${encodeURIComponent(emailTrimmed)}`,
                );
                if (res.ok) {
                    const data = await res.json();
                    setEmailResult(data);
                    // Se encontrou treinador, buscar escalões
                    if (
                        data.existe &&
                        data.user_id &&
                        data.account_type === "treinador"
                    ) {
                        setLoadingEscaloes(true);
                        try {
                            const esc = await getEscaloesByUserAction(
                                data.user_id,
                            );
                            setEscaloesTreinador(esc);
                        } finally {
                            setLoadingEscaloes(false);
                        }
                    }
                }
            } finally {
                setVerificando(false);
            }
        }, 400);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [email, step]);

    // Create fictitious trainer (no email)
    const criarTreinadorFicticio = async () => {
        if (!nome.trim()) {
            setErro("O nome é obrigatório.");
            return;
        }
        setErro("");
        setEnviando(true);
        const formData = new FormData();
        formData.append("nome", nome.trim());
        formData.append("funcao", funcao);
        formData.append("equipa_id", equipaId);
        formData.append("treinador_mode", "fake");
        if (grauId) formData.append("grau_tecnico_id", String(grauId));

        const result = await adicionarMembro(null, formData);
        setEnviando(false);
        if (result?.error) {
            setErro(result.error);
        } else if (result?.success) {
            handleClose();
        }
    };

    // Send internal invite (trainer found on platform)
    const enviarConviteInterno = async () => {
        if (!emailResult?.user_id) {
            setErro("Utilizador não encontrado.");
            return;
        }
        setErro("");
        setEnviando(true);
        const formData = new FormData();
        formData.append("nome", emailResult.nome ?? "");
        formData.append("funcao", funcao);
        formData.append("equipa_id", equipaId);
        formData.append("treinador_mode", "real");
        formData.append("userid", emailResult.user_id);

        const result = await adicionarMembro(null, formData);
        setEnviando(false);
        if (result?.error) {
            setErro(result.error);
        } else if (result?.success) {
            handleClose();
        }
    };

    // Create external profile + notify admin
    const criarPerfilExterno = async () => {
        if (!nome.trim()) {
            setErro("O nome é obrigatório.");
            return;
        }
        setErro("");
        setEnviando(true);
        const formData = new FormData();
        formData.append("nome", nome.trim());
        formData.append("funcao", funcao);
        formData.append("equipa_id", equipaId);
        formData.append("treinador_mode", "fake");
        formData.append("treinador_email_fake", email.trim());
        if (grauId) formData.append("grau_tecnico_id", String(grauId));

        const result = await adicionarMembro(null, formData);
        setEnviando(false);
        if (result?.error) {
            setErro(result.error);
        } else if (result?.success) {
            handleClose();
        }
    };

    const closeIcon = (
        <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
            <X size={18} />
        </button>
    );

    const backButton = (target: WizardStep) => (
        <button
            onClick={() => {
                setErro("");
                setStep(target);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            ← Voltar
        </button>
    );

    // Step indicator
    const stepNumber =
        step === "choice"
            ? 1
            : step === "fake-form" || step === "email-check"
              ? 2
              : 3;
    const totalSteps = step === "fake-form" ? 2 : step === "choice" ? 1 : 3;

    const stepIndicator = (
        <div className="flex items-center gap-1.5 px-6 py-2 border-b border-gray-100 dark:border-gray-800">
            {Array.from({ length: totalSteps > 1 ? totalSteps : 3 }).map(
                (_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < stepNumber ? "bg-violet-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    />
                ),
            )}
            <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                {stepNumber}/{totalSteps > 1 ? totalSteps : 3}
            </span>
        </div>
    );

    // Function selector (shared between fake-form and email-check)
    const funcaoSelector = (
        <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Função <span className="text-red-400">*</span>
            </label>
            <select
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
                {FUNCOES_TREINADOR.map((f) => (
                    <option key={f.value} value={f.value}>
                        {f.label}
                    </option>
                ))}
            </select>
        </div>
    );

    const inputClass =
        "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                + Novo Treinador
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        {/* ═══════ STEP 1: CHOICE ═══════ */}
                        {step === "choice" && (
                            <>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Adicionar Treinador
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Que tipo de treinador queres
                                            adicionar?
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="px-6 py-6 flex flex-col gap-3">
                                    <button
                                        onClick={() => setStep("email-check")}
                                        className="w-full p-4 rounded-xl border-2 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-400 dark:hover:border-violet-500 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">👤</span>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    Treinador Real
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Verificar se já existe na
                                                    plataforma e enviar convite
                                                    de clube
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
                                                    Treinador Fictício
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Criar um perfil sem conta
                                                    real (apenas nome, sem
                                                    e-mail)
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800" />
                            </>
                        )}

                        {/* ═══════ STEP 2A: FAKE FORM ═══════ */}
                        {step === "fake-form" && (
                            <>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Treinador Fictício
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Perfil sem vínculo a conta real
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                                    {funcaoSelector}

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Nome Completo{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            autoFocus
                                            value={nome}
                                            onChange={(e) =>
                                                setNome(e.target.value)
                                            }
                                            placeholder="Ex: João Silva"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Grau Técnico{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={grauId}
                                            onChange={(e) => {
                                                setGrauId(
                                                    Number(e.target.value),
                                                );
                                                setEquipaId("");
                                            }}
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value={0}>
                                                Selecionar grau...
                                            </option>
                                            {GRAUS_TECNICOS.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name} — {g.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {grauId > 0 && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Equipa{" "}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </label>
                                            {equipasFiltradas.length === 0 ? (
                                                <p className="text-xs text-amber-400 px-1">
                                                    ⚠️ Nenhuma equipa compatível
                                                    com este grau técnico.
                                                </p>
                                            ) : (
                                                <select
                                                    value={equipaId}
                                                    onChange={(e) =>
                                                        setEquipaId(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="">
                                                        Selecionar equipa...
                                                    </option>
                                                    {equipasFiltradas.map(
                                                        (eq) => (
                                                            <option
                                                                key={eq.id}
                                                                value={eq.id}
                                                            >
                                                                {eq.nome} (
                                                                {eq.escalao})
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            )}
                                            <p className="text-[10px] text-gray-400 px-1">
                                                Escalões permitidos:{" "}
                                                {getEscaloesPermitidos(
                                                    grauId,
                                                ).join(", ")}
                                            </p>
                                        </div>
                                    )}

                                    <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                                        🤖 Este treinador será criado sem e-mail
                                        e sem vínculo a nenhum perfil real da
                                        plataforma.
                                    </div>

                                    {erro && (
                                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                            {erro}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                                    {backButton("choice")}
                                    <button
                                        onClick={criarTreinadorFicticio}
                                        disabled={!nome.trim() || enviando}
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        {enviando
                                            ? "A criar..."
                                            : "Criar Treinador Fictício"}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ═══════ STEP 2B: EMAIL CHECK ═══════ */}
                        {step === "email-check" && (
                            <>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Verificar Treinador
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Introduz o e-mail do treinador para
                                            verificar
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="px-6 py-5 flex flex-col gap-4">
                                    {funcaoSelector}

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            E-mail do treinador
                                        </label>
                                        <input
                                            autoFocus
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setErro("");
                                            }}
                                            placeholder="exemplo@email.com"
                                            className={inputClass}
                                        />
                                    </div>

                                    {verificando && (
                                        <div className="flex items-center justify-center gap-2 py-2">
                                            <Loader2
                                                size={14}
                                                className="text-gray-400 animate-spin"
                                            />
                                            <p className="text-xs text-gray-400">
                                                A verificar...
                                            </p>
                                        </div>
                                    )}

                                    {/* Found — not a trainer */}
                                    {!verificando &&
                                        emailResult?.existe &&
                                        emailResult.account_type &&
                                        emailResult.account_type !==
                                            "treinador" && (
                                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-2">
                                                <p className="text-sm font-bold text-red-400">
                                                    ✕ Não é possível convidar
                                                    como treinador
                                                </p>
                                                {emailResult.nome && (
                                                    <p className="text-xs text-red-400">
                                                        Nome:{" "}
                                                        <span className="font-semibold">
                                                            {emailResult.nome}
                                                        </span>
                                                    </p>
                                                )}
                                                <p className="text-xs text-red-400">
                                                    Este utilizador está
                                                    registado como{" "}
                                                    <strong className="capitalize">
                                                        {
                                                            emailResult.account_type
                                                        }
                                                    </strong>
                                                    . Apenas contas do tipo{" "}
                                                    <strong>Treinador</strong>{" "}
                                                    podem ser convidadas.
                                                </p>
                                            </div>
                                        )}

                                    {/* Found as trainer */}
                                    {!verificando &&
                                        emailResult?.existe &&
                                        emailResult.account_type ===
                                            "treinador" && (
                                            <div className="flex flex-col gap-3">
                                                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col gap-2">
                                                    <p className="text-sm font-bold text-emerald-400">
                                                        ✓ Treinador encontrado
                                                        na plataforma
                                                    </p>
                                                    {emailResult.nome && (
                                                        <p className="text-xs text-emerald-400">
                                                            Nome:{" "}
                                                            <span className="font-semibold">
                                                                {
                                                                    emailResult.nome
                                                                }
                                                            </span>
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-emerald-400">
                                                        Podes enviar um convite
                                                        de clube para este
                                                        treinador.
                                                    </p>
                                                </div>

                                                {/* Escalões */}
                                                {loadingEscaloes ? (
                                                    <div className="flex items-center gap-2 px-3 py-2">
                                                        <Loader2
                                                            size={14}
                                                            className="text-gray-400 animate-spin"
                                                        />
                                                        <span className="text-xs text-gray-400">
                                                            A carregar
                                                            escalões...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                                            Escalões cobertos
                                                            pelo curso:
                                                        </p>
                                                        {escaloesTreinador.length >
                                                        0 ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {escaloesTreinador.map(
                                                                    (e) => (
                                                                        <span
                                                                            key={
                                                                                e
                                                                            }
                                                                            className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-full"
                                                                        >
                                                                            {e}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-amber-400">
                                                                ⚠️ Este
                                                                treinador não
                                                                tem cursos
                                                                registados na
                                                                plataforma.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Equipa selector — filtrada por curso */}
                                                {!loadingEscaloes &&
                                                    escaloesTreinador.length >
                                                        0 && (
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                Equipa{" "}
                                                                <span className="text-red-400">
                                                                    *
                                                                </span>
                                                            </label>
                                                            {equipasFiltradas.length ===
                                                            0 ? (
                                                                <p className="text-xs text-amber-400 px-1">
                                                                    ⚠️ Nenhuma
                                                                    equipa
                                                                    compatível
                                                                    com o curso
                                                                    deste
                                                                    treinador.
                                                                </p>
                                                            ) : (
                                                                <select
                                                                    value={
                                                                        equipaId
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEquipaId(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                                >
                                                                    <option value="">
                                                                        Selecionar
                                                                        equipa...
                                                                    </option>
                                                                    {equipasFiltradas.map(
                                                                        (
                                                                            eq,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    eq.id
                                                                                }
                                                                                value={
                                                                                    eq.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    eq.nome
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    eq.escalao
                                                                                }

                                                                                )
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        )}

                                    {/* Not found */}
                                    {!verificando &&
                                        emailResult &&
                                        !emailResult.existe && (
                                            <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col gap-2">
                                                <p className="text-sm font-bold text-amber-400">
                                                    ⚠️ Treinador não encontrado
                                                </p>
                                                <p className="text-xs text-amber-400">
                                                    Não existe nenhum utilizador
                                                    com este e-mail. Podes criar
                                                    um perfil e notificar o
                                                    Administrador.
                                                </p>
                                            </div>
                                        )}

                                    {erro && (
                                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                            {erro}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                                    {backButton("choice")}
                                    {/* Trainer found → internal invite */}
                                    {!verificando &&
                                        emailResult?.existe &&
                                        emailResult.account_type ===
                                            "treinador" && (
                                            <button
                                                onClick={enviarConviteInterno}
                                                disabled={enviando}
                                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                {enviando
                                                    ? "A enviar..."
                                                    : "Enviar Convite de Clube →"}
                                            </button>
                                        )}
                                    {/* Not found → create external profile */}
                                    {!verificando &&
                                        emailResult &&
                                        !emailResult.existe && (
                                            <button
                                                onClick={() =>
                                                    setStep("invite-external")
                                                }
                                                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                Criar Perfil Externo →
                                            </button>
                                        )}
                                </div>
                            </>
                        )}

                        {/* ═══════ STEP 3: EXTERNAL PROFILE ═══════ */}
                        {step === "invite-external" && (
                            <>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Perfil Externo
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Criar perfil e notificar
                                            Administrador
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                                    {/* Email badge */}
                                    <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
                                        <span className="text-xl">📧</span>
                                        <div>
                                            <p className="text-xs text-amber-400 font-medium">
                                                E-mail não encontrado
                                            </p>
                                            <p className="text-sm font-semibold text-amber-300">
                                                {email}
                                            </p>
                                        </div>
                                    </div>

                                    {funcaoSelector}

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Nome Completo{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            autoFocus
                                            value={nome}
                                            onChange={(e) =>
                                                setNome(e.target.value)
                                            }
                                            placeholder="Ex: João Silva"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Grau Técnico{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={grauId}
                                            onChange={(e) => {
                                                setGrauId(
                                                    Number(e.target.value),
                                                );
                                                setEquipaId("");
                                            }}
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value={0}>
                                                Selecionar grau...
                                            </option>
                                            {GRAUS_TECNICOS.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name} — {g.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {grauId > 0 && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Equipa{" "}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </label>
                                            {equipasFiltradas.length === 0 ? (
                                                <p className="text-xs text-amber-400 px-1">
                                                    ⚠️ Nenhuma equipa compatível
                                                    com este grau técnico.
                                                </p>
                                            ) : (
                                                <select
                                                    value={equipaId}
                                                    onChange={(e) =>
                                                        setEquipaId(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="">
                                                        Selecionar equipa...
                                                    </option>
                                                    {equipasFiltradas.map(
                                                        (eq) => (
                                                            <option
                                                                key={eq.id}
                                                                value={eq.id}
                                                            >
                                                                {eq.nome} (
                                                                {eq.escalao})
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            )}
                                            <p className="text-[10px] text-gray-400 px-1">
                                                Escalões permitidos:{" "}
                                                {getEscaloesPermitidos(
                                                    grauId,
                                                ).join(", ")}
                                            </p>
                                        </div>
                                    )}

                                    <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                                        📋 Será criado um perfil sem conta e o
                                        Administrador será notificado para
                                        enviar um convite externo ao e-mail
                                        indicado.
                                    </div>

                                    {erro && (
                                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                            {erro}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                                    {backButton("email-check")}
                                    <button
                                        onClick={criarPerfilExterno}
                                        disabled={!nome.trim() || enviando}
                                        className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        {enviando
                                            ? "A criar..."
                                            : "Criar Perfil + Notificar Admin"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
