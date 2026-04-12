// Componente cliente de dados educando (responsável).
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import {
    editarDadosCadastraisEducando,
    editarInfoDesportivaEducando,
} from "@/app/lib/actions/responsavel";
import type { DadosEducando } from "@/app/lib/data/responsavel";
import Image from "next/image";
import {
    User,
    Check,
    Loader2,
    Dumbbell,
    Camera,
    Shield,
    Users,
    GraduationCap,
    Mail,
    Calendar,
    Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ── Constantes e helpers de formatação (iguais ao perfil) ── */
const PHONE_DIGITS_LENGTH = 9;
const PORTUGAL_PHONE_PREFIX = "(351) ";
const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;
const NIF_DIGITS_LENGTH = 9;

function extractPhoneDigits(value: string): string {
    const withoutPrefix = value.startsWith("(351) ")
        ? value.slice(6)
        : value.replace(/^\(351\)\s?/, "");
    return withoutPrefix.replace(/\D/g, "").slice(0, 9);
}

function formatPhone(value: string): string {
    const digits = extractPhoneDigits(value);
    if (!digits) return "";
    const groups = digits.match(/.{1,3}/g) ?? [digits];
    return PORTUGAL_PHONE_PREFIX + groups.join(" ");
}

function normalizePostalCode(value: string): string {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 4) return digitsOnly;
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 7)}`;
}

function formatNif(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    return digits.match(/.{1,3}/g)?.join(" ") ?? digits;
}

type State = { error?: string; success?: boolean } | null;

export default function EditarDadosEducandoForm({
    dados,
}: {
    dados: DadosEducando;
}) {
    /* ─── Dados Cadastrais ─── */
    const [dadosState, dadosAction, isDadosPending] = useActionState<
        State,
        FormData
    >(editarDadosCadastraisEducando, null);

    const [dismissedDadosState, setDismissedDadosState] = useState<State>(null);
    const dadosSuccess =
        !!dadosState?.success && dadosState !== dismissedDadosState;

    /* ─── Info Desportiva ─── */
    const [desportoState, desportoAction, isDesportoPending] = useActionState<
        State,
        FormData
    >(editarInfoDesportivaEducando, null);

    const [dismissedDesportoState, setDismissedDesportoState] =
        useState<State>(null);
    const desportoSuccess =
        !!desportoState?.success && desportoState !== dismissedDesportoState;

    /* ─── Modo edição ─── */
    const [editingDados, setEditingDados] = useState(false);
    const [editingDesporto, setEditingDesporto] = useState(false);

    /* ─── Campos formatados (controlados) ─── */
    const [phone, setPhone] = useState(
        dados.telefone ? formatPhone(dados.telefone) : "",
    );
    const [nifVal, setNifVal] = useState(dados.nif ? formatNif(dados.nif) : "");
    const [postal, setPostal] = useState(dados.codigoPostal ?? "");

    /* ─── Avatar upload ─── */
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const displayAvatar = avatarPreview || dados.imageUrl;

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setAvatarError("Selecione um ficheiro de imagem.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError("Ficheiro demasiado grande. Máximo 5 MB.");
            return;
        }
        setAvatarError(null);
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarUploading(true);
        try {
            const fd = new FormData();
            fd.set("avatar", file);
            const res = await fetch(
                `/api/avatar?targetUserId=${dados.userId}`,
                {
                    method: "POST",
                    body: fd,
                },
            );
            const data = await res.json();
            if (!res.ok) {
                setAvatarError(data.error || "Erro ao fazer upload.");
                setAvatarPreview(null);
                return;
            }
            router.refresh();
        } catch {
            setAvatarError("Erro de rede ao fazer upload.");
            setAvatarPreview(null);
        } finally {
            setAvatarUploading(false);
        }
    }

    useEffect(() => {
        if (dadosState?.success) {
            const t = setTimeout(
                () => setDismissedDadosState(dadosState),
                3000,
            );
            setEditingDados(false);
            return () => clearTimeout(t);
        }
    }, [dadosState]);

    useEffect(() => {
        if (desportoState?.success) {
            const t = setTimeout(
                () => setDismissedDesportoState(desportoState),
                3000,
            );
            setEditingDesporto(false);
            return () => clearTimeout(t);
        }
    }, [desportoState]);

    return (
        <div className="space-y-8">
            {/* ━━━━ FOTO & CONTEXTO ━━━━ */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                            {displayAvatar ? (
                                <Image
                                    src={displayAvatar}
                                    alt={`${dados.firstName} ${dados.lastName}`}
                                    width={96}
                                    height={96}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <User
                                    size={40}
                                    className="text-gray-400 dark:text-gray-500"
                                />
                            )}
                        </div>
                        <button
                            type="button"
                            disabled={avatarUploading}
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50"
                        >
                            {avatarUploading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Camera size={14} />
                            )}
                        </button>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left space-y-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {dados.firstName} {dados.lastName}
                        </h2>

                        {/* Email & Data de nascimento */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start text-xs text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                                <Mail size={12} />
                                {dados.email}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Calendar size={12} />
                                {dados.dataNascimento
                                    ? new Date(
                                          dados.dataNascimento,
                                      ).toLocaleDateString("pt-PT")
                                    : "—"}
                            </span>
                        </div>

                        {/* Badges — sempre visíveis */}
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium">
                                <Shield size={12} />
                                {dados.clubeNome || "Sem clube"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
                                <Users size={12} />
                                {dados.equipaNome || "Sem equipa"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                                <GraduationCap size={12} />
                                {dados.treinadorNome || "Sem treinador"}
                            </span>
                        </div>
                    </div>
                </div>
                {avatarError && (
                    <p className="mt-3 text-xs text-red-600 dark:text-red-400 text-center sm:text-left">
                        {avatarError}
                    </p>
                )}
            </section>

            {/* ━━━━ DADOS CADASTRAIS ━━━━ */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <User size={20} className="text-blue-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Dados Cadastrais
                        </h2>
                    </div>
                    {!editingDados && (
                        <button
                            type="button"
                            onClick={() => setEditingDados(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                            <Pencil size={14} />
                            Editar
                        </button>
                    )}
                </div>

                {dadosState?.error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                        {dadosState.error}
                    </div>
                )}
                {dadosSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Check size={16} /> Dados atualizados com sucesso.
                    </div>
                )}

                <form action={dadosAction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Nome"
                            name="firstName"
                            defaultValue={dados.firstName}
                            required
                            disabled={!editingDados}
                        />
                        <Field
                            label="Apelido"
                            name="lastName"
                            defaultValue={dados.lastName}
                            required
                            disabled={!editingDados}
                        />
                        <Field
                            label="Telefone"
                            name="telefone"
                            value={phone}
                            onChange={(v) => setPhone(formatPhone(v))}
                            placeholder="(351) 912 345 678"
                            maxLength={17}
                            disabled={!editingDados}
                        />
                        <Field
                            label="NIF"
                            name="nif"
                            value={nifVal}
                            onChange={(v) => setNifVal(formatNif(v))}
                            placeholder="123 456 789"
                            maxLength={11}
                            disabled={!editingDados}
                        />
                        <Field
                            label="Morada"
                            name="morada"
                            defaultValue={dados.morada ?? ""}
                            disabled={!editingDados}
                        />
                        <Field
                            label="Cidade"
                            name="cidade"
                            defaultValue={dados.cidade ?? ""}
                            disabled={!editingDados}
                        />
                        <Field
                            label="Código Postal"
                            name="codigo_postal"
                            value={postal}
                            onChange={(v) => setPostal(normalizePostalCode(v))}
                            placeholder="0000-000"
                            maxLength={8}
                            disabled={!editingDados}
                        />
                        <Field
                            label="País"
                            name="pais"
                            defaultValue={dados.pais ?? ""}
                            placeholder="Portugal"
                            disabled={!editingDados}
                        />
                    </div>

                    {editingDados && (
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingDados(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isDadosPending}
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDadosPending && (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                )}
                                Guardar dados
                            </button>
                        </div>
                    )}
                </form>
            </section>

            {/* ━━━━ INFORMAÇÕES DESPORTIVAS ━━━━ */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Dumbbell size={20} className="text-green-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Informações Desportivas
                        </h2>
                    </div>
                    {!editingDesporto && (
                        <button
                            type="button"
                            onClick={() => setEditingDesporto(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                        >
                            <Pencil size={14} />
                            Editar
                        </button>
                    )}
                </div>

                {desportoState?.error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                        {desportoState.error}
                    </div>
                )}
                {desportoSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Check size={16} /> Informações desportivas atualizadas.
                    </div>
                )}

                <form action={desportoAction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                            label="Altura (cm)"
                            name="altura_cm"
                            defaultValue={dados.alturaCm?.toString() ?? ""}
                            type="number"
                            min={100}
                            max={300}
                            step="1"
                            placeholder="170"
                            disabled={!editingDesporto}
                        />
                        <Field
                            label="Peso (kg)"
                            name="peso_kg"
                            defaultValue={dados.pesoKg?.toString() ?? ""}
                            type="number"
                            min={10}
                            max={300}
                            step="0.1"
                            placeholder="70"
                            disabled={!editingDesporto}
                        />
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Mão dominante
                            </label>
                            <select
                                name="mao_dominante"
                                defaultValue={dados.maoDominante ?? ""}
                                disabled={!editingDesporto}
                                className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!editingDesporto ? "bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed" : "bg-white dark:bg-gray-800"}`}
                            >
                                <option value="">—</option>
                                <option value="direita">Direita</option>
                                <option value="esquerda">Esquerda</option>
                                <option value="ambidestro">Ambidestro</option>
                            </select>
                        </div>
                    </div>

                    {editingDesporto && (
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingDesporto(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isDesportoPending}
                                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDesportoPending && (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                )}
                                Guardar desportivas
                            </button>
                        </div>
                    )}
                </form>
            </section>
        </div>
    );
}

function Field({
    label,
    name,
    defaultValue,
    value,
    onChange,
    required,
    type = "text",
    disabled,
    maxLength,
    placeholder,
    inputMode,
    min,
    max,
    step,
}: {
    label: string;
    name: string;
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    required?: boolean;
    type?: string;
    disabled?: boolean;
    maxLength?: number;
    placeholder?: string;
    inputMode?: "numeric" | "text";
    min?: number;
    max?: number;
    step?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                {...(value !== undefined
                    ? { value, onChange: (e) => onChange?.(e.target.value) }
                    : { defaultValue })}
                required={required}
                disabled={disabled}
                maxLength={maxLength}
                placeholder={placeholder}
                inputMode={inputMode}
                min={min}
                max={max}
                step={step}
                className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? "bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed" : "bg-white dark:bg-gray-800"}`}
            />
        </div>
    );
}
