// Componente editar perfil modal.
"use client";

import { useActionState, useEffect, useState } from "react";
import {
    atualizarMeuPerfil,
    solicitarAlteracaoEmail,
    solicitarAlteracaoDataNascimento,
} from "@/app/lib/actions";
import {
    Pencil,
    X,
    AlertTriangle,
    Clock,
    User,
    Mail,
    MapPin,
    CreditCard,
    Building2,
    Calendar,
} from "lucide-react";

type State = { error?: string; success?: boolean } | null;

interface PedidoPendente {
    campo: string;
    valor_novo: string;
}

interface Props {
    firstName: string;
    lastName: string;
    email: string;
    telefone: string | null;
    morada: string | null;
    cidade: string | null;
    codigoPostal: string | null;
    pais: string | null;
    dataNascimento: string | null;
    nif: string | null;
    nipc: string | null;
    iban: string | null;
    accountType: string | null;
    orgName: string | null;
    membroDesde: string;
    pedidosPendentes?: PedidoPendente[];
    isMinor?: boolean;
}

/* ── Constantes de validação (mesmas do signup) ── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;
const PHONE_DIGITS_LENGTH = 9;
const PORTUGAL_PHONE_PREFIX = "(351) ";
const IBAN_PREFIX = "PT50";
const IBAN_BODY_DIGITS_LENGTH = 21;
const NIF_DIGITS_LENGTH = 9;
const MIN_SIGNUP_AGE = 5;
const MAX_SIGNUP_AGE = 120;

/* ── Helpers de formatação (mesmas do signup) ── */
function extractPortuguesePhoneDigits(value: string): string {
    const withoutPrefix = value.startsWith("(351) ")
        ? value.slice(6)
        : value.replace(/^\(351\)\s?/, "");
    return withoutPrefix.replace(/\D/g, "").slice(0, 9);
}

function formatPhone(value: string): string {
    const digits = extractPortuguesePhoneDigits(value);
    if (!digits) return "";
    const groups = digits.match(/.{1,3}/g) ?? [digits];
    return PORTUGAL_PHONE_PREFIX + groups.join(" ");
}

function normalizePostalCode(value: string): string {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 4) return digitsOnly;
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 7)}`;
}

function extractIbanBodyDigits(value: string): string {
    const normalized = value.toUpperCase().replace(/\s/g, "");
    const withoutPrefix = normalized.startsWith("PT50")
        ? normalized.slice(4)
        : normalized;
    return withoutPrefix.replace(/\D/g, "").slice(0, 21);
}

function formatIban(value: string): string {
    const body = extractIbanBodyDigits(value);
    if (!body) return "";
    const full = IBAN_PREFIX + body;
    return full.match(/.{1,4}/g)?.join(" ") ?? full;
}

function formatNif(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    return digits.match(/.{1,3}/g)?.join(" ") ?? digits;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    presidente: "Presidente",
    treinador: "Treinador",
    atleta: "Atleta",
    responsavel: "Responsável",
};

export default function PerfilInlineEditor({
    firstName,
    lastName,
    email,
    telefone,
    morada,
    cidade,
    codigoPostal,
    pais,
    dataNascimento,
    nif,
    nipc,
    iban,
    accountType,
    orgName,
    membroDesde,
    pedidosPendentes = [],
    isMinor = false,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [editingEmail, setEditingEmail] = useState(false);
    const [editingDob, setEditingDob] = useState(false);

    // Valores do formulário
    const [phone, setPhone] = useState(telefone ? formatPhone(telefone) : "");
    const [postal, setPostal] = useState(codigoPostal ?? "");
    const [ibanVal, setIbanVal] = useState(iban ? formatIban(iban) : "");
    const [nifVal, setNifVal] = useState(nif ? formatNif(nif) : "");
    const [nipcVal, setNipcVal] = useState(nipc ? formatNif(nipc) : "");

    // Erros de validação (lado do cliente)
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Estados das ações
    const [state, action, isPending] = useActionState<State, FormData>(
        atualizarMeuPerfil,
        null,
    );
    const [emailState, emailAction, isEmailPending] = useActionState<
        State,
        FormData
    >(solicitarAlteracaoEmail, null);
    const [dobState, dobAction, isDobPending] = useActionState<State, FormData>(
        solicitarAlteracaoDataNascimento,
        null,
    );

    // Toasts de sucesso temporários
    const [showSuccess, setShowSuccess] = useState(false);
    const [showEmailSuccess, setShowEmailSuccess] = useState(false);
    const [showDobSuccess, setShowDobSuccess] = useState(false);

    useEffect(() => {
        if (state?.success) {
            const show = setTimeout(() => {
                setEditing(false);
                setShowSuccess(true);
            }, 0);
            const hide = setTimeout(() => setShowSuccess(false), 3000);
            return () => {
                clearTimeout(show);
                clearTimeout(hide);
            };
        }
    }, [state]);

    useEffect(() => {
        if (emailState?.success) {
            const show = setTimeout(() => {
                setEditingEmail(false);
                setShowEmailSuccess(true);
            }, 0);
            const hide = setTimeout(() => setShowEmailSuccess(false), 3000);
            return () => {
                clearTimeout(show);
                clearTimeout(hide);
            };
        }
    }, [emailState]);

    useEffect(() => {
        if (dobState?.success) {
            const show = setTimeout(() => {
                setEditingDob(false);
                setShowDobSuccess(true);
            }, 0);
            const hide = setTimeout(() => setShowDobSuccess(false), 3000);
            return () => {
                clearTimeout(show);
                clearTimeout(hide);
            };
        }
    }, [dobState]);

    const emailPendente = pedidosPendentes.find((p) => p.campo === "email");
    const dobPendente = pedidosPendentes.find(
        (p) => p.campo === "data_nascimento",
    );

    const accountLabel = ACCOUNT_TYPE_LABELS[accountType ?? ""] ?? "Utilizador";
    const nascimentoFormatted = dataNascimento
        ? new Date(dataNascimento).toLocaleDateString("pt-PT")
        : null;

    // Limites de data de nascimento
    const today = new Date();
    const maxBirthDate = new Date(
        today.getFullYear() - MIN_SIGNUP_AGE,
        today.getMonth(),
        today.getDate(),
    )
        .toISOString()
        .slice(0, 10);
    const minBirthDate = new Date(
        today.getFullYear() - MAX_SIGNUP_AGE,
        today.getMonth(),
        today.getDate(),
    )
        .toISOString()
        .slice(0, 10);

    function validateAndSubmit(formData: FormData) {
        const newErrors: Record<string, string> = {};

        const fn = formData.get("firstName")?.toString().trim();
        const ln = formData.get("lastName")?.toString().trim();
        if (!fn) newErrors.firstName = "Informe o primeiro nome.";
        if (!ln) newErrors.lastName = "Informe o último nome.";

        const phoneRaw = formData.get("telefone")?.toString() ?? "";
        if (phoneRaw) {
            const digits = extractPortuguesePhoneDigits(phoneRaw);
            if (digits.length > 0 && digits.length !== PHONE_DIGITS_LENGTH) {
                newErrors.telefone =
                    "Telefone deve conter exatamente 9 dígitos após (351).";
            }
        }

        const postalRaw =
            formData.get("codigo_postal")?.toString().trim() ?? "";
        if (postalRaw && !POSTAL_CODE_REGEX.test(postalRaw)) {
            newErrors.codigo_postal =
                "Código Postal inválido. Use o formato 0000-000.";
        }

        const nifRaw = formData.get("nif")?.toString().replace(/\D/g, "") ?? "";
        if (nifRaw && nifRaw.length !== NIF_DIGITS_LENGTH) {
            newErrors.nif = "NIF deve conter exatamente 9 dígitos.";
        }

        const ibanRaw = formData.get("iban")?.toString() ?? "";
        if (ibanRaw) {
            const body = extractIbanBodyDigits(ibanRaw);
            if (body.length > 0 && body.length !== IBAN_BODY_DIGITS_LENGTH) {
                newErrors.iban = `IBAN deve começar com ${IBAN_PREFIX} e conter mais ${IBAN_BODY_DIGITS_LENGTH} dígitos.`;
            }
        }

        const nipcRaw =
            formData.get("nipc")?.toString().replace(/\D/g, "") ?? "";
        if (nipcRaw && nipcRaw.length !== NIF_DIGITS_LENGTH) {
            newErrors.nipc = "NIPC deve conter exatamente 9 dígitos.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        // Normalizar valores antes de submeter
        const normalized = new FormData();
        normalized.set("firstName", fn ?? "");
        normalized.set("lastName", ln ?? "");
        normalized.set(
            "telefone",
            phoneRaw ? extractPortuguesePhoneDigits(phoneRaw) || "" : "",
        );
        normalized.set(
            "morada",
            formData.get("morada")?.toString().trim() ?? "",
        );
        normalized.set(
            "cidade",
            formData.get("cidade")?.toString().trim() ?? "",
        );
        normalized.set("codigo_postal", postalRaw);
        normalized.set("pais", formData.get("pais")?.toString().trim() ?? "");
        normalized.set("data_nascimento", dataNascimento ?? "");
        normalized.set("nif", nifRaw);
        normalized.set("nipc", nipcRaw);
        normalized.set(
            "iban",
            ibanRaw ? IBAN_PREFIX + extractIbanBodyDigits(ibanRaw) : "",
        );
        action(normalized);
    }

    function validateEmailAndSubmit(formData: FormData) {
        const newEmail = formData.get("novo_email")?.toString().trim() ?? "";
        if (!EMAIL_REGEX.test(newEmail)) {
            setErrors({ novo_email: "Informe um e-mail válido." });
            return;
        }
        setErrors({});
        emailAction(formData);
    }

    return (
        <div className="space-y-4">
            {/* Avisos de pedidos pendentes */}
            {pedidosPendentes.length > 0 && (
                <div className="space-y-2">
                    {pedidosPendentes.map((p, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                        >
                            <Clock
                                size={18}
                                className="text-amber-500 mt-0.5 shrink-0"
                            />
                            <div>
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                    Pedido de alteração em análise
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                    {p.campo === "email"
                                        ? `Alteração de email para ${p.valor_novo}`
                                        : `Alteração da data de nascimento para ${new Date(p.valor_novo).toLocaleDateString("pt-PT")}`}{" "}
                                    — aguarda aprovação do administrador.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sucesso/Erro da edição geral */}
            {showSuccess && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 animate-fade-out">
                    Perfil atualizado com sucesso!
                </div>
            )}
            {state?.error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                    {state.error}
                </div>
            )}

            {/* Aviso para menores — dados cadastrais bloqueados */}
            {isMinor && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <AlertTriangle
                        size={18}
                        className="text-blue-500 mt-0.5 shrink-0"
                    />
                    <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            Conta de menor de idade
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                            A alteração dos teus dados pessoais, email e data de
                            nascimento só pode ser feita pelo teu encarregado de
                            educação.
                        </p>
                    </div>
                </div>
            )}

            {/* ── INFORMAÇÕES PESSOAIS ── */}
            <Section
                icon={<User size={18} className="text-blue-500" />}
                title="Informações Pessoais"
                canEdit={!isMinor}
                editing={editing}
                onToggle={() => {
                    setEditing((v) => !v);
                    setErrors({});
                }}
            >
                {editing ? (
                    <form
                        action={validateAndSubmit}
                        className="space-y-3 col-span-2"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field
                                label="Nome"
                                name="firstName"
                                defaultValue={firstName}
                                required
                                error={errors.firstName}
                            />
                            <Field
                                label="Apelido"
                                name="lastName"
                                defaultValue={lastName}
                                required
                                error={errors.lastName}
                            />
                        </div>
                        <ReadOnlyField
                            label="Tipo de conta"
                            value={accountLabel}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field
                                label="Telefone"
                                name="telefone"
                                value={phone}
                                onChange={(v) => setPhone(formatPhone(v))}
                                placeholder="(351) 912 345 678"
                                maxLength={17}
                                error={errors.telefone}
                            />
                            <Field
                                label="NIF"
                                name="nif"
                                value={nifVal}
                                onChange={(v) => setNifVal(formatNif(v))}
                                placeholder="123 456 789"
                                maxLength={11}
                                error={errors.nif}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field
                                label="Morada"
                                name="morada"
                                defaultValue={morada ?? ""}
                            />
                            <Field
                                label="Cidade"
                                name="cidade"
                                defaultValue={cidade ?? ""}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field
                                label="Código Postal"
                                name="codigo_postal"
                                value={postal}
                                onChange={(v) =>
                                    setPostal(normalizePostalCode(v))
                                }
                                placeholder="0000-000"
                                maxLength={8}
                                error={errors.codigo_postal}
                            />
                            <Field
                                label="País"
                                name="pais"
                                defaultValue={pais ?? ""}
                                placeholder="Portugal"
                            />
                        </div>
                        {accountType === "presidente" && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field
                                        label="NIPC do Clube"
                                        name="nipc"
                                        value={nipcVal}
                                        onChange={(v) =>
                                            setNipcVal(formatNif(v))
                                        }
                                        placeholder="123 456 789"
                                        maxLength={11}
                                        error={errors.nipc}
                                    />
                                    <Field
                                        label="IBAN"
                                        name="iban"
                                        value={ibanVal}
                                        onChange={(v) =>
                                            setIbanVal(formatIban(v))
                                        }
                                        placeholder="PT50 0000 0000 0000 0000 0000 0"
                                        maxLength={31}
                                        mono
                                        error={errors.iban}
                                    />
                                </div>
                            </>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(false);
                                    setErrors({});
                                }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {isPending
                                    ? "A guardar..."
                                    : "Guardar alterações"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <InfoRow
                            label="Nome completo"
                            value={`${firstName} ${lastName}`}
                        />
                        <InfoRow label="Tipo de conta" value={accountLabel} />
                        <InfoRow
                            label="Telefone"
                            value={telefone ? formatPhone(telefone) : null}
                        />
                        <InfoRow
                            label="NIF"
                            value={nif ? formatNif(nif) : null}
                        />
                        <InfoRow label="Morada" value={morada} />
                        <InfoRow label="Cidade" value={cidade} />
                        <InfoRow label="Código Postal" value={codigoPostal} />
                        <InfoRow label="País" value={pais} />
                        {accountType === "presidente" && (
                            <>
                                <InfoRow
                                    label="NIPC do Clube"
                                    value={nipc ? formatNif(nipc) : null}
                                />
                                <InfoRow
                                    label="IBAN"
                                    value={iban ? formatIban(iban) : null}
                                    mono
                                />
                            </>
                        )}
                    </>
                )}
            </Section>

            {/* ── EMAIL + DATA DE NASCIMENTO lado a lado ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* EMAIL */}
                <Section
                    icon={<Mail size={18} className="text-blue-500" />}
                    title="Email"
                    canEdit={!isMinor && !emailPendente}
                    editing={editingEmail}
                    onToggle={() => {
                        setEditingEmail((v) => !v);
                        setErrors({});
                    }}
                >
                    {editingEmail && !emailPendente ? (
                        <div className="col-span-2 space-y-3">
                            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <AlertTriangle
                                    size={16}
                                    className="text-amber-500 mt-0.5 shrink-0"
                                />
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    A alteração de email requer aprovação do
                                    administrador por questões de segurança.
                                </p>
                            </div>
                            <form
                                action={validateEmailAndSubmit}
                                className="space-y-3"
                            >
                                <ReadOnlyField
                                    label="Email atual"
                                    value={email}
                                />
                                <Field
                                    label="Novo email"
                                    name="novo_email"
                                    type="email"
                                    required
                                    placeholder="novo@exemplo.com"
                                    error={errors.novo_email}
                                />
                                {emailState?.error && (
                                    <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                        {emailState.error}
                                    </p>
                                )}
                                {showEmailSuccess && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg animate-fade-out">
                                        Pedido enviado com sucesso!
                                    </p>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingEmail(false);
                                            setErrors({});
                                        }}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isEmailPending}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        {isEmailPending
                                            ? "A enviar..."
                                            : "Solicitar alteração"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <InfoRow label="Email" value={email} />
                    )}
                </Section>

                {/* DATA DE NASCIMENTO */}
                <Section
                    icon={<Calendar size={18} className="text-blue-500" />}
                    title="Data de Nascimento"
                    canEdit={!isMinor && !dobPendente}
                    editing={editingDob}
                    onToggle={() => {
                        setEditingDob((v) => !v);
                        setErrors({});
                    }}
                >
                    {editingDob && !dobPendente ? (
                        <div className="col-span-2 space-y-3">
                            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <Calendar
                                    size={16}
                                    className="text-gray-500 mt-0.5 shrink-0"
                                />
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Se a nova data resultar em idade inferior a
                                    18 anos, a alteração será enviada ao
                                    administrador para aprovação.
                                </p>
                            </div>
                            <form action={dobAction} className="space-y-3">
                                <ReadOnlyField
                                    label="Data de nascimento atual"
                                    value={
                                        nascimentoFormatted ?? "Não definida"
                                    }
                                />
                                <Field
                                    label="Nova data de nascimento"
                                    name="nova_data_nascimento"
                                    type="date"
                                    required
                                    min={minBirthDate}
                                    max={maxBirthDate}
                                />
                                {dobState?.error && (
                                    <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                        {dobState.error}
                                    </p>
                                )}
                                {showDobSuccess && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg animate-fade-out">
                                        Data de nascimento atualizada com
                                        sucesso!
                                    </p>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingDob(false)}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isDobPending}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        {isDobPending
                                            ? "A guardar..."
                                            : "Atualizar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <InfoRow
                            label="Data de Nascimento"
                            value={nascimentoFormatted}
                        />
                    )}
                </Section>
            </div>

            {/* ── ORGANIZAÇÃO (read-only) ── */}
            {orgName && (
                <Section
                    icon={<Building2 size={18} className="text-blue-500" />}
                    title="Organização"
                >
                    <InfoRow label="Nome" value={orgName} />
                    <InfoRow label="Membro desde" value={membroDesde} />
                </Section>
            )}
        </div>
    );
}

/* ── Sub-componentes ── */

function Section({
    icon,
    title,
    children,
    canEdit,
    editing,
    onToggle,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    canEdit?: boolean;
    editing?: boolean;
    onToggle?: () => void;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                {canEdit && onToggle && (
                    <button
                        onClick={onToggle}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                    >
                        {editing ? (
                            <>
                                <X size={14} />
                                Cancelar
                            </>
                        ) : (
                            <>
                                <Pencil size={14} />
                                Editar
                            </>
                        )}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    mono,
}: {
    label: string;
    value: string | null | undefined;
    mono?: boolean;
}) {
    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p
                className={`text-sm font-medium text-gray-900 dark:text-white mt-0.5 ${mono ? "font-mono" : ""}`}
            >
                {value || "—"}
            </p>
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                {value}
            </p>
        </div>
    );
}

function Field({
    label,
    name,
    defaultValue,
    value,
    onChange,
    type = "text",
    required,
    placeholder,
    mono,
    maxLength,
    min,
    max,
    error,
}: {
    label: string;
    name: string;
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    mono?: boolean;
    maxLength?: number;
    min?: string;
    max?: string;
    error?: string;
}) {
    const controlled = value !== undefined && onChange;
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
                name={name}
                type={type}
                {...(controlled
                    ? { value, onChange: (e) => onChange(e.target.value) }
                    : { defaultValue })}
                required={required}
                placeholder={placeholder}
                maxLength={maxLength}
                min={min}
                max={max}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    error
                        ? "border-red-400 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                } ${mono ? "font-mono" : ""}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
