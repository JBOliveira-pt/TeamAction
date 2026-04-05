"use client";

import { useActionState, useState } from "react";
import { atualizarMeuPerfil } from "@/app/lib/actions";
import { X, Pencil } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

interface Props {
    firstName: string;
    lastName: string;
    telefone: string | null;
    morada: string | null;
    cidade: string | null;
    codigoPostal: string | null;
    pais: string | null;
    dataNascimento: string | null;
    nif: string | null;
    iban: string | null;
    accountType: string | null;
}

export default function EditarPerfilUnificadoModal({
    firstName,
    lastName,
    telefone,
    morada,
    cidade,
    codigoPostal,
    pais,
    dataNascimento,
    nif,
    iban,
    accountType,
}: Props) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        atualizarMeuPerfil,
        null,
    );
    const [prevState, setPrevState] = useState(state);

    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) setOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
                <Pencil size={16} />
                Editar Perfil
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setOpen(false);
                    }}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Editar Perfil
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form action={action} className="p-6 space-y-4">
                            {/* Nome + Apelido */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="Nome"
                                    name="firstName"
                                    defaultValue={firstName}
                                    required
                                />
                                <Field
                                    label="Apelido"
                                    name="lastName"
                                    defaultValue={lastName}
                                    required
                                />
                            </div>

                            {/* Data de Nascimento */}
                            <Field
                                label="Data de Nascimento"
                                name="data_nascimento"
                                type="date"
                                defaultValue={dataNascimento ?? ""}
                            />

                            {/* Telefone */}
                            <Field
                                label="Telefone"
                                name="telefone"
                                type="tel"
                                defaultValue={telefone ?? ""}
                                placeholder="+351 912 345 678"
                            />

                            {/* Morada */}
                            <Field
                                label="Morada"
                                name="morada"
                                defaultValue={morada ?? ""}
                            />

                            {/* Cidade + Código Postal */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="Cidade"
                                    name="cidade"
                                    defaultValue={cidade ?? ""}
                                />
                                <Field
                                    label="Código Postal"
                                    name="codigo_postal"
                                    defaultValue={codigoPostal ?? ""}
                                    placeholder="1000-001"
                                />
                            </div>

                            {/* País */}
                            <Field
                                label="País"
                                name="pais"
                                defaultValue={pais ?? ""}
                                placeholder="Portugal"
                            />

                            {/* NIF */}
                            <Field
                                label="NIF"
                                name="nif"
                                defaultValue={nif ?? ""}
                                placeholder="123456789"
                            />

                            {/* IBAN — só presidente */}
                            {accountType === "presidente" && (
                                <div>
                                    <Field
                                        label="IBAN"
                                        name="iban"
                                        defaultValue={iban ?? ""}
                                        placeholder="PT50..."
                                        mono
                                    />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Sem espaços — ex:
                                        PT50000201231234567890154
                                    </p>
                                </div>
                            )}

                            {/* Erro */}
                            {state?.error && (
                                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                    {state.error}
                                </p>
                            )}

                            {/* Botões */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isPending ? "A guardar..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function Field({
    label,
    name,
    defaultValue,
    type = "text",
    required,
    placeholder,
    mono,
}: {
    label: string;
    name: string;
    defaultValue?: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    mono?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <input
                name={name}
                type={type}
                defaultValue={defaultValue}
                required={required}
                placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${mono ? "font-mono" : ""}`}
            />
        </div>
    );
}
