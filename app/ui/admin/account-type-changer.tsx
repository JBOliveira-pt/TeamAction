// Componente account type changer.
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel" | null;

const ACCOUNT_TYPE_OPTIONS = [
    { value: "presidente", label: "Presidente" },
    { value: "treinador", label: "Treinador" },
    { value: "atleta", label: "Atleta" },
    { value: "responsavel", label: "Responsável" },
] as const;

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
            {pending ? "A alterar..." : "Alterar tipo de conta"}
        </button>
    );
}

export function AdminAccountTypeChanger({
    userId,
    currentType,
    action,
}: {
    userId: string;
    currentType: AccountType;
    action: (formData: FormData) => Promise<void>;
}) {
    const [selected, setSelected] = useState(currentType || "");
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (!showConfirm) {
            e.preventDefault();
            if (selected && selected !== currentType) {
                setShowConfirm(true);
            }
        }
    };

    return (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-800/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2">
                <RefreshCw
                    size={16}
                    className="text-amber-600 dark:text-amber-400"
                />
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Alterar Tipo de Conta
                </h3>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
                Atenção: alterar o tipo de conta afeta o acesso e
                funcionalidades do utilizador. Esta ação atualiza o Clerk e a
                base de dados.
            </p>

            <form action={action} onSubmit={handleSubmit}>
                <input type="hidden" name="userId" value={userId} />
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs text-amber-700 dark:text-amber-300">
                            Novo tipo de conta
                        </label>
                        <select
                            name="accountType"
                            value={selected}
                            onChange={(e) => {
                                setSelected(e.target.value);
                                setShowConfirm(false);
                            }}
                            className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-amber-700 dark:bg-gray-950 dark:text-gray-100"
                        >
                            <option value="">-- Selecionar --</option>
                            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                    {opt.value === currentType
                                        ? " (atual)"
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {showConfirm ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-700 dark:text-amber-300">
                                Confirmar?
                            </span>
                            <SubmitButton />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={!selected || selected === currentType}
                            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
                        >
                            Alterar
                        </button>
                    )}
                </div>
            </form>
        </section>
    );
}
