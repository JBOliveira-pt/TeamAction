// app/ui/users/table.tsx
import Image from "next/image";
import { User } from "@/app/lib/definitions";
import { UpdateUser, DeleteUser } from "@/app/ui/users/buttons";
import { ShieldCheckIcon, UserIcon } from "@heroicons/react/24/outline";
import { isUserAdmin } from "@/app/lib/auth-helpers";

export default async function UsersTable({ users }: { users: User[] }) {
    const isAdmin = await isUserAdmin();

    return (
        <div className="w-full">
            <div className="mt-6 flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            {/* Mobile View */}
                            <div className="md:hidden">
                                {users?.map((user) => (
                                    <div
                                        key={user.id}
                                        className="w-full border-b border-gray-200 dark:border-gray-800 p-4 last:border-b-0"
                                    >
                                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={user.image_url}
                                                    alt={`${user.name}'s profile picture`}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700 object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                                    user.role === "admin"
                                                        ? "bg-purple-500/10 text-purple-400"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                }`}
                                            >
                                                {user.role === "admin"
                                                    ? "Admin"
                                                    : "Utilizador"}
                                            </span>
                                        </div>
                                        {isAdmin && (
                                            <div className="pt-4 flex justify-end gap-2">
                                                <UpdateUser id={user.id} />
                                                <DeleteUser id={user.id} />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Empty State Mobile */}
                                {users?.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 px-4">
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                                            <UserIcon className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            Nenhum utilizador encontrado
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Desktop View */}
                            <table className="hidden min-w-full md:table">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Utilizador
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Email
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Função
                                        </th>
                                        {isAdmin && (
                                            <th
                                                scope="col"
                                                className="relative py-4 pl-3 pr-6"
                                            >
                                                <span className="sr-only">
                                                    Ações
                                                </span>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                        >
                                            <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src={user.image_url}
                                                        alt={`${user.name}'s profile picture`}
                                                        width={36}
                                                        height={36}
                                                        className="rounded-full ring-2 ring-gray-300 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-600 transition-all object-cover"
                                                    />
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {user.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {user.email}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                                                        user.role === "admin"
                                                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                                                    }`}
                                                >
                                                    {user.role === "admin" ? (
                                                        <>
                                                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                                                            Admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserIcon className="w-3.5 h-3.5" />
                                                            Utilizador
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="whitespace-nowrap py-4 pl-3 pr-6">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <UpdateUser
                                                            id={user.id}
                                                        />
                                                        <DeleteUser
                                                            id={user.id}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Empty State Desktop */}
                            {users?.length === 0 && (
                                <div className="hidden md:flex flex-col items-center justify-center py-12">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                                        <UserIcon className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Nenhum utilizador encontrado
                                    </p>
                                    <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                                        Adicione um novo utilizador para começar
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
