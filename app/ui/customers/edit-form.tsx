"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/ui/button";
import { useActionState, useState } from "react";
import { updateCustomer, CustomerState } from "@/app/lib/actions";
import { Customer } from "@/app/lib/definitions";
import {
    AtSymbolIcon,
    PhotoIcon,
    UserIcon,
    XMarkIcon,
    PencilIcon,
    ArrowPathIcon,
    IdentificationIcon,
    HomeModernIcon,
} from "@heroicons/react/24/outline";

const initialState: CustomerState = { message: null, errors: {} };

function splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");
    return { firstName, lastName };
}

export default function EditCustomerForm({ customer }: { customer: Customer }) {
    const { firstName, lastName } = splitName(customer.name);
    const updateCustomerWithId = updateCustomer.bind(null, customer.id);
    const [state, formAction] = useActionState(
        updateCustomerWithId,
        initialState,
    );
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetImage = () => {
        setImagePreview(null);
        const input = document.getElementById("imageFile") as HTMLInputElement;
        if (input) input.value = "";
    };

    return (
        <form action={formAction}>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                {/* Form Header */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        {/* Current Avatar */}
                        <div className="relative">
                            <Image
                                src={imagePreview || customer.image_url}
                                alt={customer.name}
                                width={56}
                                height={56}
                                className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700 object-cover"
                                style={{ aspectRatio: "1 / 1" }}
                            />
                            {imagePreview && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Editar Cliente
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                {customer.email}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <span className="px-2.5 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                                ID: {customer.id.slice(0, 8)}
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
                                className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                placeholder="João"
                                aria-describedby="firstName-error"
                            />
                            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-purple-400 transition-colors" />
                        </div>
                        <div
                            id="firstName-error"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {state.errors?.firstName?.map((error) => (
                                <p key={error} className="text-sm text-red-400">
                                    {error}
                                </p>
                            ))}
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
                                className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                placeholder="Silva"
                                aria-describedby="lastName-error"
                            />
                            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-purple-400 transition-colors" />
                        </div>
                        <div
                            id="lastName-error"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {state.errors?.lastName?.map((error) => (
                                <p key={error} className="text-sm text-red-400">
                                    {error}
                                </p>
                            ))}
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
                            defaultValue={customer.email}
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                            placeholder="joao.silva@example.com"
                            aria-describedby="email-error"
                        />
                        <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-purple-400 transition-colors" />
                    </div>
                    <div id="email-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.email?.map((error) => (
                            <p key={error} className="text-sm text-red-400">
                                {error}
                            </p>
                        ))}
                    </div>
                </div>

                {/* NIF and Endereço Fiscal */}
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                    {/* NIF */}
                    <div className="space-y-2">
                        <label
                            htmlFor="nif"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            NIF
                        </label>
                        <div className="relative">
                            <input
                                id="nif"
                                name="nif"
                                type="text"
                                maxLength={9}
                                defaultValue={customer.nif || ''}
                                className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                placeholder="123456789"
                                aria-describedby="nif-error"
                            />
                            <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-purple-400 transition-colors" />
                        </div>
                        <div
                            id="nif-error"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {state.errors?.nif?.map((error) => (
                                <p key={error} className="text-sm text-red-400">
                                    {error}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Endereço Fiscal */}
                    <div className="space-y-2">
                        <label
                            htmlFor="endereco_fiscal"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Endereço Fiscal
                        </label>
                        <div className="relative">
                            <input
                                id="endereco_fiscal"
                                name="endereco_fiscal"
                                type="text"
                                maxLength={255}
                                defaultValue={customer.endereco_fiscal || ''}
                                className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                placeholder="Rua exemplo, 123, 1000-001 Lisboa"
                                aria-describedby="endereco_fiscal-error"
                            />
                            <HomeModernIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-purple-400 transition-colors" />
                        </div>
                        <div
                            id="endereco_fiscal-error"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {state.errors?.endereco_fiscal?.map((error) => (
                                <p key={error} className="text-sm text-red-400">
                                    {error}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Foto do Cliente
                    </label>

                    <div className="flex items-start gap-4">
                        {/* Current Image */}
                        <div className="relative shrink-0">
                            <Image
                                src={imagePreview || customer.image_url}
                                alt={customer.name}
                                width={80}
                                height={80}
                                className="rounded-lg ring-2 ring-gray-300 dark:ring-gray-700 object-cover"
                                style={{ aspectRatio: "1 / 1" }}
                            />
                            {imagePreview && (
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
                                className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:border-purple-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <ArrowPathIcon className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-purple-400 transition-colors" />
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
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    {imagePreview && (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            Nova imagem selecionada
                        </p>
                    )}

                    <div id="image-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.imageFile?.map((error) => (
                            <p key={error} className="text-sm text-red-400">
                                {error}
                            </p>
                        ))}
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
                    href="/dashboard/customers"
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
