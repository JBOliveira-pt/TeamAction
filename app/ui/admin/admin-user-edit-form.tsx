"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import Image from "next/image";
import { User } from "lucide-react";

// --- IBAN (same as signup) ---
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

// --- Phone (same as signup) ---
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

// --- Postal code (same as signup) ---
const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;

function normalizePostalCode(value: string): string {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 4) {
        return digitsOnly;
    }
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 7)}`;
}

async function fetchCityByPostalCode(
    postalCode: string,
): Promise<string | null> {
    const response = await fetch(`https://api.zippopotam.us/PT/${postalCode}`);
    if (!response.ok) {
        return null;
    }
    const data = (await response.json()) as {
        places?: Array<{ "place name"?: string }>;
    };
    return data.places?.[0]?.["place name"]?.trim() || null;
}

// --- Photo ---
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// --- Athlete options ---
const POSICOES_FUTEBOL = [
    "Guarda-Redes",
    "Defesa Central",
    "Defesa Esquerdo",
    "Defesa Direito",
    "Médio Defensivo",
    "Médio Centro",
    "Médio Ofensivo",
    "Extremo Esquerdo",
    "Extremo Direito",
    "Avançado Centro",
    "Outro",
];
const POSICOES_ANDEBOL = [
    "Guarda-Redes",
    "Central",
    "Lateral Esquerdo",
    "Lateral Direito",
    "Ponta Esquerdo",
    "Ponta Direito",
    "Pivot",
];
const ALL_POSICOES = [...new Set([...POSICOES_FUTEBOL, ...POSICOES_ANDEBOL])];

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

type Props = {
    updateAction: (formData: FormData) => Promise<void>;
    accountType: string | null;
    user: {
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
    atletaData?: AtletaData | null;
    staffData?: StaffData | null;
    equipas?: EquipaOption[];
};

export function AdminUserEditForm({
    updateAction,
    accountType,
    user,
    atletaData,
    staffData,
    equipas = [],
}: Props) {
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAtleta = accountType === "atleta";
    const isTreinador = accountType === "treinador";

    // Split stored full name into first/last for separate editing
    const nameParts = user.name.split(" ");
    const defaultFirstName = nameParts[0] || "";
    const defaultLastName = nameParts.slice(1).join(" ") || "";

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

    const [prevCodigoPostal, setPrevCodigoPostal] = useState(codigoPostal);
    if (codigoPostal !== prevCodigoPostal) {
        setPrevCodigoPostal(codigoPostal);
        if (!codigoPostal) setCidade("");
    }

    useEffect(() => {
        if (!codigoPostal || !POSTAL_CODE_REGEX.test(codigoPostal)) {
            return;
        }
        let isCancelled = false;
        const resolveCity = async () => {
            try {
                const city = await fetchCityByPostalCode(codigoPostal);
                if (!isCancelled) {
                    setCidade(city || "");
                }
            } catch {
                if (!isCancelled) {
                    setCidade("");
                }
            }
        };
        void resolveCity();
        return () => {
            isCancelled = true;
        };
    }, [codigoPostal]);

    function handleSubmit(formData: FormData) {
        // Combine first + last name back into full name
        const first = String(formData.get("firstName") || "").trim();
        const last = String(formData.get("lastName") || "").trim();
        formData.set("name", [first, last].filter(Boolean).join(" "));
        formData.delete("firstName");
        formData.delete("lastName");

        // Sync sobrenome for athletes
        if (isAtleta) {
            formData.set("sobrenome", last);
        }

        formData.set(
            "iban",
            isIbanEffectivelyEmpty(iban)
                ? ""
                : normalizeIban(iban).replace(/\s/g, ""),
        );
        formData.set(
            "telefone",
            extractPortuguesePhoneDigits(telefone).length > 0
                ? telefone.trim()
                : "",
        );
        updateAction(formData);
    }

    const inputCls =
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";
    const labelCls =
        "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";
    const hintCls = "mt-1 text-xs text-gray-500 dark:text-gray-400";

    return (
        <form action={handleSubmit} className="space-y-4">
            {/* ── Dados pessoais ── */}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Nome *</label>
                    <input
                        name="firstName"
                        defaultValue={defaultFirstName}
                        required
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>Apelido</label>
                    <input
                        name="lastName"
                        defaultValue={defaultLastName}
                        className={inputCls}
                    />
                </div>
            </div>

            {!isAtleta && (
                <div>
                    <label className={labelCls}>Nome do Clube/Equipa</label>
                    <input
                        name="organizationName"
                        defaultValue={user.organization_name || ""}
                        className={inputCls}
                    />
                </div>
            )}

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
                    Se alterar o e-mail, o Clerk enviará uma verificação para o
                    novo endereço.
                </p>
            </div>

            {/* Photo upload */}
            <div>
                <label className={labelCls}>Foto de perfil</label>
                <div className="flex items-center gap-4">
                    {photoPreview ? (
                        <Image
                            src={photoPreview}
                            alt="Preview"
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                            <User size={20} />
                        </div>
                    )}
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
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                        {photoError}
                    </p>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
                    <p className={hintCls}>Formato PT50 + 21 dígitos</p>
                </div>

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
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Data de nascimento</label>
                    <input
                        type="date"
                        name="dataNascimento"
                        defaultValue={user.data_nascimento || ""}
                        className={inputCls}
                    />
                </div>

                <div>
                    <label className={labelCls}>Nova password</label>
                    <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        placeholder="Deixe em branco para manter"
                        className={inputCls}
                    />
                </div>
            </div>

            {/* ── Morada / Localização ── */}
            {(isAtleta || isTreinador || accountType === "presidente") && (
                <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Morada / Localização
                    </p>
                    <div>
                        <label className={labelCls}>Morada</label>
                        <input
                            name="morada"
                            defaultValue={user.morada || ""}
                            className={inputCls}
                        />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Código postal</label>
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
                                Preenchido automaticamente pelo código postal
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
                </>
            )}

            {/* ── NIF (atleta / treinador) ── */}
            {isAtleta && (
                <div className="grid md:grid-cols-2 gap-4">
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
                    {!isAtleta && <div />}
                </div>
            )}

            {/* ── Dados físicos do Atleta ── */}
            {isAtleta && (
                <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Dados Físicos
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Peso (kg)</label>
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
                            <label className={labelCls}>Altura (cm)</label>
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
                </>
            )}

            {/* ── Dados desportivos do Atleta ── */}
            {isAtleta && atletaData && (
                <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Dados Desportivos
                    </p>
                    <input
                        type="hidden"
                        name="atletaId"
                        value={atletaData.id}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Posição</label>
                            <select
                                name="posicao"
                                defaultValue={atletaData.posicao || ""}
                                className={inputCls}
                            >
                                <option value="">— Sem posição —</option>
                                {ALL_POSICOES.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Nº camisola</label>
                            <input
                                type="number"
                                name="numeroCamisola"
                                min="0"
                                max="999"
                                defaultValue={atletaData.numero_camisola ?? ""}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Equipa</label>
                            <select
                                name="equipaId"
                                defaultValue={atletaData.equipa_id || ""}
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
                                defaultValue={atletaData.estado || "ativo"}
                                className={inputCls}
                            >
                                {ESTADOS_ATLETA.map((e) => (
                                    <option key={e.value} value={e.value}>
                                        {e.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Mão dominante</label>
                            <select
                                name="maoDominante"
                                defaultValue={atletaData.mao_dominante || ""}
                                className={inputCls}
                            >
                                <option value="">— Não definido —</option>
                                {MAOS.map((m) => (
                                    <option key={m.value} value={m.value}>
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
                            <label className={labelCls}>Nº federação</label>
                            <input
                                name="numeroFederado"
                                defaultValue={atletaData.numero_federado || ""}
                                className={inputCls}
                            />
                        </div>
                    )}
                </>
            )}

            {/* ── Dados do Staff / Treinador ── */}
            {isTreinador && staffData && (
                <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Dados de Staff
                    </p>
                    <input type="hidden" name="staffId" value={staffData.id} />

                    <div className="grid md:grid-cols-2 gap-4">
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
            )}

            {/* ── Organização (não-atleta) ── */}
            {isAtleta && (
                <div>
                    <label className={labelCls}>Nome do Clube/Equipa</label>
                    <input
                        name="organizationName"
                        defaultValue={user.organization_name || ""}
                        className={inputCls}
                    />
                </div>
            )}

            <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
                Guardar alterações
            </button>
        </form>
    );
}
