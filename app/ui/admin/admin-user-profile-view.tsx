// Componente admin user profile view.
"use client";

import {
    useState,
    useRef,
    useEffect,
    type ChangeEvent,
    type ReactNode,
} from "react";
import Image from "next/image";
import { Pencil, X, Check } from "lucide-react";
import { useFormStatus } from "react-dom";
import { getProfilePlaceholder } from "@/app/lib/assets";

// --- IBAN helpers ---
const IBAN_PREFIX = "PT50";
const IBAN_BODY_DIGITS_LENGTH = 21;
const IBAN_FORMATTED_MAX_LENGTH = 31;

function extractIbanBodyDigits(value: string): string {
    const normalized = value.toUpperCase().replace(/\s/g, "");
    const withoutPrefix = normalized.startsWith(IBAN_PREFIX)
        ? normalized.slice(IBAN_PREFIX.length)
        : normalized;
    return withoutPrefix.replace(/\D/g, "").slice(0, IBAN_BODY_DIGITS_LENGTH);
}

function normalizeIban(value: string): string {
    const digits = extractIbanBodyDigits(value);
    if (!digits) return "";
    const firstPart = digits.slice(0, 20);
    const lastDigit = digits.slice(20, 21);
    const firstGroups = firstPart.match(/.{1,4}/g) || [];
    const groups = [...firstGroups, lastDigit].filter(Boolean);
    return `${IBAN_PREFIX} ${groups.join(" ")}`;
}

function isIbanEffectivelyEmpty(value: string): boolean {
    return extractIbanBodyDigits(value).length === 0;
}

// --- Phone helpers ---
const PORTUGAL_PHONE_PREFIX = "(351) ";
const PHONE_DIGITS_LENGTH = 9;

function extractPortuguesePhoneDigits(value: string): string {
    const withoutPrefix = value.startsWith(PORTUGAL_PHONE_PREFIX)
        ? value.slice(PORTUGAL_PHONE_PREFIX.length)
        : value.replace(/^\(351\)\s?/, "");
    return withoutPrefix.replace(/\D/g, "").slice(0, PHONE_DIGITS_LENGTH);
}

function formatPortuguesePhone(value: string): string {
    const digits = extractPortuguesePhoneDigits(value);
    const chunks = digits.match(/.{1,3}/g) || [];
    const groupedDigits = chunks.join(" ");
    return groupedDigits ? `${PORTUGAL_PHONE_PREFIX}${groupedDigits}` : "";
}

// --- Postal code helpers ---
const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;

function normalizePostalCode(value: string): string {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 4) return digitsOnly;
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 7)}`;
}

async function fetchCityByPostalCode(
    postalCode: string,
): Promise<string | null> {
    const response = await fetch(`https://api.zippopotam.us/PT/${postalCode}`);
    if (!response.ok) return null;
    const data = (await response.json()) as {
        places?: Array<{ "place name"?: string }>;
    };
    return data.places?.[0]?.["place name"]?.trim() || null;
}

// --- Photo ---
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// --- Athlete options ---
const MAOS = [
    { value: "direita", label: "Direita" },
    { value: "esquerda", label: "Esquerda" },
    { value: "ambidestro", label: "Ambidestro" },
];

const ESTADOS_ATLETA = [
    { value: "ativo", label: "Ativo" },
    { value: "suspenso", label: "Suspenso" },
    { value: "inativo", label: "Inativo" },
];

// --- Types ---
type EquipaOption = { id: string; nome: string };

type AtletaData = {
    id: string;
    posicao: string | null;
    numero_camisola: number | null;
    equipa_id: string | null;
    estado: string | null;
    federado: boolean | null;
    numero_federado: string | null;
    mao_dominante: string | null;
};

type StaffData = {
    id: string;
    funcao: string | null;
    equipa_id: string | null;
};

type UserData = {
    id: string;
    clerk_user_id: string | null;
    created_at: string | null;
    name: string;
    email: string;
    image_url: string | null;
    organization_name: string | null;
    iban: string | null;
    data_nascimento: string | null;
    telefone: string | null;
    sobrenome: string | null;
    morada: string | null;
    peso_kg: number | null;
    altura_cm: number | null;
    nif: string | null;
    codigo_postal: string | null;
    cidade: string | null;
    pais: string | null;
};

type Section =
    | "pessoais"
    | "morada"
    | "desportivos"
    | "staff"
    | "seguranca"
    | null;

type Props = {
    updateAction: (formData: FormData) => Promise<void | { error: string }>;
    accountType: string | null;
    accountTypeBadge: { label: string; className: string };
    user: UserData;
    atletaData?: AtletaData | null;
    staffData?: StaffData | null;
    equipas?: EquipaOption[];
};

// --- Shared styles ---
const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";
const labelCls =
    "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";
const hintCls = "mt-1 text-xs text-gray-500 dark:text-gray-400";
const valueCls = "text-sm text-gray-900 dark:text-gray-100";
const emptyValueCls = "text-sm italic text-gray-400 dark:text-gray-500";

function DisplayValue({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>
            {value ? (
                <p className={valueCls}>{value}</p>
            ) : (
                <p className={emptyValueCls}>—</p>
            )}
        </div>
    );
}

function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
            <Check size={14} />
            {pending ? "A guardar..." : "Guardar"}
        </button>
    );
}

function CardShell({
    title,
    sectionKey,
    editing,
    onEdit,
    onCancel,
    children,
    editContent,
    action,
    onSubmit,
}: {
    title: string;
    sectionKey: Section;
    editing: Section;
    onEdit: () => void;
    onCancel: () => void;
    children: ReactNode;
    editContent: ReactNode;
    action: (formData: FormData) => Promise<void | { error: string }>;
    onSubmit?: (formData: FormData) => void;
}) {
    const isEditing = editing === sectionKey;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {title}
                </h3>
                {!isEditing && editing === null && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <Pencil size={12} />
                        Editar
                    </button>
                )}
            </div>

            {isEditing ? (
                <form
                    action={(fd) => {
                        onSubmit?.(fd);
                        action(fd);
                    }}
                    className="space-y-4"
                >
                    <input type="hidden" name="_section" value={sectionKey!} />
                    {editContent}
                    <div className="flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                        <SaveButton />
                        <button
                            type="button"
                            onClick={onCancel}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            <X size={14} />
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {children}
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────
export function AdminUserProfileView({
    updateAction,
    accountType,
    accountTypeBadge,
    user,
    atletaData,
    staffData,
    equipas = [],
}: Props) {
    const [editing, setEditing] = useState<Section>(null);

    const isAtleta = accountType === "atleta";
    const isTreinador = accountType === "treinador";

    const nameParts = user.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // ── Controlled state for special fields ──
    const [iban, setIban] = useState(user.iban ? normalizeIban(user.iban) : "");
    const [telefone, setTelefone] = useState(
        user.telefone ? formatPortuguesePhone(user.telefone) : "",
    );
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        user.image_url,
    );
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [codigoPostal, setCodigoPostal] = useState(
        user.codigo_postal ? normalizePostalCode(user.codigo_postal) : "",
    );
    const [cidade, setCidade] = useState(user.cidade || "");
    const [federado, setFederado] = useState(atletaData?.federado ?? false);
    const [allPosicoes, setAllPosicoes] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("/api/posicoes")
            .then((r) => (r.ok ? r.json() : []))
            .then(setAllPosicoes)
            .catch(() => {});
    }, []);

    // Auto-preenchimento de cidade
    const [prevCodigoPostal, setPrevCodigoPostal] = useState(codigoPostal);
    if (codigoPostal !== prevCodigoPostal) {
        setPrevCodigoPostal(codigoPostal);
        if (!codigoPostal) setCidade("");
    }

    useEffect(() => {
        if (!codigoPostal || !POSTAL_CODE_REGEX.test(codigoPostal)) return;
        let isCancelled = false;
        const resolveCity = async () => {
            try {
                const city = await fetchCityByPostalCode(codigoPostal);
                if (!isCancelled) setCidade(city || "");
            } catch {
                if (!isCancelled) setCidade("");
            }
        };
        void resolveCity();
        return () => {
            isCancelled = true;
        };
    }, [codigoPostal]);

    function handleIbanChange(e: ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value;
        if (isIbanEffectivelyEmpty(raw) && raw.length <= IBAN_PREFIX.length) {
            setIban("");
            return;
        }
        setIban(normalizeIban(raw));
    }

    function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
        setTelefone(formatPortuguesePhone(e.target.value));
    }

    function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
        setPhotoError(null);
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
            setPhotoError("Formato inválido. Use JPG, PNG ou WEBP.");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_PHOTO_SIZE) {
            setPhotoError("A foto deve ter no máximo 5 MB.");
            e.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    // Intercetores de submissão por secção
    function onSubmitPessoais(fd: FormData) {
        const first = String(fd.get("firstName") || "").trim();
        const last = String(fd.get("lastName") || "").trim();
        fd.set("name", [first, last].filter(Boolean).join(" "));
        fd.delete("firstName");
        fd.delete("lastName");
        if (isAtleta) fd.set("sobrenome", last);
    }

    function onSubmitMorada(fd: FormData) {
        fd.set(
            "iban",
            isIbanEffectivelyEmpty(iban)
                ? ""
                : normalizeIban(iban).replace(/\s/g, ""),
        );
        fd.set(
            "telefone",
            extractPortuguesePhoneDigits(telefone).length > 0
                ? telefone.trim()
                : "",
        );
    }

    const cancelEdit = () => {
        setEditing(null);
        setPhotoError(null);
    };

    return (
        <div className="space-y-4">
            {/* ── 1. Informações Pessoais ── */}
            <CardShell
                title="Informações Pessoais"
                sectionKey="pessoais"
                editing={editing}
                onEdit={() => setEditing("pessoais")}
                onCancel={cancelEdit}
                action={updateAction}
                onSubmit={onSubmitPessoais}
                editContent={
                    <>
                        <div className="flex items-center gap-4">
                            <Image
                                src={
                                    photoPreview ||
                                    getProfilePlaceholder(accountType)
                                }
                                alt="Preview"
                                width={56}
                                height={56}
                                className="h-14 w-14 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="profilePhoto"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoChange}
                                    className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-400 dark:file:bg-gray-800 dark:file:text-gray-300 dark:hover:file:bg-gray-700"
                                />
                                <p className={hintCls}>
                                    JPG, PNG ou WEBP. Máximo 5 MB.
                                </p>
                            </div>
                        </div>
                        {photoError && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">
                                {photoError}
                            </p>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>Nome *</label>
                                <input
                                    name="firstName"
                                    defaultValue={firstName}
                                    required
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Apelido</label>
                                <input
                                    name="lastName"
                                    defaultValue={lastName}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>E-mail *</label>
                            <input
                                type="email"
                                name="email"
                                defaultValue={user.email}
                                required
                                className={inputCls}
                            />
                            <p className={hintCls}>
                                Se alterar o e-mail, o Clerk enviará uma
                                verificação para o novo endereço.
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>
                                    Data de nascimento
                                </label>
                                <input
                                    type="date"
                                    name="dataNascimento"
                                    defaultValue={user.data_nascimento || ""}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </>
                }
            >
                <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
                    <Image
                        src={
                            user.image_url || getProfilePlaceholder(accountType)
                        }
                        alt={user.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                        </p>
                    </div>
                </div>
                <DisplayValue label="Nome" value={firstName} />
                <DisplayValue label="Apelido" value={lastName} />
                <DisplayValue label="E-mail" value={user.email} />
                <DisplayValue
                    label="Data de nascimento"
                    value={user.data_nascimento}
                />
                <div className="sm:col-span-2 lg:col-span-3 mt-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                ID
                            </p>
                            <p className="break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                                {user.id}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Clerk ID
                            </p>
                            <p className="break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                                {user.clerk_user_id || "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Função
                            </p>
                            <span
                                className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${accountTypeBadge.className}`}
                            >
                                {accountTypeBadge.label}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Criado em
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                {user.created_at
                                    ? new Date(
                                          user.created_at,
                                      ).toLocaleDateString("pt-BR")
                                    : "—"}
                            </p>
                        </div>
                    </div>
                </div>
            </CardShell>

            {/* ── 2. Informações de Morada e Fiscais ── */}
            <CardShell
                title="Informações de Morada e Fiscais"
                sectionKey="morada"
                editing={editing}
                onEdit={() => setEditing("morada")}
                onCancel={cancelEdit}
                action={updateAction}
                onSubmit={onSubmitMorada}
                editContent={
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>Telefone</label>
                                <input
                                    name="telefone"
                                    value={telefone}
                                    onChange={handlePhoneChange}
                                    placeholder="(351) 912 345 678"
                                    className={inputCls}
                                />
                                <p className={hintCls}>9 dígitos portugueses</p>
                            </div>
                            <div>
                                <label className={labelCls}>IBAN</label>
                                <input
                                    name="iban"
                                    value={iban}
                                    onChange={handleIbanChange}
                                    placeholder="PT50 0000 0000 0000 0000 0000 0"
                                    maxLength={IBAN_FORMATTED_MAX_LENGTH}
                                    className={inputCls}
                                />
                                <p className={hintCls}>
                                    Formato PT50 + 21 dígitos
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Morada</label>
                            <input
                                name="morada"
                                defaultValue={user.morada || ""}
                                className={inputCls}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className={labelCls}>
                                    Código postal
                                </label>
                                <input
                                    name="codigoPostal"
                                    value={codigoPostal}
                                    onChange={(e) =>
                                        setCodigoPostal(
                                            normalizePostalCode(e.target.value),
                                        )
                                    }
                                    placeholder="1000-001"
                                    maxLength={8}
                                    className={inputCls}
                                />
                                <p className={hintCls}>Formato XXXX-XXX</p>
                            </div>
                            <div>
                                <label className={labelCls}>Cidade</label>
                                <input
                                    name="cidade"
                                    value={cidade}
                                    readOnly
                                    className={`${inputCls} bg-gray-50 dark:bg-gray-900`}
                                />
                                <p className={hintCls}>
                                    Automático pelo código postal
                                </p>
                            </div>
                            <div>
                                <label className={labelCls}>País</label>
                                <input
                                    name="pais"
                                    defaultValue={user.pais || ""}
                                    placeholder="Portugal"
                                    className={inputCls}
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>NIF</label>
                                <input
                                    name="nif"
                                    defaultValue={user.nif || ""}
                                    maxLength={9}
                                    className={inputCls}
                                />
                                <p className={hintCls}>9 dígitos</p>
                            </div>
                        </div>
                    </>
                }
            >
                <DisplayValue label="Telefone" value={user.telefone} />
                <DisplayValue label="IBAN" value={user.iban} />
                <DisplayValue label="Morada" value={user.morada} />
                <DisplayValue
                    label="Código postal"
                    value={user.codigo_postal}
                />
                <DisplayValue label="Cidade" value={user.cidade} />
                <DisplayValue label="País" value={user.pais} />
                <DisplayValue label="NIF" value={user.nif} />
            </CardShell>

            {/* ── 4. Informações Desportivas (atleta) ── */}
            {isAtleta && atletaData && (
                <CardShell
                    title="Informações Desportivas"
                    sectionKey="desportivos"
                    editing={editing}
                    onEdit={() => setEditing("desportivos")}
                    onCancel={cancelEdit}
                    action={updateAction}
                    editContent={
                        <>
                            <input
                                type="hidden"
                                name="atletaId"
                                value={atletaData.id}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelCls}>
                                        Peso (kg)
                                    </label>
                                    <input
                                        type="number"
                                        name="pesoKg"
                                        step="0.1"
                                        min="10"
                                        max="300"
                                        defaultValue={user.peso_kg ?? ""}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>
                                        Altura (cm)
                                    </label>
                                    <input
                                        type="number"
                                        name="alturaCm"
                                        min="100"
                                        max="300"
                                        defaultValue={user.altura_cm ?? ""}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelCls}>Posição</label>
                                    <select
                                        name="posicao"
                                        defaultValue={atletaData.posicao || ""}
                                        className={inputCls}
                                    >
                                        <option value="">
                                            — Sem posição —
                                        </option>
                                        {allPosicoes.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>
                                        Nº camisola
                                    </label>
                                    <input
                                        type="number"
                                        name="numeroCamisola"
                                        min="0"
                                        max="999"
                                        defaultValue={
                                            atletaData.numero_camisola ?? ""
                                        }
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelCls}>Equipa</label>
                                    <select
                                        name="equipaId"
                                        defaultValue={
                                            atletaData.equipa_id || ""
                                        }
                                        className={inputCls}
                                    >
                                        <option value="">— Sem equipa —</option>
                                        {equipas.map((eq) => (
                                            <option key={eq.id} value={eq.id}>
                                                {eq.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Estado</label>
                                    <select
                                        name="estadoAtleta"
                                        defaultValue={
                                            atletaData.estado || "ativo"
                                        }
                                        className={inputCls}
                                    >
                                        {ESTADOS_ATLETA.map((e) => (
                                            <option
                                                key={e.value}
                                                value={e.value}
                                            >
                                                {e.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelCls}>
                                        Mão dominante
                                    </label>
                                    <select
                                        name="maoDominante"
                                        defaultValue={
                                            atletaData.mao_dominante || ""
                                        }
                                        className={inputCls}
                                    >
                                        <option value="">
                                            — Não definido —
                                        </option>
                                        {MAOS.map((m) => (
                                            <option
                                                key={m.value}
                                                value={m.value}
                                            >
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            name="federado"
                                            checked={federado}
                                            onChange={(e) =>
                                                setFederado(e.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                                        />
                                        Federado
                                    </label>
                                </div>
                            </div>
                            {federado && (
                                <div>
                                    <label className={labelCls}>
                                        Nº federação
                                    </label>
                                    <input
                                        name="numeroFederado"
                                        defaultValue={
                                            atletaData.numero_federado || ""
                                        }
                                        className={inputCls}
                                    />
                                </div>
                            )}
                        </>
                    }
                >
                    <DisplayValue
                        label="Peso"
                        value={user.peso_kg ? `${user.peso_kg} kg` : null}
                    />
                    <DisplayValue
                        label="Altura"
                        value={user.altura_cm ? `${user.altura_cm} cm` : null}
                    />
                    <DisplayValue label="Posição" value={atletaData.posicao} />
                    <DisplayValue
                        label="Nº camisola"
                        value={atletaData.numero_camisola}
                    />
                    <DisplayValue
                        label="Equipa"
                        value={
                            equipas.find((e) => e.id === atletaData.equipa_id)
                                ?.nome
                        }
                    />
                    <DisplayValue
                        label="Estado"
                        value={
                            ESTADOS_ATLETA.find(
                                (e) => e.value === atletaData.estado,
                            )?.label || atletaData.estado
                        }
                    />
                    <DisplayValue
                        label="Mão dominante"
                        value={
                            MAOS.find(
                                (m) => m.value === atletaData.mao_dominante,
                            )?.label || atletaData.mao_dominante
                        }
                    />
                    <DisplayValue
                        label="Federado"
                        value={atletaData.federado ? "Sim" : "Não"}
                    />
                    {atletaData.federado && (
                        <DisplayValue
                            label="Nº federação"
                            value={atletaData.numero_federado}
                        />
                    )}
                </CardShell>
            )}

            {/* ── 6. Dados de Staff (treinador) ── */}
            {isTreinador && staffData && (
                <CardShell
                    title="Dados de Staff"
                    sectionKey="staff"
                    editing={editing}
                    onEdit={() => setEditing("staff")}
                    onCancel={cancelEdit}
                    action={updateAction}
                    editContent={
                        <>
                            <input
                                type="hidden"
                                name="staffId"
                                value={staffData.id}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelCls}>Função</label>
                                    <input
                                        name="funcaoStaff"
                                        defaultValue={staffData.funcao || ""}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Equipa</label>
                                    <select
                                        name="equipaIdStaff"
                                        defaultValue={staffData.equipa_id || ""}
                                        className={inputCls}
                                    >
                                        <option value="">— Sem equipa —</option>
                                        {equipas.map((eq) => (
                                            <option key={eq.id} value={eq.id}>
                                                {eq.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    }
                >
                    <DisplayValue label="Função" value={staffData.funcao} />
                    <DisplayValue
                        label="Equipa"
                        value={
                            equipas.find((e) => e.id === staffData.equipa_id)
                                ?.nome
                        }
                    />
                </CardShell>
            )}

            {/* ── 7. Informações de Segurança ── */}
            <CardShell
                title="Informações de Segurança"
                sectionKey="seguranca"
                editing={editing}
                onEdit={() => setEditing("seguranca")}
                onCancel={cancelEdit}
                action={updateAction}
                editContent={
                    <>
                        <div>
                            <label className={labelCls}>
                                Nome do Clube/Equipa
                            </label>
                            <input
                                name="organizationName"
                                defaultValue={user.organization_name || ""}
                                className={inputCls}
                            />
                        </div>
                        <div className="max-w-sm">
                            <label className={labelCls}>Nova password</label>
                            <input
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                placeholder="Deixe em branco para manter"
                                className={inputCls}
                            />
                        </div>
                    </>
                }
            >
                <DisplayValue
                    label="Organização"
                    value={user.organization_name}
                />
                <DisplayValue label="Password" value="••••••••" />
            </CardShell>
        </div>
    );
}
