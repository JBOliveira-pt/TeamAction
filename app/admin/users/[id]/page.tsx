import {
    adminDeleteUserAction,
    adminUpdateUserAction,
} from "@/app/lib/admin-actions";
import { fetchAdminUserById } from "@/app/lib/admin-data";
import { AdminDeleteUserDangerZone } from "../../../ui/admin/delete-user-danger-zone";
import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

type SearchParams = {
    success?: string;
    error?: string;
    warning?: string;
};

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
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<SearchParams>;
}) {
    const { id } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const user = await fetchAdminUserById(id);

    if (!user) {
        notFound();
    }

    let accountType: AccountType = "responsavel";

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
    const deleteAction = adminDeleteUserAction.bind(null, id);

    const alertMessage = (() => {
        if (resolvedSearchParams?.success === "1") {
            return {
                kind: "success" as const,
                message: "Perfil atualizado com sucesso.",
            };
        }

        if (resolvedSearchParams?.error === "required") {
            return {
                kind: "error" as const,
                message: "Preencha todos os campos obrigatorios.",
            };
        }

        if (resolvedSearchParams?.error === "update") {
            return {
                kind: "error" as const,
                message:
                    "Nao foi possivel atualizar o perfil. Tente novamente.",
            };
        }

        if (resolvedSearchParams?.error === "delete_confirmation") {
            return {
                kind: "error" as const,
                message:
                    "Confirmacao invalida. Digite exatamente deletarconta para excluir.",
            };
        }

        if (resolvedSearchParams?.error === "delete") {
            return {
                kind: "error" as const,
                message: "Falha ao excluir o usuário. Tente novamente.",
            };
        }

        if (resolvedSearchParams?.warning === "clerk") {
            return {
                kind: "warning" as const,
                message:
                    "Usuário removido da base de dados, mas houve falha ao remover no Clerk.",
            };
        }

        return null;
    })();

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Perfil do Usuário
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verificação e alteração de dados cadastrais.
                </p>
            </header>

            {alertMessage && (
                <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        alertMessage.kind === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : alertMessage.kind === "warning"
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-rose-300 bg-rose-50 text-rose-800"
                    }`}
                >
                    {alertMessage.message}
                </div>
            )}

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
                            O papel de acesso e inferido automaticamente como
                            Usuário para qualquer funcao.
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

            <AdminDeleteUserDangerZone deleteAction={deleteAction} />
        </div>
    );
}
