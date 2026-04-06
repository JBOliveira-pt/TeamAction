"use client";

import { atualizarPerfilTreinador } from "@/app/lib/actions";
import {
    ArrowLeftIcon,
    AtSymbolIcon,
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

type TreinadorPerfil = {
    nome: string;
    sobrenome: string;
    email: string;
    telefone: string | null;
    morada: string | null;
    data_nascimento: string | null;
};

const inputBase =
    "peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

const iconBase =
    "pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors";

function toDateInputValue(date: string | null) {
    if (!date) return "";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default function EditTreinadorProfileForm({
    treinador,
}: {
    treinador: TreinadorPerfil;
}) {
    const [state, formAction, isPending] = useActionState(
        atualizarPerfilTreinador,
        null,
    );
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            const show = setTimeout(() => setShowSuccess(true), 0);
            const nav = setTimeout(() => {
                router.push("/dashboard/treinador/perfil");
            }, 1500);
            return () => {
                clearTimeout(show);
                clearTimeout(nav);
            };
        }
    }, [state, router]);

    return (
        <form action={formAction}>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <UserIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Editar Perfil
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Atualize os seus dados e guarde as alterações
                        </p>
                    </div>
                </div>

                {/* Nome + Sobrenome */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <label
                            htmlFor="nome"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Nome
                        </label>
                        <div className="relative">
                            <input
                                id="nome"
                                name="nome"
                                type="text"
                                defaultValue={treinador.nome}
                                className={inputBase}
                                placeholder="João"
                            />
                            <UserIcon className={iconBase} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="sobrenome"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Sobrenome
                        </label>
                        <div className="relative">
                            <input
                                id="sobrenome"
                                name="sobrenome"
                                type="text"
                                defaultValue={treinador.sobrenome}
                                className={inputBase}
                                placeholder="Silva"
                            />
                            <UserIcon className={iconBase} />
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Email
                    </label>
                    <div className="relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={treinador.email}
                            disabled
                            className="peer block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 py-3 pl-10 pr-4 text-sm text-gray-400 dark:text-gray-500 outline-none cursor-not-allowed"
                        />
                        <AtSymbolIcon className={iconBase} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        O email não pode ser alterado aqui.
                    </p>
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                    <label
                        htmlFor="telefone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Telemóvel
                    </label>
                    <div className="relative">
                        <input
                            id="telefone"
                            name="telefone"
                            type="tel"
                            defaultValue={treinador.telefone ?? ""}
                            className={inputBase}
                            placeholder="+351 912 345 678"
                        />
                        <PhoneIcon className={iconBase} />
                    </div>
                </div>

                {/* Morada */}
                <div className="space-y-1">
                    <label
                        htmlFor="morada"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Morada
                    </label>
                    <div className="relative">
                        <input
                            id="morada"
                            name="morada"
                            type="text"
                            defaultValue={treinador.morada ?? ""}
                            className={inputBase}
                            placeholder="Rua Exemplo, 123, 1000-001 Lisboa"
                        />
                        <MapPinIcon className={iconBase} />
                    </div>
                </div>

                {/* Data de nascimento */}
                <div className="space-y-1">
                    <label
                        htmlFor="data_nascimento"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Data de Nascimento
                    </label>
                    <div className="relative">
                        <input
                            id="data_nascimento"
                            name="data_nascimento"
                            type="date"
                            defaultValue={toDateInputValue(
                                treinador.data_nascimento,
                            )}
                            className={inputBase}
                        />
                        <CalendarIcon className={iconBase} />
                    </div>
                </div>

                {/* Sucesso */}
                {showSuccess && (
                    <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 animate-fade-out">
                        Perfil atualizado com sucesso!
                    </div>
                )}

                {/* Erro global */}
                {state?.error && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                        {state.error}
                    </p>
                )}

                {/* Ações */}
                <div className="flex gap-3 pt-2">
                    <Link
                        href="/dashboard/treinador/perfil"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors"
                    >
                        {isPending ? "A guardar..." : "Guardar Alterações"}
                    </button>
                </div>
            </div>
        </form>
    );
}
