// app/ui/invoices/buttons.tsx
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { deleteInvoice } from "@/app/lib/actions";
import { isUserAdmin, getCurrentUser } from "@/app/lib/auth-helpers";

export function CreateInvoice() {
    return (
        <Link
            href="/dashboard/invoices/create"
            className="flex h-10 w-35 items-center gap-2 rounded-lg bg-blue-600 
            px-4 text-sm font-medium text-white transition-all 
            hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <PlusIcon className="h-5" />
            <span className="">Criar Fatura</span>
        </Link>
    );
}

export async function UpdateInvoice({
    id,
    createdBy,
    status,
}: {
    id: string;
    createdBy: string | null | undefined;
    status: string;
}) {
    const isAdmin = await isUserAdmin();
    const currentUser = await getCurrentUser();

    // Show button if admin or if user created this invoice
    const canEdit = isAdmin || (currentUser && currentUser.id === createdBy);
    const isPaid = status === "paid";

    if (!canEdit || isPaid) {
        return null;
    }

    return (
        <Link
            href={`/dashboard/invoices/${id}/edit`}
            className="rounded-lg border border-gray-700 p-2 hover:bg-gray-800 hover:border-gray-600 transition-all group"
            title="Editar"
        >
            <PencilIcon className="w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
        </Link>
    );
}

export async function DeleteInvoice({
    id,
    createdBy,
    status,
}: {
    id: string;
    createdBy: string | null | undefined;
    status: string;
}) {
    const isAdmin = await isUserAdmin();
    const currentUser = await getCurrentUser();

    // Show button if admin or if user created this invoice
    const canDelete = isAdmin || (currentUser && currentUser.id === createdBy);
    const isPaid = status === "paid";

    if (!canDelete || isPaid) {
        return null;
    }

    const deleteInvoiceWithId = deleteInvoice.bind(null, id);

    return (
        <form action={deleteInvoiceWithId}>
            <button
                type="submit"
                className="rounded-lg border border-gray-700 p-2 hover:bg-red-500/10 hover:border-red-500/50 transition-all group"
                title="Deletar"
            >
                <span className="sr-only">Delete</span>
                <TrashIcon className="w-5 text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>
        </form>
    );
}
