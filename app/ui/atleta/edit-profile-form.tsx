'use client';

import { updateAtletaProfile } from '@/app/lib/actions';
import type { Atleta, AtletaState } from '@/app/lib/definitions';
import {
    ArrowLeftIcon,
    AtSymbolIcon,
    CalendarIcon,
    IdentificationIcon,
    MapPinIcon,
    PhoneIcon,
    PhotoIcon,
    ScaleIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useState } from 'react';

const initialState: AtletaState = { errors: {}, message: null };

function FieldError({ errors }: { errors?: string[] }) {
    if (!errors?.length) return null;
    return (
        <div aria-live="polite" aria-atomic="true">
            {errors.map((e) => (
                <p key={e} className="text-xs text-red-500 mt-1">
                    {e}
                </p>
            ))}
        </div>
    );
}

const inputBase =
    'peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all';

const iconBase =
    'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-emerald-400 transition-colors';

// Normalise date (string or Date object) to YYYY-MM-DD for <input type="date">
function toDateInputValue(date: string | Date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 10);
}

export default function EditAtletaProfileForm({ atleta }: { atleta: Atleta }) {
    const [state, formAction, isPending] = useActionState(
        updateAtletaProfile,
        initialState,
    );
    const [preview, setPreview] = useState<string | null>(
        atleta.foto_perfil_url ?? null,
    );

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <form action={formAction}>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <UserIcon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Editar Perfil Utilizador
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Atualize os seus dados e guarde as alterações
                        </p>
                    </div>
                </div>

                {/* Photo upload */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                        {preview ? (
                            <Image
                                src={preview}
                                alt="Preview"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <PhotoIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        )}
                    </div>
                    <div className="text-center">
                        <label
                            htmlFor="foto_perfil"
                            className="cursor-pointer text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            {preview
                                ? 'Alterar foto'
                                : 'Adicionar foto de perfil'}
                        </label>
                        <p className="text-xs text-gray-400 mt-0.5">
                            JPG, PNG ou WEBP · máx 5MB · deixe em branco para
                            manter a atual
                        </p>
                        <input
                            id="foto_perfil"
                            name="foto_perfil"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handlePhoto}
                        />
                    </div>
                    <FieldError errors={state.errors?.foto_perfil} />
                </div>

                {/* Nome + Sobrenome */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <label
                            htmlFor="nome"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Nome *
                        </label>
                        <div className="relative">
                            <input
                                id="nome"
                                name="nome"
                                type="text"
                                defaultValue={atleta.nome}
                                className={inputBase}
                                placeholder="João"
                            />
                            <UserIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.nome} />
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="sobrenome"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Sobrenome *
                        </label>
                        <div className="relative">
                            <input
                                id="sobrenome"
                                name="sobrenome"
                                type="text"
                                defaultValue={atleta.sobrenome}
                                className={inputBase}
                                placeholder="Silva"
                            />
                            <UserIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.sobrenome} />
                    </div>
                </div>

                {/* NIF + Data de nascimento */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <label
                            htmlFor="nif"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            NIF *
                        </label>
                        <div className="relative">
                            <input
                                id="nif"
                                name="nif"
                                type="text"
                                maxLength={9}
                                pattern="\d{9}"
                                defaultValue={atleta.nif}
                                className={inputBase}
                                placeholder="123456789"
                            />
                            <IdentificationIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.nif} />
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="data_nascimento"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Data de Nascimento *
                        </label>
                        <div className="relative">
                            <input
                                id="data_nascimento"
                                name="data_nascimento"
                                type="date"
                                defaultValue={toDateInputValue(
                                    atleta.data_nascimento,
                                )}
                                className={inputBase}
                            />
                            <CalendarIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.data_nascimento} />
                    </div>
                </div>

                {/* Email + Telemóvel */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Email *
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={atleta.email}
                                className={inputBase}
                                placeholder="joao.silva@exemplo.com"
                            />
                            <AtSymbolIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.email} />
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="telemovel"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Telemóvel *
                        </label>
                        <div className="relative">
                            <input
                                id="telemovel"
                                name="telemovel"
                                type="tel"
                                defaultValue={atleta.telemovel ?? ''}
                                className={inputBase}
                                placeholder="+351 912 345 678"
                            />
                            <PhoneIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.telemovel} />
                    </div>
                </div>

                {/* Morada */}
                <div className="space-y-1">
                    <label
                        htmlFor="morada"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Morada *
                    </label>
                    <div className="relative">
                        <input
                            id="morada"
                            name="morada"
                            type="text"
                            defaultValue={atleta.morada ?? ''}
                            className={inputBase}
                            placeholder="Rua Exemplo, 123, 1000-001 Lisboa"
                        />
                        <MapPinIcon className={iconBase} />
                    </div>
                    <FieldError errors={state.errors?.morada} />
                </div>

                {/* Peso + Altura */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <label
                            htmlFor="peso_kg"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Peso (kg) *
                        </label>
                        <div className="relative">
                            <input
                                id="peso_kg"
                                name="peso_kg"
                                type="number"
                                step="0.1"
                                min="0"
                                defaultValue={atleta.peso_kg ?? ''}
                                className={inputBase}
                                placeholder="75.5"
                            />
                            <ScaleIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.peso_kg} />
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="altura_cm"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Altura (cm) *
                        </label>
                        <div className="relative">
                            <input
                                id="altura_cm"
                                name="altura_cm"
                                type="number"
                                step="0.1"
                                min="0"
                                defaultValue={atleta.altura_cm ?? ''}
                                className={inputBase}
                                placeholder="178"
                            />
                            <ScaleIcon className={iconBase} />
                        </div>
                        <FieldError errors={state.errors?.altura_cm} />
                    </div>
                </div>

                {/* Global error */}
                {state.message && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                        {state.message}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Link
                        href="/dashboard/utilizador/perfil"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors"
                    >
                        {isPending ? 'A guardar...' : 'Guardar Alterações'}
                    </button>
                </div>
            </div>
        </form>
    );
}
