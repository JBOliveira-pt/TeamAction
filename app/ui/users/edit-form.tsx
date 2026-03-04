// app/ui/users/edit-form.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/ui/button";
import { useActionState, useState, ChangeEvent } from "react";
import { updateUser, UserState } from "@/app/lib/actions";
import { User } from "@/app/lib/definitions";
import {
    AtSymbolIcon,
    PhotoIcon,
    UserIcon,
    KeyIcon,
    XMarkIcon,
    PencilIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";

const initialState: UserState = { message: null, errors: {} };

function splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");
    return { firstName, lastName };
}

export default function EditUserForm({ user }: { user: User }) {
    const { firstName, lastName } = splitName(user.name);
    const updateUserWithId = updateUser.bind(null, user.id);
    const [state, formAction] = useActionState(updateUserWithId, initialState);
    const [preview, setPreview] = useState<string | null>(null);

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        } else {
            setPreview(null);
        }
    }

    const resetImage = () => {
        setPreview(null);
        const input = document.getElementById("imageFile") as HTMLInputElement;
        if (input) input.value = "";
    };

    // Helper function para renderizar erros
    const renderErrors = (errors: string[] | undefined) => {
        if (!errors || !Array.isArray(errors)) return null;
        return errors.map((error) => (
            <p key={error} className="text-sm text-red-400">
                {error}
            </p>
        ));
    };

    return (
        <form action={formAction}>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                {/* Form Header */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Image
                                src={preview || user.image_url}
                                alt={user.name}
                                width={56}
                                height={56}
                                className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700 object-cover"
                                style={{ aspectRatio: "1 / 1" }}
                            />
                            {preview && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Editar Utilizador
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                {user.email}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                                    user.role === "admin"
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                }`}
                            >
                                {user.role === "admin" ? "Admin" : "Utilizador"}
                            </span>
                            <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                                ID: {user.id.slice(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Name Fields */}
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                    {/* First Name */}
                    <div className="space-y-2">
                        <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Primeiro Nome
                        </label>
                        <div className="relative">
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                defaultValue={firstName}
                                className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="João"
                                aria-describedby="firstName-error"
                            />
                            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                        </div>
                        <div
                            id="firstName-error"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {renderErrors(state.errors?.firstName)}
                        </div>
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                        <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Sobrenome
                        </label>
                        <div className="relative">
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                defaultValue={lastName}
                                className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Silva"
                                aria-describedby="lastName-error"
                            />
                            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                        </div>
                        <div
                            id="lastName-error"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {renderErrors(state.errors?.lastName)}
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="mb-6 space-y-2">
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
                            defaultValue={user.email}
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="joao.silva@example.com"
                            aria-describedby="email-error"
                        />
                        <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                    </div>
                    <div id="email-error" aria-live="polite" aria-atomic="true">
                        {renderErrors(state.errors?.email)}
                    </div>
                </div>

                {/* IBAN */}
                <div className="mb-6 space-y-2">
                    <label
                        htmlFor="iban"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        IBAN do Emissor
                    </label>
                    <div className="relative">
                        <input
                            id="iban"
                            name="iban"
                            type="text"
                            defaultValue={user.iban || ""}
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="PT50 0002 0123 1234 5678 9015 4"
                            aria-describedby="iban-error"
                        />
                        <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-xs text-gray-500">
                        Necessario para emissao de recibos
                    </p>
                    <div id="iban-error" aria-live="polite" aria-atomic="true">
                        {renderErrors(state.errors?.iban)}
                    </div>
                </div>

                {/* Password */}
                <div className="mb-6 space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Nova Senha
                        <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                            (deixe em branco para manter a atual)
                        </span>
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="Digite a nova senha"
                            aria-describedby="password-error"
                        />
                        <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                    </div>
                    <div
                        id="password-error"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {renderErrors(state.errors?.password)}
                    </div>
                </div>

                {/* Image Upload */}
                <div className="mb-6 space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Foto do Utilizador
                    </label>

                    <div className="flex items-start gap-4">
                        {/* Current/Preview Image */}
                        <div className="relative shrink-0">
                            <Image
                                src={preview || user.image_url}
                                alt={user.name}
                                width={80}
                                height={80}
                                className="rounded-lg ring-2 ring-gray-300 dark:ring-gray-700 object-cover"
                                style={{ aspectRatio: "1 / 1" }}
                            />
                            {preview && (
                                <button
                                    type="button"
                                    onClick={resetImage}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* Upload Area */}
                        <div className="flex-1">
                            <label
                                htmlFor="imageFile"
                                className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:border-blue-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <ArrowPathIcon className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                Alterar foto
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG ou GIF (MAX. 2MB)
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <input
                                id="imageFile"
                                name="imageFile"
                                type="file"
                                accept="image/*"
                                onChange={onFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {preview && (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            Nova imagem selecionada
                        </p>
                    )}

                    <div id="image-error" aria-live="polite" aria-atomic="true">
                        {renderErrors(state.errors?.imageFile)}
                    </div>
                </div>

                {/* Error Message */}
                {state.message && (
                    <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/50 p-4">
                        <p className="text-sm text-red-400">{state.message}</p>
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex items-center justify-end gap-4">
                <Link
                    href="/dashboard/users"
                    className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                >
                    <XMarkIcon className="h-4 w-4" />
                    Cancelar
                </Link>
                <Button type="submit">
                    <PencilIcon className="h-4 w-4" />
                    Salvar Alterações
                </Button>
            </div>
        </form>
    );
}
