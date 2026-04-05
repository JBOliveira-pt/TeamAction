"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

type PedidoPerfil = {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    organization_name: string | null;
    campo: string;
    campo_label: string;
    valor_atual: string | null;
    valor_novo: string;
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

function formatValue(campo: string, value: string | null): string {
    if (!value) return "—";
    if (campo === "data_nascimento") {
        try {
            return new Date(value).toLocaleDateString("pt-PT");
        } catch {
            return value;
        }
    }
    return value;
}

export function AdminPedidoPerfilList({
    pedidos,
    action,
    showActions,
}: {
    pedidos: PedidoPerfil[];
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
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Campo: {p.campo_label}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    {formatValue(p.campo, p.valor_atual)}
                                </span>
                                <ArrowRight
                                    size={14}
                                    className="text-gray-400"
                                />
                                <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {formatValue(p.campo, p.valor_novo)}
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
