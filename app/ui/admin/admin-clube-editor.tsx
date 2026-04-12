// Componente admin clube editor.
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, X, Check } from "lucide-react";

type ClubeData = {
    id: string;
    organization_id: string;
    nome: string;
    modalidade: string | null;
    nipc: string | null;
    website: string | null;
    telefone: string | null;
    morada: string | null;
    codigo_postal: string | null;
    cidade: string | null;
    pais: string | null;
};

type Props = {
    clube: ClubeData;
    updateAction: (formData: FormData) => Promise<void>;
};

const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";
const labelCls =
    "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
            <Check size={14} />
            {pending ? "A guardar..." : "Guardar"}
        </button>
    );
}

export function AdminClubeEditor({ clube, updateAction }: Props) {
    const [editing, setEditing] = useState(false);

    if (!editing) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        🏛️ Dados do Clube
                    </h3>
                    <button
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        <Pencil size={12} />
                        Editar
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <DisplayField label="Nome" value={clube.nome} />
                    <DisplayField label="Modalidade" value={clube.modalidade} />
                    <DisplayField label="NIPC" value={clube.nipc} />
                    <DisplayField label="Telefone" value={clube.telefone} />
                    <DisplayField label="Website" value={clube.website} />
                    <DisplayField label="Cidade" value={clube.cidade} />
                    <DisplayField
                        label="Código Postal"
                        value={clube.codigo_postal}
                    />
                    <DisplayField label="País" value={clube.pais} />
                    <DisplayField label="Morada" value={clube.morada} span2 />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-blue-200 bg-white p-5 dark:border-blue-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    🏛️ Editar Clube
                </h3>
                <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    <X size={12} />
                    Cancelar
                </button>
            </div>
            <form action={updateAction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>
                            Nome <span className="text-red-400">*</span>
                        </label>
                        <input
                            name="nome"
                            type="text"
                            defaultValue={clube.nome}
                            required
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Modalidade</label>
                        <input
                            name="modalidade"
                            type="text"
                            defaultValue={clube.modalidade ?? ""}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>NIPC</label>
                        <input
                            name="nipc"
                            type="text"
                            maxLength={9}
                            defaultValue={clube.nipc ?? ""}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Telefone</label>
                        <input
                            name="telefone"
                            type="tel"
                            defaultValue={clube.telefone ?? ""}
                            className={inputCls}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Website</label>
                        <input
                            name="website"
                            type="url"
                            defaultValue={clube.website ?? ""}
                            className={inputCls}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Morada</label>
                        <input
                            name="morada"
                            type="text"
                            defaultValue={clube.morada ?? ""}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Código Postal</label>
                        <input
                            name="codigo_postal"
                            type="text"
                            defaultValue={clube.codigo_postal ?? ""}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Cidade</label>
                        <input
                            name="cidade"
                            type="text"
                            defaultValue={clube.cidade ?? ""}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>País</label>
                        <input
                            name="pais"
                            type="text"
                            defaultValue={clube.pais ?? ""}
                            className={inputCls}
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}

function DisplayField({
    label,
    value,
    span2,
}: {
    label: string;
    value?: string | null;
    span2?: boolean;
}) {
    return (
        <div className={span2 ? "sm:col-span-2" : ""}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>
            {value ? (
                <p className="text-sm text-gray-900 dark:text-gray-100">
                    {value}
                </p>
            ) : (
                <p className="text-sm italic text-gray-400 dark:text-gray-500">
                    —
                </p>
            )}
        </div>
    );
}
