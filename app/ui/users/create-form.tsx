// app/ui/users/create-form.tsx
"use client";

import Link from "next/link";
import { Button } from "@/app/ui/button";
import { useActionState, useState, ChangeEvent } from "react";
import { createUser, UserState } from "@/app/lib/actions";
import {
    AtSymbolIcon,
    PhotoIcon,
    UserIcon,
    KeyIcon,
    XMarkIcon,
    UserPlusIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const initialState: UserState = { message: null, errors: {} };

export default function CreateUserForm() {
    const [state, formAction] = useActionState(createUser, initialState);
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
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <UserPlusIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Novo Utilizador
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                Preencha as informações do utilizador
                            </p>
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
                        Senha
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="Digite a senha"
                            aria-describedby="password-error"
                        />
                        <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-xs text-gray-500">
                        Mínimo de 6 caracteres
                    </p>
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
                        {/* Preview */}
                        <div className="relative shrink-0">
                            {preview ? (
                                <>
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-300 dark:ring-gray-700"
                                    />
                                    <button
                                        type="button"
                                        onClick={resetImage}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                                    <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                </div>
                            )}
                        </div>

                        {/* Upload Area */}
                        <div className="flex-1">
                            <label
                                htmlFor="imageFile"
                                className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:border-blue-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <PhotoIcon className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                Clique para enviar
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
                            Imagem selecionada
                        </p>
                    )}

                    <div id="image-error" aria-live="polite" aria-atomic="true">
                        {renderErrors(state.errors?.imageFile)}
                    </div>
                </div>

                {/* Role - Hidden, always user */}
                <input type="hidden" name="role" value="user" />

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
                    <UserPlusIcon className="h-4 w-4" />
                    Criar Utilizador
                </Button>
            </div>
        </form>
    );
}
