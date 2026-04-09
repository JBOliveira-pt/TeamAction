import { fetchAdminPedidosPerfil } from "@/app/lib/admin-data";
import { adminResolvePedidoPerfilAction } from "@/app/lib/admin-actions";
import { AdminPedidoPerfilList } from "@/app/ui/admin/pedido-perfil-list";

export const dynamic = "force-dynamic";

type SearchParams = {
    success?: string;
    error?: string;
    status?: string;
};

function getAlertFromParams(searchParams?: SearchParams) {
    if (searchParams?.success === "aprovado") {
        return {
            kind: "success" as const,
            message: "Pedido de alteração aprovado e aplicado com sucesso.",
        };
    }

    if (searchParams?.success === "rejeitado") {
        return {
            kind: "success" as const,
            message: "Pedido de alteração rejeitado.",
        };
    }

    if (searchParams?.error === "invalid") {
        return {
            kind: "error" as const,
            message: "Pedido ou decisão inválida.",
        };
    }

    if (searchParams?.error === "not_found") {
        return {
            kind: "error" as const,
            message: "Pedido não encontrado ou já resolvido.",
        };
    }

    if (searchParams?.error === "action") {
        return {
            kind: "error" as const,
            message: "Erro ao processar o pedido. Tente novamente.",
        };
    }

    return null;
}

const CAMPO_LABELS: Record<string, string> = {
    email: "E-mail",
    data_nascimento: "Data de Nascimento",
};

export default async function AdminPedidosPage({
    searchParams,
}: {
    searchParams?: Promise<SearchParams>;
}) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const alert = getAlertFromParams(resolvedSearchParams);
    const statusFilter = resolvedSearchParams?.status || "pendente";
    const pedidos = await fetchAdminPedidosPerfil(statusFilter);

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Pedidos de Alteração de Perfil
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aprovar ou rejeitar alterações de dados pessoais (e-mail,
                    data de nascimento, etc.).
                </p>
            </header>

            {alert && (
                <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        alert.kind === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}
                >
                    {alert.message}
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2">
                {["pendente", "todos", "aprovado", "rejeitado"].map((s) => (
                    <a
                        key={s}
                        href={`/admin/pedidos?status=${s}`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            statusFilter === s
                                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                    >
                        {s === "pendente"
                            ? "Pendentes"
                            : s === "todos"
                              ? "Todos"
                              : s === "aprovado"
                                ? "Aprovados"
                                : "Rejeitados"}
                    </a>
                ))}
            </div>

            {pedidos.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                    Nenhum pedido de alteração encontrado.
                </div>
            ) : (
                <AdminPedidoPerfilList
                    pedidos={pedidos.map((p) => ({
                        ...p,
                        campo_label: CAMPO_LABELS[p.campo] ?? p.campo,
                    }))}
                    action={adminResolvePedidoPerfilAction}
                    showActions={statusFilter === "pendente"}
                />
            )}
        </div>
    );
}
