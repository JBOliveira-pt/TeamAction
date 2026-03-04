// app/ui/users/buttons.tsx
import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { deleteUser } from "@/app/lib/actions";
import { DeleteUserButton } from "./delete-user-button";
import { isUserAdmin } from "@/app/lib/auth-helpers";

export async function AddUserButton() {
    const isAdmin = await isUserAdmin();

    if (!isAdmin) {
        return null;
    }

    return (
        <Link
            href="/dashboard/users/create"
            className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden md:block">Adicionar Utilizador</span>
        </Link>
    );
}

export async function UpdateUser({ id }: { id: string }) {
    const isAdmin = await isUserAdmin();

    if (!isAdmin) {
        return null;
    }

    return (
        <Link
            href={`/dashboard/users/${id}/edit`}
            className="rounded-lg border border-gray-700 p-2 hover:bg-gray-800 hover:border-gray-600 transition-all group"
            title="Editar utilizador"
        >
            <PencilIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
        </Link>
    );
}

export async function DeleteUser({ id }: { id: string }) {
    const isAdmin = await isUserAdmin();

    if (!isAdmin) {
        return null;
    }

    // Check if the user being deleted is an admin
    const sql = (await import("postgres")).default(process.env.POSTGRES_URL!, {
        ssl: "require",
    });
    const targetUser = await sql`SELECT role FROM users WHERE id = ${id}`;
    const isTargetAdmin = targetUser[0]?.role === "admin";

    return (
        <DeleteUserButton
            id={id}
            deleteAction={deleteUser}
            isAdmin={isTargetAdmin}
        />
    );
}
