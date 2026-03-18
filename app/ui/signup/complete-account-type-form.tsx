"use client";

import {
    Lock,
    Mail,
    Megaphone,
    Shield,
    User,
    Users,
    Volleyball,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_SIGNUP_AGE = 5;
const MAX_SIGNUP_AGE = 120;
const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;
const PORTUGAL_COUNTRY = "Portugal";
const PRESIDENT_SPORT_OPTIONS = [
    "Basquetebol",
    "andebol",
    "futsal",
    "voleibol",
    "ténis",
    "ténis de mesa",
    "badminton",
    "padel",
    "pickleball",
    "squash",
    "racquetball",
    "hóquei em patins",
    "floorball",
    "corfebol",
    "voleibol sentado",
    "basquetebol em cadeira de rodas",
    "andebol em cadeira de rodas",
    "goalball",
    "hóquei indoor",
] as const;
type CompleteStage = "form" | "president-profile";

function formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0];
}

function getBirthDateBounds() {
    const today = new Date();
    const maxBirthDate = new Date(today);
    maxBirthDate.setFullYear(today.getFullYear() - MIN_SIGNUP_AGE);

    const minBirthDate = new Date(today);
    minBirthDate.setFullYear(today.getFullYear() - MAX_SIGNUP_AGE);

    return {
        minBirthDate: formatDateForInput(minBirthDate),
        maxBirthDate: formatDateForInput(maxBirthDate),
    };
}

function calculateAge(birthDateIso: string): number | null {
    const birthDate = new Date(`${birthDateIso}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age -= 1;
    }

    return age;
}

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

const OPTIONS: {
    value: AccountType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    {
        value: "presidente",
        label: "Presidente",
        description: "Gestao geral do clube e equipa.",
        icon: Shield,
    },
    {
        value: "treinador",
        label: "Treinador",
        description: "Planeamento tecnico e treino.",
        icon: Megaphone,
    },
    {
        value: "atleta",
        label: "Atleta",
        description: "Perfil desportivo e evolucao.",
        icon: Volleyball,
    },
    {
        value: "responsavel",
        label: "Responsável",
        description: "Acompanhamento do atleta.",
        icon: Users,
    },
];

interface CompleteAccountTypeFormProps {
    initialFirstName?: string;
    initialLastName?: string;
    initialEmail?: string;
}

export default function CompleteAccountTypeForm({
    initialFirstName = "",
    initialLastName = "",
    initialEmail = "",
}: CompleteAccountTypeFormProps) {
    const { minBirthDate, maxBirthDate } = getBirthDateBounds();
    const router = useRouter();
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [emailAddress] = useState(initialEmail);
    const [birthDate, setBirthDate] = useState("");
    const [password, setPassword] = useState("");
    const [selected, setSelected] = useState<AccountType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [alturaCm, setAlturaCm] = useState("");
    const [pesoKg, setPesoKg] = useState("");
    const [stage, setStage] = useState<CompleteStage>("form");
    const [presidentClubName, setPresidentClubName] = useState("");
    const [presidentSport, setPresidentSport] = useState("");
    const [presidentIban, setPresidentIban] = useState("");
    const [presidentNipc, setPresidentNipc] = useState("");
    const [presidentWebsite, setPresidentWebsite] = useState("");
    const [presidentPhone, setPresidentPhone] = useState("");
    const [presidentPostalCode, setPresidentPostalCode] = useState("");
    const [presidentAddress, setPresidentAddress] = useState("");
    const [presidentCity, setPresidentCity] = useState("");
    const [isResolvingCity, setIsResolvingCity] = useState(false);

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        };
    }, [photoPreviewUrl]);

    const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (!file) {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
            setProfilePhoto(null);
            setPhotoPreviewUrl(null);
            return;
        }

        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
            setError("Formato de foto inválido. Use JPG, PNG ou WEBP.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_PHOTO_SIZE) {
            setError("A foto deve ter no máximo 5MB.");
            event.target.value = "";
            return;
        }

        setError(null);
        setProfilePhoto(file);

        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }
        setPhotoPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        setSuccessMessage(null);

        if (!firstName.trim()) {
            setError("Informe o primeiro nome.");
            return;
        }

        if (!lastName.trim()) {
            setError("Informe o último nome.");
            return;
        }

        if (!emailAddress.trim()) {
            setError("Email inválido.");
            return;
        }

        if (!birthDate) {
            setError("Informe a data de nascimento.");
            return;
        }

        const age = calculateAge(birthDate);
        if (age === null || age < MIN_SIGNUP_AGE || age > MAX_SIGNUP_AGE) {
            setError(
                `A idade deve estar entre ${MIN_SIGNUP_AGE} e ${MAX_SIGNUP_AGE} anos.`,
            );
            return;
        }

        if (password.trim().length < 8) {
            setError("A palavra-passe deve ter no mínimo 8 caracteres.");
            return;
        }

        if (!selected) {
            setError("Selecione um tipo de conta.");
            return;
        }

        if (selected === "atleta") {
            const alturaNum = Number(alturaCm);
            const pesoNum = Number(pesoKg);

            if (
                Number.isNaN(alturaNum) ||
                alturaNum <= 0 ||
                Number.isNaN(pesoNum) ||
                pesoNum <= 0
            ) {
                setError(
                    "Para atleta, altura e peso são obrigatórios e devem ser válidos.",
                );
                return;
            }
        }

        if (selected === "presidente" && stage === "form") {
            setError(null);
            setStage("president-profile");
            return;
        }

        if (selected === "presidente") {
            if (!presidentClubName.trim()) {
                setError("Nome do clube é obrigatório.");
                return;
            }

            if (!presidentSport.trim()) {
                setError("Modalidade é obrigatória.");
                return;
            }

            if (
                !PRESIDENT_SPORT_OPTIONS.some(
                    (option) => option === presidentSport.trim(),
                )
            ) {
                setError("Selecione uma modalidade válida da lista.");
                return;
            }

            const normalizedPostalCode =
                normalizePostalCode(presidentPostalCode);
            if (
                normalizedPostalCode.length > 0 &&
                !POSTAL_CODE_REGEX.test(normalizedPostalCode)
            ) {
                setError("Código Postal inválido. Use o formato 0000-000.");
                return;
            }

            if (normalizedPostalCode && !presidentCity.trim()) {
                setError(
                    "Cidade é obrigatória quando o Código Postal é preenchido.",
                );
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = new FormData();
            payload.append("firstName", firstName.trim());
            payload.append("lastName", lastName.trim());
            payload.append("email", emailAddress.trim());
            payload.append("birthDate", birthDate);
            payload.append("password", password);
            payload.append("accountType", selected);
            if (profilePhoto) {
                payload.append("profilePhoto", profilePhoto);
            }

            if (selected === "atleta") {
                payload.append("altura_cm", alturaCm);
                payload.append("peso_kg", pesoKg);
            }
            if (selected === "presidente") {
                payload.append("president_club_name", presidentClubName.trim());
                payload.append("president_sport", presidentSport.trim());
                payload.append("president_iban", presidentIban.trim());
                payload.append("president_nipc", presidentNipc.trim());
                payload.append("president_website", presidentWebsite.trim());
                payload.append("president_phone", presidentPhone.trim());
                payload.append(
                    "president_postal_code",
                    normalizePostalCode(presidentPostalCode),
                );
                payload.append("president_address", presidentAddress.trim());
                payload.append("president_city", presidentCity.trim());
                payload.append("president_country", PORTUGAL_COUNTRY);
            }

            const response = await fetch("/api/account-type", {
                method: "POST",
                body: payload,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(
                    data?.error || "Nao foi possivel guardar o tipo de conta.",
                );
            }

            setSuccessMessage(
                "Perfil concluído com sucesso. A redirecionar...",
            );
            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 1000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao guardar.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveCityByPostalCode = async () => {
        const postalCode = normalizePostalCode(presidentPostalCode);
        if (!POSTAL_CODE_REGEX.test(postalCode)) {
            setError("Código Postal inválido. Use o formato 0000-000.");
            return;
        }

        setError(null);
        setIsResolvingCity(true);

        try {
            const city = await fetchCityByPostalCode(postalCode);
            if (!city) {
                setError(
                    "Não foi possível obter a cidade para este Código Postal.",
                );
                return;
            }

            setPresidentPostalCode(postalCode);
            setPresidentCity(city);
        } catch {
            setError(
                "Não foi possível obter a cidade para este Código Postal.",
            );
        } finally {
            setIsResolvingCity(false);
        }
    };

    return (
        <div className="w-full max-w-2xl">
            <div className="space-y-8 rounded-3xl border border-blue-200/20 bg-slate-950/60 p-6 backdrop-blur-xl backdrop-saturate-150 md:p-8">
                <div className="flex items-center gap-3 border-b border-blue-200/20 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-blue-200/30 bg-slate-950/70 shadow-[0_10px_30px_rgba(15,23,42,0.65)]">
                        <Image
                            src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-logo-white.png"
                            width={48}
                            height={48}
                            alt="TeamAction"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            Criar Conta{" "}
                            <span className="font-bold">TeamAction</span>
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-300">
                            Escolha o tipo de conta e complete o registo
                        </p>
                    </div>
                </div>

                {stage === "form" ? (
                    <>
                        <div className="grid gap-6 md:grid-cols-2">
                            {OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const active = selected === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            setSelected(option.value)
                                        }
                                        className={`text-left rounded-lg border p-4 transition-colors ${
                                            active
                                                ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon className="h-5 w-5 mt-0.5 text-emerald-500" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-300 dark:text-white">
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Primeiro Nome
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(event) =>
                                            setFirstName(event.target.value)
                                        }
                                        className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="Primeiro nome"
                                    />
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Último Nome
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(event) =>
                                            setLastName(event.target.value)
                                        }
                                        className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="Último nome"
                                    />
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={emailAddress}
                                        readOnly
                                        aria-readonly="true"
                                        className="peer block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                    />
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Data de Nascimento
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={birthDate}
                                    onChange={(event) =>
                                        setBirthDate(event.target.value)
                                    }
                                    min={minBirthDate}
                                    max={maxBirthDate}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                Palavra-passe
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Minimo de 8 caracteres"
                                />
                                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3 md:items-start">
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Foto de perfil (opcional)
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        id="complete-account-profile-photo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="complete-account-profile-photo"
                                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-700/35 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
                                    >
                                        Escolher ficheiro
                                    </label>
                                    <span className="max-w-full truncate text-sm text-gray-300">
                                        {profilePhoto?.name ||
                                            "Nenhum ficheiro selecionado"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-400">
                                    Tipos permitidos: JPG, PNG, WEBP. Tamanho
                                    máximo: 5MB.
                                </p>
                            </div>

                            <div className="md:col-span-1">
                                <p className="text-xs text-gray-400 dark:text-gray-400 mb-2">
                                    Preview
                                </p>
                                <div className="flex justify-center">
                                    {photoPreviewUrl ? (
                                        <img
                                            src={photoPreviewUrl}
                                            alt="Preview da foto"
                                            className="h-16 w-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-gray-400/70 dark:border-gray-600 bg-slate-900/30">
                                            <User className="h-7 w-7 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selected === "atleta" && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                        Altura (cm)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step="0.1"
                                        value={alturaCm}
                                        onChange={(event) =>
                                            setAlturaCm(event.target.value)
                                        }
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        placeholder="Ex: 172"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                        Peso (kg)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step="0.1"
                                        value={pesoKg}
                                        onChange={(event) =>
                                            setPesoKg(event.target.value)
                                        }
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        placeholder="Ex: 63.5"
                                    />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-blue-200/20 bg-slate-900/50 p-4">
                            <p className="text-sm font-semibold text-white">
                                Presidente - Dados do Clube
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                Complete os dados para criar o perfil do clube.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={presidentClubName}
                                    onChange={(event) =>
                                        setPresidentClubName(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Nome do clube"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Modalidade
                                </label>
                                <select
                                    required
                                    value={presidentSport}
                                    onChange={(event) =>
                                        setPresidentSport(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                >
                                    <option value="">
                                        Selecione uma modalidade
                                    </option>
                                    {PRESIDENT_SPORT_OPTIONS.map((sport) => (
                                        <option key={sport} value={sport}>
                                            {sport}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    IBAN (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentIban}
                                    onChange={(event) =>
                                        setPresidentIban(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="PT50..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    NIPC (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentNipc}
                                    onChange={(event) =>
                                        setPresidentNipc(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Website (opcional)
                                </label>
                                <input
                                    type="url"
                                    value={presidentWebsite}
                                    onChange={(event) =>
                                        setPresidentWebsite(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="https://"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Telefone (opcional)
                                </label>
                                <input
                                    type="tel"
                                    value={presidentPhone}
                                    onChange={(event) =>
                                        setPresidentPhone(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Código Postal (opcional)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={presidentPostalCode}
                                        onChange={(event) =>
                                            setPresidentPostalCode(
                                                normalizePostalCode(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                        maxLength={8}
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="0000-000"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleResolveCityByPostalCode}
                                        disabled={isResolvingCity}
                                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                    >
                                        {isResolvingCity
                                            ? "A obter..."
                                            : "Obter cidade"}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Cidade (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentCity}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                    placeholder="Preenchida automaticamente"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Morada (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentAddress}
                                    onChange={(event) =>
                                        setPresidentAddress(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Complemento da morada"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    País
                                </label>
                                <input
                                    type="text"
                                    value={PORTUGAL_COUNTRY}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                        {error}
                    </p>
                )}

                {successMessage && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
                        {successMessage}
                    </p>
                )}

                <div className="flex justify-end gap-3">
                    {stage === "president-profile" && (
                        <button
                            type="button"
                            onClick={() => setStage("form")}
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-500 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-all disabled:opacity-60"
                        >
                            Voltar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || Boolean(successMessage)}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/35 transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
                    >
                        {isSubmitting
                            ? "A guardar..."
                            : stage === "president-profile"
                              ? "Concluir perfil"
                              : "Continuar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
