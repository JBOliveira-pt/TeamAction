import { fetchAdminPedidosPlano } from "@/app/lib/admin-data";
import { adminResolvePedidoPlanoAction } from "@/app/lib/admin-actions";
import { AdminPedidoPlanoList } from "@/app/ui/admin/pedido-plano-list";

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
            message:
                "Pedido de plano aprovado com sucesso. O plano já está ativo.",
        };
    }

    if (searchParams?.success === "rejeitado") {
        return {
            kind: "success" as const,
            message: "Pedido de plano rejeitado.",
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

const PLANO_LABELS: Record<string, string> = {
    rookie: "Rookie (Free)",
    team: "Team",
    club_pro: "Club Pro",
    legend: "Legend",
};

export default async function AdminPlanosPage({
    searchParams,
}: {
    searchParams?: Promise<SearchParams>;
}) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const alert = getAlertFromParams(resolvedSearchParams);
    const statusFilter = resolvedSearchParams?.status || "pendente";
    const pedidos = await fetchAdminPedidosPlano(statusFilter);

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Pedidos de Plano
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aprovar ou rejeitar pedidos de alteração de plano dos
                    utilizadores.
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
                        href={`/admin/planos?status=${s}`}
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
                    Nenhum pedido de plano encontrado.
                </div>
            ) : (
                <AdminPedidoPlanoList
                    pedidos={pedidos.map((p) => ({
                        ...p,
                        plano_atual_label:
                            PLANO_LABELS[p.plano_atual ?? "rookie"] ??
                            p.plano_atual ??
                            "Rookie",
                        plano_solicitado_label:
                            PLANO_LABELS[p.plano_solicitado] ??
                            p.plano_solicitado,
                    }))}
                    action={adminResolvePedidoPlanoAction}
                    showActions={statusFilter === "pendente"}
                />
            )}
        </div>
    );
}
