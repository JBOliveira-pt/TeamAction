import { adminCreateAvisoAction } from "@/app/lib/admin-actions";
import { fetchAdminUsersForSelect } from "@/app/lib/admin-data";
import { AdminAvisoForm } from "@/app/ui/admin/aviso-form";

export const dynamic = "force-dynamic";

type SearchParams = {
    success?: string;
    error?: string;
};

function getAlertFromParams(searchParams?: SearchParams) {
    if (searchParams?.success === "1") {
        return {
            kind: "success" as const,
            message: "Aviso enviado com sucesso.",
        };
    }

    if (!searchParams?.error) {
        return null;
    }

    if (searchParams.error === "required") {
        return {
            kind: "error" as const,
            message: "Preencha título e descrição antes de enviar.",
        };
    }

    if (searchParams.error === "user") {
        return {
            kind: "error" as const,
            message: "Selecione um usuário para envio individual.",
        };
    }

    if (searchParams.error === "org") {
        return {
            kind: "error" as const,
            message: "O usuário selecionado não possui organização associada.",
        };
    }

    if (searchParams.error === "no_org") {
        return {
            kind: "error" as const,
            message:
                "Não existem organizações disponíveis para enviar aviso global.",
        };
    }

    return {
        kind: "error" as const,
        message: "Ocorreu um erro ao enviar o aviso. Tente novamente.",
    };
}

export default async function AdminAvisosPage({
    searchParams,
}: {
    searchParams?: Promise<SearchParams>;
}) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const alert = getAlertFromParams(resolvedSearchParams);
    const users = await fetchAdminUsersForSelect();

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Emitir Avisos
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    O aviso aparecerá como pop-up para os usuários quando
                    fizerem login.
                </p>
            </header>

            {alert && (
                <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        alert.kind === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-rose-300 bg-rose-50 text-rose-800"
                    }`}
                >
                    {alert.message}
                </div>
            )}

            <AdminAvisoForm users={users} action={adminCreateAvisoAction} />
        </div>
    );
}
