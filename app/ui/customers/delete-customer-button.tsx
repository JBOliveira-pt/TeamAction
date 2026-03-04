"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-gray-700 p-2 hover:bg-red-500/10 hover:border-red-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Deletar cliente"
        >
            <span className="sr-only">Delete</span>
            <TrashIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>
    );
}

export function DeleteCustomerButton({
    id,
    deleteAction,
    invoiceCount,
}: {
    id: string;
    deleteAction: (id: string) => Promise<void>;
    invoiceCount?: number;
}) {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const count = invoiceCount ?? 0;
        const invoiceWarning =
            count === 0
                ? "Nao ha faturas associadas, mas a acao e definitiva."
                : count === 1
                  ? "1 fatura associada tambem sera deletada."
                  : `${count} faturas associadas tambem serao deletadas.`;
        const message = `Tem certeza que deseja deletar este cliente?\n${invoiceWarning}`;

        if (!confirm(message)) {
            return;
        }

        await deleteAction(id);
    };

    return (
        <form onSubmit={handleSubmit}>
            <SubmitButton />
        </form>
    );
}
