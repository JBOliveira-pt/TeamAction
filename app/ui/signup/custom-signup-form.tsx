"use client";

import { useSignUp } from "@clerk/nextjs";
import {
    CheckCircle2,
    Lock,
    Mail,
    Megaphone,
    Shield,
    User,
    Users,
    Volleyball,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type SignUpStage = "form" | "verify";

const ACCOUNT_TYPE_OPTIONS: {
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
        description: "Planeamento técnico e treino.",
        icon: Megaphone,
    },
    {
        value: "atleta",
        label: "Atleta",
        description: "Perfil desportivo e evolução.",
        icon: Volleyball,
    },
    {
        value: "responsavel",
        label: "Responsável",
        description: "Acompanhamento do atleta.",
        icon: Users,
    },
];

function splitName(fullName: string) {
    const normalized = fullName.trim();
    if (!normalized) return { firstName: "", lastName: "" };

    const parts = normalized.split(/\s+/);
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: "" };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" "),
    };
}

export default function CustomSignUpForm() {
    const router = useRouter();
    const { isLoaded, signUp, setActive } = useSignUp();

    const [stage, setStage] = useState<SignUpStage>("form");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [fullName, setFullName] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [accountType, setAccountType] = useState<AccountType>("presidente");
    const [verificationCode, setVerificationCode] = useState("");
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [idade, setIdade] = useState("");
    const [alturaCm, setAlturaCm] = useState("");
    const [pesoKg, setPesoKg] = useState("");

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        };
    }, [photoPreviewUrl]);

    const accountTypeLabel = useMemo(() => {
        return (
            ACCOUNT_TYPE_OPTIONS.find((option) => option.value === accountType)
                ?.label || "Conta"
        );
    }, [accountType]);

    const getClerkErrorMessage = (error: unknown) => {
        if (
            error &&
            typeof error === "object" &&
            "errors" in error &&
            Array.isArray((error as { errors?: unknown[] }).errors)
        ) {
            const firstError = (error as { errors: any[] }).errors[0];
            return (
                firstError?.longMessage ||
                firstError?.message ||
                "Nao foi possivel concluir o registo."
            );
        }

        return "Nao foi possivel concluir o registo.";
    };

    const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isLoaded) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const { firstName, lastName } = splitName(fullName);

            await signUp.create({
                emailAddress,
                password,
                firstName,
                lastName,
                unsafeMetadata: {
                    accountType,
                },
            });

            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });

            setStage("verify");
        } catch (error) {
            setErrorMessage(getClerkErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

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
            setErrorMessage("Formato de foto inválido. Use JPG, PNG ou WEBP.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_PHOTO_SIZE) {
            setErrorMessage("A foto deve ter no máximo 5MB.");
            event.target.value = "";
            return;
        }

        setErrorMessage(null);
        setProfilePhoto(file);

        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }
        setPhotoPreviewUrl(URL.createObjectURL(file));
    };

    const handleVerifyEmail = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isLoaded) return;

        setIsSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        if (accountType === "atleta") {
            const idadeNum = Number(idade);
            const alturaNum = Number(alturaCm);
            const pesoNum = Number(pesoKg);

            if (
                !Number.isInteger(idadeNum) ||
                idadeNum <= 0 ||
                Number.isNaN(alturaNum) ||
                alturaNum <= 0 ||
                Number.isNaN(pesoNum) ||
                pesoNum <= 0
            ) {
                setIsSubmitting(false);
                setErrorMessage(
                    "Para atleta, idade, altura e peso são obrigatórios e devem ser válidos.",
                );
                return;
            }
        }

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification(
                {
                    code: verificationCode,
                },
            );

            if (completeSignUp.status !== "complete") {
                setErrorMessage(
                    "Codigo invalido. Verifique e tente novamente.",
                );
                return;
            }

            await setActive({ session: completeSignUp.createdSessionId });

            const payload = new FormData();
            payload.append("accountType", accountType);
            if (profilePhoto) {
                payload.append("profilePhoto", profilePhoto);
            }
            if (accountType === "atleta") {
                payload.append("idade", idade);
                payload.append("altura_cm", alturaCm);
                payload.append("peso_kg", pesoKg);
            }

            const profileResponse = await fetch("/api/account-type", {
                method: "POST",
                body: payload,
            });

            if (!profileResponse.ok) {
                const data = await profileResponse.json().catch(() => ({
                    error: "Erro ao guardar dados do perfil.",
                }));
                throw new Error(
                    data?.error || "Erro ao guardar dados do perfil.",
                );
            }

            setSuccessMessage(
                "Registo concluído com sucesso. A redirecionar...",
            );
            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 1000);
        } catch (error) {
            setErrorMessage(getClerkErrorMessage(error));
        } finally {
            setIsSubmitting(false);
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
                            Criar Conta TeamAction
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-300">
                            Escolha o tipo de conta e complete o registo.
                        </p>
                    </div>
                </div>

                {stage === "form" ? (
                    <form className="space-y-6" onSubmit={handleCreateAccount}>
                        <div className="grid gap-6 md:grid-cols-2">
                            {ACCOUNT_TYPE_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const active = accountType === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            setAccountType(option.value)
                                        }
                                        className={`text-left rounded-lg border p-4 transition-colors ${
                                            active
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon className="h-5 w-5 mt-0.5 text-emerald-500" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nome completo
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(event) =>
                                            setFullName(event.target.value)
                                        }
                                        className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="Nome e sobrenome"
                                    />
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={emailAddress}
                                        onChange={(event) =>
                                            setEmailAddress(event.target.value)
                                        }
                                        className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="email@exemplo.com"
                                    />
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Palavra-passe
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Minimo de 8 caracteres"
                                />
                                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>

                        {errorMessage && (
                            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                                {errorMessage}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600"
                            >
                                Ja tenho conta
                            </Link>
                            <button
                                type="submit"
                                disabled={!isLoaded || isSubmitting}
                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/35 transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? "A criar conta..."
                                    : `Continuar como ${accountTypeLabel}`}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="space-y-6" onSubmit={handleVerifyEmail}>
                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
                            <div className="flex gap-2 items-center text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <p className="text-sm font-medium">
                                    Enviamos um codigo para {emailAddress}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Codigo de verificacao
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                                value={verificationCode}
                                onChange={(event) =>
                                    setVerificationCode(event.target.value)
                                }
                                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                placeholder="Insira o codigo"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Foto de perfil (opcional)
                            </label>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoChange}
                                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Tipos permitidos: JPG, PNG, WEBP. Tamanho
                                máximo: 5MB.
                            </p>
                            {photoPreviewUrl && (
                                <div className="pt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        Preview:
                                    </p>
                                    <img
                                        src={photoPreviewUrl}
                                        alt="Preview da foto"
                                        className="h-20 w-20 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            )}
                        </div>

                        {accountType === "atleta" && (
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Idade
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={idade}
                                        onChange={(event) =>
                                            setIdade(event.target.value)
                                        }
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        placeholder="Ex: 16"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        placeholder="Ex: 172"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        placeholder="Ex: 63.5"
                                    />
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                                {errorMessage}
                            </p>
                        )}

                        {successMessage && (
                            <p className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
                                {successMessage}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                onClick={() => setStage("form")}
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    !isLoaded ||
                                    isSubmitting ||
                                    Boolean(successMessage)
                                }
                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/35 transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? "A verificar..."
                                    : "Confirmar e concluir"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
