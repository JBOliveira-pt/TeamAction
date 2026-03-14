import { adminUpdateUserAction } from "@/app/lib/admin-actions";
import { fetchAdminUserById } from "@/app/lib/admin-data";
import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

function normalizeAccountType(value: unknown): AccountType | null {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (
        normalized === "presidente" ||
        normalized === "treinador" ||
        normalized === "atleta" ||
        normalized === "responsavel"
    ) {
        return normalized;
    }

    return null;
}

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await fetchAdminUserById(id);

    if (!user) {
        notFound();
    }

    let accountType: AccountType =
        user.role === "admin" ? "presidente" : "responsavel";

    if (user.clerk_user_id) {
        try {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(user.clerk_user_id);
            const fromMetadata = normalizeAccountType(
                clerkUser.unsafeMetadata?.accountType ??
                    clerkUser.publicMetadata?.accountType,
            );

            if (fromMetadata) {
                accountType = fromMetadata;
            }
        } catch (error) {
            console.error("Falha ao obter accountType do Clerk:", error);
        }
    }

    const updateAction = adminUpdateUserAction.bind(null, id);

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Perfil do Utilizador
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verificação e alteração de dados cadastrais.
                </p>
            </header>

            <section className="max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">ID</p>
                        <p className="break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                            {user.id}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">
                            Organização
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                            {user.organization_name || "-"}
                        </p>
                    </div>
                </div>

                <form action={updateAction} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                            Nome
                        </label>
                        <input
                            name="name"
                            defaultValue={user.name}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            defaultValue={user.email}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                            Função
                        </label>
                        <select
                            name="accountType"
                            defaultValue={accountType}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                        >
                            <option value="presidente">Presidente</option>
                            <option value="treinador">Treinador</option>
                            <option value="atleta">Atleta</option>
                            <option value="responsavel">Pai/Enc.</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            O papel de acesso no sistema e inferido
                            automaticamente: Presidente = Admin; restantes =
                            Utilizador.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                        Guardar alterações
                    </button>
                </form>
            </section>
        </div>
    );
}
