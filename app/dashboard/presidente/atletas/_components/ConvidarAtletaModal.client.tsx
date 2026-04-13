// Componente cliente de atletas (presidente).
"use client";

import { useState, useEffect, useRef } from "react";
import { convidarAtleta, adicionarAtleta } from "@/app/lib/actions";
import { X, UserPlus } from "lucide-react";

type WizardStep =
    | "choice"
    | "fake-form"
    | "email-check"
    | "invite-internal"
    | "invite-external";

type Equipa = { id: string; nome: string; escalao: string };

function getIdadeLimiteEscalao(escalao: string): number | null {
    const lower = escalao.toLowerCase().trim();
    const subMatch = lower.match(/sub[- ]?(\d+)/);
    if (subMatch) return parseInt(subMatch[1]);
    if (lower.includes("juniores")) return 19;
    if (lower.includes("seniores") || lower.includes("profissional"))
        return null;
    return null;
}

function calcularIdade(dataNascimento: string): number {
    const birth = new Date(dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

const POSICOES_FALLBACK: string[] = [];

const ESTADOS = [
    { value: "ativo", label: "Ativo" },
    { value: "suspenso", label: "Suspenso" },
    { value: "inativo", label: "Inativo" },
];

const MAOS = [
    { value: "direita", label: "Direita" },
    { value: "esquerda", label: "Esquerda" },
    { value: "ambidestro", label: "Ambidestro" },
];

export default function ConvidarAtletaModal({
    equipas,
    defaultOpen = false, // ✅ novo prop
}: {
    equipas: Equipa[];
    defaultOpen?: boolean; // ✅ novo prop
}) {
    const [open, setOpen] = useState(defaultOpen); // ✅ alterado
    const [posicoes, setPosicoes] = useState<string[]>(POSICOES_FALLBACK);
    const [step, setStep] = useState<WizardStep>("choice");

    useEffect(() => {
        fetch("/api/posicoes")
            .then((r) => (r.ok ? r.json() : []))
            .then(setPosicoes)
            .catch(() => {});
    }, []);

    const [nome, setNome] = useState("");
    const [dataNascimento, setDataNascimento] = useState("");
    const [posicao, setPosicao] = useState("");
    const [numeroCamisola, setNumeroCamisola] = useState("");
    const [equipaId, setEquipaId] = useState("");
    const [estado, setEstado] = useState("ativo");
    const [maoDominante, setMaoDominante] = useState("");
    const [numeroFederado, setNumeroFederado] = useState("");

    const [email, setEmail] = useState("");
    const [verificando, setVerificando] = useState(false);
    const [emailResult, setEmailResult] = useState<{
        existe: boolean;
        user_id?: string;
        nome?: string;
        account_type?: string | null;
        data_nascimento?: string | null;
        menor_idade?: boolean;
        responsavel_nome?: string | null;
        responsavel_email?: string | null;
        responsavel_ativo?: boolean;
    } | null>(null);

    const [conviteEquipaId, setConviteEquipaId] = useState("");
    const [conviteNumeroFederado, setConviteNumeroFederado] = useState("");

    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleClose() {
        setOpen(false);
        setStep("choice");
        setNome("");
        setDataNascimento("");
        setPosicao("");
        setNumeroCamisola("");
        setEquipaId("");
        setEstado("ativo");
        setMaoDominante("");
        setNumeroFederado("");
        setEmail("");
        setEmailResult(null);
        setConviteEquipaId("");
        setConviteNumeroFederado("");
        setErro("");
    }

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

    const criarAtleta = async () => {
        if (!nome.trim()) {
            setErro("O nome é obrigatório.");
            return;
        }
        if (!dataNascimento) {
            setErro("A data de nascimento é obrigatória.");
            return;
        }
        // Validar idade mínima de 5 anos
        const idade = calcularIdade(dataNascimento);
        if (idade < 5) {
            setErro("O atleta deve ter pelo menos 5 anos de idade.");
            return;
        }
        if (!numeroFederado.trim() || !/^\d{6}$/.test(numeroFederado.trim())) {
            setErro(
                "O nº de federado é obrigatório e deve ter exatamente 6 dígitos.",
            );
            return;
        }
        // Validar idade compatível com escalão da equipa
        if (equipaId) {
            const equipa = equipas.find((e) => e.id === equipaId);
            if (equipa?.escalao) {
                const limiteEscalao = getIdadeLimiteEscalao(equipa.escalao);
                if (limiteEscalao !== null && idade >= limiteEscalao) {
                    setErro(
                        `O atleta tem ${idade} anos mas o escalão ${equipa.escalao} requer idade inferior a ${limiteEscalao} anos.`,
                    );
                    return;
                }
            }
        }
        setErro("");
        setEnviando(true);
        const formData = new FormData();
        formData.append("nome", nome.trim());
        formData.append("data_nascimento", dataNascimento);
        formData.append("federado", "on");
        formData.append("numero_federado", numeroFederado.trim());
        if (posicao.trim()) formData.append("posicao", posicao.trim());
        if (numeroCamisola) formData.append("numero_camisola", numeroCamisola);
        if (equipaId) formData.append("equipa_id", equipaId);
        formData.append("estado", estado);
        if (maoDominante) formData.append("mao_dominante", maoDominante);

        const result = await adicionarAtleta(null, formData);
        setEnviando(false);
        if (result?.error) {
            setErro(result.error);
        } else if (result?.success) {
            handleClose();
        }
    };

    const enviarConviteClube = async () => {
        if (!emailResult?.user_id) {
            setErro("Utilizador não encontrado.");
            return;
        }
        if (!conviteEquipaId) {
            setErro(
                "É obrigatório selecionar uma equipa para federar o atleta.",
            );
            return;
        }
        if (
            !conviteNumeroFederado.trim() ||
            !/^\d{6}$/.test(conviteNumeroFederado.trim())
        ) {
            setErro(
                "O nº de federado é obrigatório e deve ter exatamente 6 dígitos.",
            );
            return;
        }
        setErro("");
        setEnviando(true);
        const formData = new FormData();
        formData.append("atleta_user_id", emailResult.user_id);
        if (conviteEquipaId) formData.append("equipa_id", conviteEquipaId);
        formData.append("numero_federado", conviteNumeroFederado.trim());

        const result = await convidarAtleta(null, formData);
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
                        className={`h-1 flex-1 rounded-full transition-colors ${i < stepNumber ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    />
                ),
            )}
            <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                {stepNumber}/{totalSteps > 1 ? totalSteps : 3}
            </span>
        </div>
    );

    const atletaFormFields = (
        <>
            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Nome Completo <span className="text-red-400">*</span>
                </label>
                <input
                    autoFocus
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Data de Nascimento <span className="text-red-400">*</span>
                </label>
                <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Equipa
                    </label>
                    <select
                        value={equipaId}
                        onChange={(e) => setEquipaId(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="">Seleciona</option>
                        {equipas.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.nome}
                                {e.escalao ? ` (${e.escalao})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Estado <span className="text-red-400">*</span>
                    </label>
                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        {ESTADOS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Posição
                    </label>
                    <select
                        value={posicao}
                        onChange={(e) => setPosicao(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="">Seleciona</option>
                        {posicoes.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Nº Camisola
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="99"
                        value={numeroCamisola}
                        onChange={(e) => setNumeroCamisola(e.target.value)}
                        placeholder="Ex: 10"
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Nº Federado <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={numeroFederado}
                        onChange={(e) =>
                            setNumeroFederado(
                                e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                        }
                        placeholder="Ex: 123456"
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Mão Dominante
                    </label>
                    <select
                        value={maoDominante}
                        onChange={(e) => setMaoDominante(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="">Seleciona</option>
                        {MAOS.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </>
    );

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                <UserPlus size={16} />
                Adicionar Atleta
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
                                            Adicionar Atleta
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Que tipo de atleta queres adicionar?
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="px-6 py-6 flex flex-col gap-3">
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
                                                    Atleta Fictício
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Criar um perfil sem conta
                                                    real (treinos, testes, etc.)
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
                                            Atleta Fictício
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Perfil sem vínculo a conta real
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                                    {atletaFormFields}
                                    <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                                        🤖 Este atleta será criado sem e-mail e
                                        sem vínculo a nenhum perfil real da
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
                                        onClick={criarAtleta}
                                        disabled={
                                            !nome.trim() ||
                                            !dataNascimento ||
                                            enviando
                                        }
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
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
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Verificar Atleta
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Introduz o e-mail do atleta para
                                            verificar
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="px-6 py-5 flex flex-col gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Email do atleta
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
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
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
                                        emailResult.account_type !==
                                            "atleta" && (
                                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-2">
                                                <p className="text-sm font-bold text-red-400">
                                                    ✕ Não é possível convidar
                                                    como atleta
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
                                                    <strong>Atleta</strong>{" "}
                                                    podem receber convites de
                                                    clube.
                                                </p>
                                            </div>
                                        )}

                                    {!verificando &&
                                        emailResult?.existe &&
                                        (!emailResult.account_type ||
                                            emailResult.account_type ===
                                                "atleta") && (
                                            <div className="flex flex-col gap-3">
                                                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col gap-2">
                                                    <p className="text-sm font-bold text-emerald-400">
                                                        ✓ Atleta encontrado na
                                                        plataforma
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
                                                        atleta se federar.
                                                    </p>
                                                </div>

                                                {emailResult.menor_idade &&
                                                    emailResult.responsavel_ativo && (
                                                        <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex flex-col gap-2">
                                                            <p className="text-sm font-bold text-blue-400">
                                                                👶 Atleta menor
                                                                de idade
                                                            </p>
                                                            <p className="text-xs text-blue-400">
                                                                Responsável:{" "}
                                                                <span className="font-semibold">
                                                                    {
                                                                        emailResult.responsavel_nome
                                                                    }
                                                                </span>
                                                                {emailResult.responsavel_email && (
                                                                    <span>
                                                                        {" "}
                                                                        (
                                                                        {
                                                                            emailResult.responsavel_email
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-blue-400">
                                                                O convite será
                                                                enviado ao
                                                                responsável para
                                                                aprovação antes
                                                                de o atleta ser
                                                                federado no
                                                                clube.
                                                            </p>
                                                        </div>
                                                    )}

                                                {emailResult.menor_idade &&
                                                    !emailResult.responsavel_ativo && (
                                                        <div className="px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex flex-col gap-2">
                                                            <p className="text-sm font-bold text-orange-400">
                                                                ⚠️ Responsável
                                                                não encontrado
                                                            </p>
                                                            <p className="text-xs text-orange-400">
                                                                Este atleta é
                                                                menor de idade
                                                                mas ainda não
                                                                tem um
                                                                responsável com
                                                                perfil ativo na
                                                                plataforma.
                                                                {emailResult.responsavel_email && (
                                                                    <span>
                                                                        {" "}
                                                                        Email
                                                                        indicado:{" "}
                                                                        <strong>
                                                                            {
                                                                                emailResult.responsavel_email
                                                                            }
                                                                        </strong>
                                                                        .
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-orange-400">
                                                                O pedido ficará{" "}
                                                                <strong>
                                                                    pendente
                                                                </strong>{" "}
                                                                até o
                                                                responsável
                                                                entrar na
                                                                plataforma e dar
                                                                andamento.
                                                            </p>
                                                        </div>
                                                    )}
                                            </div>
                                        )}

                                    {!verificando &&
                                        emailResult &&
                                        !emailResult.existe && (
                                            <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col gap-2">
                                                <p className="text-sm font-bold text-amber-400">
                                                    ⚠️ Atleta não encontrado
                                                </p>
                                                <p className="text-xs text-amber-400">
                                                    Não existe nenhum utilizador
                                                    com este e-mail. Podes criar
                                                    um perfil de atleta e
                                                    notificar o Administrador.
                                                </p>
                                            </div>
                                        )}
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                                    {backButton("choice")}
                                    {!verificando &&
                                        emailResult?.existe &&
                                        (!emailResult.account_type ||
                                            emailResult.account_type ===
                                                "atleta") && (
                                            <button
                                                onClick={() =>
                                                    setStep("invite-internal")
                                                }
                                                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                                                    emailResult.menor_idade &&
                                                    !emailResult.responsavel_ativo
                                                        ? "bg-orange-600 hover:bg-orange-700"
                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                }`}
                                            >
                                                {emailResult.menor_idade
                                                    ? emailResult.responsavel_ativo
                                                        ? "Convite via Responsável →"
                                                        : "Convite Pendente →"
                                                    : "Enviar Convite de Clube →"}
                                            </button>
                                        )}
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

                        {/* ═══════ STEP 3A: INVITE INTERNAL ═══════ */}
                        {step === "invite-internal" && (
                            <>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Convite de Clube
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Enviar convite para federação no
                                            clube
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                                    <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                                        <span className="text-xl">✅</span>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-400">
                                                {emailResult?.nome ?? "Atleta"}
                                            </p>
                                            <p className="text-xs text-emerald-500">
                                                {email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Equipa{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={conviteEquipaId}
                                            onChange={(e) =>
                                                setConviteEquipaId(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">
                                                Seleciona uma equipa
                                            </option>
                                            {equipas.map((e) => (
                                                <option key={e.id} value={e.id}>
                                                    {e.nome}
                                                    {e.escalao
                                                        ? ` (${e.escalao})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Nº Federado{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={conviteNumeroFederado}
                                            onChange={(e) =>
                                                setConviteNumeroFederado(
                                                    e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 6),
                                                )
                                            }
                                            placeholder="Ex: 123456"
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    {(() => {
                                        if (
                                            !conviteEquipaId ||
                                            !emailResult?.data_nascimento
                                        )
                                            return null;
                                        const equipa = equipas.find(
                                            (e) => e.id === conviteEquipaId,
                                        );
                                        if (!equipa?.escalao) return null;
                                        const limite = getIdadeLimiteEscalao(
                                            equipa.escalao,
                                        );
                                        if (limite === null) return null;
                                        const idade = calcularIdade(
                                            emailResult.data_nascimento,
                                        );
                                        if (idade >= limite) {
                                            return (
                                                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-1.5">
                                                    <p className="text-sm font-bold text-red-400">
                                                        ⛔ Idade incompatível
                                                        com o escalão
                                                    </p>
                                                    <p className="text-xs text-red-400">
                                                        O atleta tem{" "}
                                                        <strong>
                                                            {idade} anos
                                                        </strong>{" "}
                                                        mas o escalão{" "}
                                                        <strong>
                                                            {equipa.escalao}
                                                        </strong>{" "}
                                                        permite no máximo{" "}
                                                        <strong>
                                                            {limite} anos
                                                        </strong>
                                                        .
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {emailResult?.menor_idade &&
                                    emailResult.responsavel_ativo ? (
                                        <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex flex-col gap-1.5">
                                            <p className="text-xs text-blue-400">
                                                🔔 O convite será enviado ao
                                                responsável{" "}
                                                <strong>
                                                    {
                                                        emailResult.responsavel_nome
                                                    }
                                                </strong>{" "}
                                                ({emailResult.responsavel_email}
                                                ) para aprovação.
                                            </p>
                                            <p className="text-xs text-blue-500">
                                                Só após aprovação do responsável
                                                o atleta será federado no clube.
                                            </p>
                                        </div>
                                    ) : emailResult?.menor_idade &&
                                      !emailResult?.responsavel_ativo ? (
                                        <div className="px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex flex-col gap-1.5">
                                            <p className="text-xs text-orange-400">
                                                ⏳ O pedido ficará pendente até
                                                o responsável
                                                {emailResult.responsavel_email
                                                    ? ` (${emailResult.responsavel_email})`
                                                    : ""}{" "}
                                                se registar na plataforma.
                                            </p>
                                            <p className="text-xs text-orange-500">
                                                Quando o responsável entrar,
                                                receberá o pedido para
                                                aprovação.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                                            O atleta receberá uma notificação e
                                            terá de aceitar o convite para ser
                                            federado no clube.
                                        </div>
                                    )}

                                    {erro && (
                                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                            {erro}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                                    {backButton("email-check")}
                                    <button
                                        onClick={enviarConviteClube}
                                        disabled={
                                            enviando ||
                                            !conviteEquipaId ||
                                            !/^\d{6}$/.test(
                                                conviteNumeroFederado.trim(),
                                            ) ||
                                            (() => {
                                                if (
                                                    !conviteEquipaId ||
                                                    !emailResult?.data_nascimento
                                                )
                                                    return false;
                                                const eq = equipas.find(
                                                    (e) =>
                                                        e.id ===
                                                        conviteEquipaId,
                                                );
                                                if (!eq?.escalao) return false;
                                                const lim =
                                                    getIdadeLimiteEscalao(
                                                        eq.escalao,
                                                    );
                                                if (lim === null) return false;
                                                return (
                                                    calcularIdade(
                                                        emailResult.data_nascimento!,
                                                    ) > lim
                                                );
                                            })()
                                        }
                                        className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                            emailResult?.menor_idade &&
                                            !emailResult?.responsavel_ativo
                                                ? "bg-orange-600 hover:bg-orange-700"
                                                : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                        {enviando
                                            ? "A enviar..."
                                            : emailResult?.menor_idade &&
                                                emailResult?.responsavel_ativo
                                              ? "Enviar ao Responsável"
                                              : emailResult?.menor_idade &&
                                                  !emailResult?.responsavel_ativo
                                                ? "Enviar (Pendente)"
                                                : "Enviar Convite"}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ═══════ STEP 3B: INVITE EXTERNAL ═══════ */}
                        {step === "invite-external" && (
                            <>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Criar Perfil Externo
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Adicionar atleta e notificar o
                                            Administrador
                                        </p>
                                    </div>
                                    {closeIcon}
                                </div>
                                {stepIndicator}
                                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                                    <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
                                        <span className="text-xl">✉️</span>
                                        <div>
                                            <p className="text-xs font-bold text-amber-400">
                                                Email não registado
                                            </p>
                                            <p className="text-xs text-amber-500">
                                                {email}
                                            </p>
                                        </div>
                                    </div>

                                    {atletaFormFields}

                                    <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                                        📨 O atleta será criado e o
                                        Administrador será notificado para
                                        enviar manualmente o convite de adesão à
                                        plataforma (via e-mail externo).
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
                                        onClick={criarAtleta}
                                        disabled={!nome.trim() || enviando}
                                        className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        {enviando
                                            ? "A criar..."
                                            : "Criar e Notificar Admin"}
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
