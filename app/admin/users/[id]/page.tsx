// Página de users.
import {
    adminChangeAccountTypeAction,
    adminDeleteUserAction,
    adminUpdateUserAction,
    adminUpdateClubeAction,
    adminEditEquipaAction,
    adminDeleteEquipaAction,
} from "@/app/lib/admin-actions";
import {
    fetchAdminUserById,
    fetchAdminAtletaByUserId,
    fetchAdminStaffByUserId,
    fetchAdminEquipasByOrg,
    fetchAdminClubeByOrgId,
    fetchAdminEquipasByOrgFull,
} from "@/app/lib/admin-data";
import { AdminDeleteUserDangerZone } from "@/app/ui/admin/delete-user-danger-zone";
import { AdminUserProfileView } from "@/app/ui/admin/admin-user-profile-view";
import { AdminAccountTypeChanger } from "@/app/ui/admin/account-type-changer";
import { AdminClubeEditor } from "@/app/ui/admin/admin-clube-editor";
import { AdminEquipasManager } from "@/app/ui/admin/admin-equipas-manager";
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

function getAccountTypeLabel(accountType: AccountType | null) {
    switch (accountType) {
        case "presidente":
            return {
                label: "Presidente",
                className:
                    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
            };
        case "treinador":
            return {
                label: "Treinador",
                className:
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
            };
        case "atleta":
            return {
                label: "Atleta",
                className:
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
            };
        case "responsavel":
            return {
                label: "Responsável",
                className:
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
            };
        default:
            return {
                label: "Utilizador",
                className:
                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
            };
    }
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

    let accountType: AccountType | null = null;

    if (user.clerk_user_id) {
        try {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(user.clerk_user_id);
            accountType = normalizeAccountType(
                clerkUser.unsafeMetadata?.accountType ??
                    clerkUser.publicMetadata?.accountType,
            );
        } catch (error) {
            console.error("Falha ao obter accountType do Clerk:", error);
        }
    }

    const updateAction = adminUpdateUserAction.bind(null, id);
    const deleteAction = adminDeleteUserAction.bind(null, id);
    const badge = getAccountTypeLabel(accountType);

    // Buscar dados específicos do perfil em paralelo
    const [atletaData, staffData, equipas, clubeData, equipasFull] =
        await Promise.all([
            accountType === "atleta"
                ? fetchAdminAtletaByUserId(user.id)
                : Promise.resolve(null),
            accountType === "treinador"
                ? fetchAdminStaffByUserId(user.id)
                : Promise.resolve(null),
            user.organization_id
                ? fetchAdminEquipasByOrg(user.organization_id)
                : Promise.resolve([]),
            accountType === "presidente" && user.organization_id
                ? fetchAdminClubeByOrgId(user.organization_id)
                : Promise.resolve(null),
            accountType === "presidente" && user.organization_id
                ? fetchAdminEquipasByOrgFull(user.organization_id)
                : Promise.resolve([]),
        ]);

    const updateClubeAction = user.organization_id
        ? adminUpdateClubeAction.bind(null, user.organization_id)
        : null;
    const editEquipaAction = adminEditEquipaAction;
    const deleteEquipaAction = adminDeleteEquipaAction;

    const alertMessage = (() => {
        if (resolvedSearchParams?.success === "1") {
            return {
                kind: "success" as const,
                message: "Perfil atualizado com sucesso.",
            };
        }

        if (resolvedSearchParams?.success === "email_pending") {
            return {
                kind: "success" as const,
                message:
                    "Dados atualizados. O novo e-mail foi adicionado ao Clerk — o utilizador precisa verificá-lo para fazer login.",
            };
        }

        if (resolvedSearchParams?.error === "required") {
            return {
                kind: "error" as const,
                message: "Preencha todos os campos obrigatórios.",
            };
        }

        if (resolvedSearchParams?.error === "update") {
            return {
                kind: "error" as const,
                message:
                    "Não foi possível atualizar o perfil. Tente novamente.",
            };
        }

        if (resolvedSearchParams?.error === "delete_confirmation") {
            return {
                kind: "error" as const,
                message:
                    "Confirmação inválida. Digite exatamente deletarconta para excluir.",
            };
        }

        if (resolvedSearchParams?.error === "delete") {
            return {
                kind: "error" as const,
                message: "Falha ao excluir o utilizador. Tente novamente.",
            };
        }

        if (resolvedSearchParams?.success === "type_changed") {
            return {
                kind: "success" as const,
                message: "Tipo de conta alterado com sucesso.",
            };
        }

        if (resolvedSearchParams?.error === "type_change") {
            return {
                kind: "error" as const,
                message: "Falha ao alterar o tipo de conta. Tente novamente.",
            };
        }

        if (resolvedSearchParams?.warning === "clerk") {
            return {
                kind: "warning" as const,
                message:
                    "Utilizador removido da base de dados, mas houve falha ao remover no Clerk.",
            };
        }

        return null;
    })();

    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Perfil do Utilizador
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verificação e alteração de dados cadastrais.
                </p>
            </header>

            {alertMessage && (
                <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        alertMessage.kind === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : alertMessage.kind === "warning"
                              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}
                >
                    {alertMessage.message}
                </div>
            )}

            <AdminUserProfileView
                updateAction={updateAction}
                accountType={accountType}
                accountTypeBadge={badge}
                user={{
                    id: user.id,
                    clerk_user_id: user.clerk_user_id,
                    created_at: user.created_at,
                    name: user.name,
                    email: user.email,
                    image_url: user.image_url,
                    organization_name: user.organization_name,
                    iban: user.iban,
                    data_nascimento: user.data_nascimento,
                    telefone: user.telefone,
                    sobrenome: user.sobrenome,
                    morada: user.morada,
                    peso_kg: user.peso_kg,
                    altura_cm: user.altura_cm,
                    nif: user.nif,
                    codigo_postal: user.codigo_postal,
                    cidade: user.cidade,
                    pais: user.pais,
                }}
                atletaData={atletaData}
                staffData={staffData}
                equipas={equipas}
            />

            <div className="grid gap-4 md:grid-cols-2">
                <AdminAccountTypeChanger
                    userId={id}
                    currentType={accountType}
                    action={adminChangeAccountTypeAction}
                />

                <AdminDeleteUserDangerZone deleteAction={deleteAction} />
            </div>

            {accountType === "presidente" && clubeData && updateClubeAction && (
                <AdminClubeEditor
                    clube={clubeData}
                    updateAction={updateClubeAction}
                />
            )}

            {accountType === "presidente" && equipasFull.length > 0 && (
                <AdminEquipasManager
                    equipas={equipasFull}
                    editAction={editEquipaAction}
                    deleteAction={deleteEquipaAction}
                    redirectUserId={id}
                />
            )}
        </div>
    );
}
