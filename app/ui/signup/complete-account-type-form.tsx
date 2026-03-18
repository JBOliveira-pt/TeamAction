"use client";

import { Shield, Users, Volleyball, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

export default function CompleteAccountTypeForm() {
    const router = useRouter();
    const [selected, setSelected] = useState<AccountType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

        if (!selected) {
            setError("Selecione um tipo de conta.");
            return;
        }

        if (selected === "atleta") {
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
                setError(
                    "Para atleta, idade, altura e peso são obrigatórios e devem ser válidos.",
                );
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = new FormData();
            payload.append("accountType", selected);
            if (profilePhoto) {
                payload.append("profilePhoto", profilePhoto);
            }

            if (selected === "atleta") {
                payload.append("idade", idade);
                payload.append("altura_cm", alturaCm);
                payload.append("peso_kg", pesoKg);
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

    return (
        <div className="w-full max-w-2xl">
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Escolha o tipo da sua conta
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Antes de continuar, selecione o perfil para concluir o
                        registo.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const active = selected === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setSelected(option.value)}
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
                        Tipos permitidos: JPG, PNG, WEBP. Tamanho máximo: 5MB.
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

                {selected === "atleta" && (
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

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || Boolean(successMessage)}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {isSubmitting ? "A guardar..." : "Continuar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
