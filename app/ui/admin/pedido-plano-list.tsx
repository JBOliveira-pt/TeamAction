"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, XCircle } from "lucide-react";

type PedidoPlano = {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    organization_name: string | null;
    plano_atual: string | null;
    plano_atual_label: string;
    plano_solicitado: string;
    plano_solicitado_label: string;
    status: string;
    created_at: string;
};

function ActionButton({
    decisao,
    pedidoId,
    action,
}: {
    decisao: "aprovado" | "rejeitado";
    pedidoId: string;
    action: (formData: FormData) => Promise<void>;
}) {
    const { pending } = useFormStatus();

    return (
        <form action={action} className="inline">
            <input type="hidden" name="pedidoId" value={pedidoId} />
            <input type="hidden" name="decisao" value={decisao} />
            <button
                type="submit"
                disabled={pending}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    decisao === "aprovado"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
                }`}
            >
                {decisao === "aprovado" ? (
                    <CheckCircle2 size={14} />
                ) : (
                    <XCircle size={14} />
                )}
                {pending
                    ? "A processar..."
                    : decisao === "aprovado"
                      ? "Aprovar"
                      : "Rejeitar"}
            </button>
        </form>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "pendente":
            return (
                <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Pendente
                </span>
            );
        case "aprovado":
            return (
                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Aprovado
                </span>
            );
        case "rejeitado":
            return (
                <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                    Rejeitado
                </span>
            );
        default:
            return (
                <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {status}
                </span>
            );
    }
}

export function AdminPedidoPlanoList({
    pedidos,
    action,
    showActions,
}: {
    pedidos: PedidoPlano[];
    action: (formData: FormData) => Promise<void>;
    showActions: boolean;
}) {
    return (
        <div className="space-y-3">
            {pedidos.map((p) => (
                <article
                    key={p.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {p.user_name}{" "}
                                <span className="text-gray-500 dark:text-gray-400">
                                    ({p.user_email})
                                </span>
                            </p>
                            {p.organization_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Organização: {p.organization_name}
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {p.plano_atual_label}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">
                                    →
                                </span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {p.plano_solicitado_label}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(p.created_at).toLocaleString("pt-PT")}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <StatusBadge status={p.status} />
                            {showActions && p.status === "pendente" && (
                                <div className="flex gap-2">
                                    <ActionButton
                                        decisao="aprovado"
                                        pedidoId={p.id}
                                        action={action}
                                    />
                                    <ActionButton
                                        decisao="rejeitado"
                                        pedidoId={p.id}
                                        action={action}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
