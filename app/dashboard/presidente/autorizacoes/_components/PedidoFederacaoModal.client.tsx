// Componente cliente de autorizacoes (presidente).
"use client";

import { useState, useTransition } from "react";
import { X, Check, XCircle, RotateCcw, Trash2, Pencil } from "lucide-react";
import {
    resolverPedidoFederacao,
    editarPedidoFederacao,
    eliminarPedidoFederacao,
} from "@/app/lib/actions";

type Pedido = {
    id: string;
    solicitante_nome: string | null;
    solicitante_tipo: string | null;
    tipo_acao: string;
    notas: string | null;
    status: string;
    created_at: string;
    resolved_at: string | null;
};

const statusStyle: Record<string, string> = {
    pendente: "bg-amber-500/10 text-amber-400",
    aprovado: "bg-emerald-500/10 text-emerald-400",
    recusado: "bg-red-500/10 text-red-400",
};

const statusLabel: Record<string, string> = {
    pendente: "Pendente",
    aprovado: "Aprovado",
    recusado: "Recusado",
};

const tipoContaLabel: Record<string, string> = {
    treinador: "Treinador",
    atleta: "Atleta",
    responsavel: "Responsável",
    presidente: "Presidente",
};

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

export default function PedidoFederacaoModal({ pedido }: { pedido: Pedido }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    function handleResolver(decisao: "aprovado" | "recusado") {
        setError(null);
        startTransition(async () => {
            const result = await resolverPedidoFederacao(pedido.id, decisao);
            if (result?.success) {
                setOpen(false);
            } else {
                setError(result?.error ?? "Erro desconhecido.");
            }
        });
    }

    function handleEditar(novaDecisao: "aprovado" | "recusado" | "pendente") {
        setError(null);
        startTransition(async () => {
            const result = await editarPedidoFederacao(pedido.id, novaDecisao);
            if (result?.success) {
                setOpen(false);
            } else {
                setError(result?.error ?? "Erro desconhecido.");
            }
        });
    }

    function handleEliminar() {
        setError(null);
        startTransition(async () => {
            const result = await eliminarPedidoFederacao(pedido.id);
            if (result?.success) {
                setOpen(false);
                setConfirmDelete(false);
            } else {
                setError(result?.error ?? "Erro desconhecido.");
            }
        });
    }

    return (
        <>
            <button
                onClick={() => {
                    setOpen(true);
                    setError(null);
                }}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
                Ver →
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
                        {/* Cabeçalho */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[pedido.status] ?? "bg-gray-500/10 text-gray-400"}`}
                                >
                                    {statusLabel[pedido.status] ??
                                        pedido.status}
                                </span>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Pedido em {formatData(pedido.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Solicitante */}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Solicitante
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {pedido.solicitante_nome ??
                                    "Utilizador removido"}
                            </p>
                        </div>

                        {/* Função */}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Função
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {tipoContaLabel[
                                    pedido.solicitante_tipo ?? ""
                                ] ?? "—"}
                            </p>
                        </div>

                        {/* Notas */}
                        {pedido.notas && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    Notas
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                                    {pedido.notas}
                                </div>
                            </div>
                        )}

                        {/* Info da resolução */}
                        {pedido.status !== "pendente" && pedido.resolved_at && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    Resolvido em
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {formatData(pedido.resolved_at)}
                                </p>
                            </div>
                        )}

                        {/* Erro */}
                        {error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Ações */}
                        {pedido.status === "pendente" ? (
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => handleResolver("recusado")}
                                    disabled={isPending}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <XCircle size={16} />
                                    Recusar
                                </button>
                                <button
                                    onClick={() => handleResolver("aprovado")}
                                    disabled={isPending}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check size={16} />
                                    Aprovar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2">
                                {/* Editar decisão */}
                                <div className="flex items-center gap-2">
                                    <Pencil
                                        size={14}
                                        className="text-gray-400 shrink-0"
                                    />
                                    <span className="text-xs text-gray-400">
                                        Alterar decisão:
                                    </span>
                                    {pedido.status === "aprovado" ? (
                                        <button
                                            onClick={() =>
                                                handleEditar("recusado")
                                            }
                                            disabled={isPending}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XCircle size={14} />
                                            Recusar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                handleEditar("aprovado")
                                            }
                                            disabled={isPending}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Check size={14} />
                                            Aprovar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEditar("pendente")}
                                        disabled={isPending}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RotateCcw size={14} />
                                        Reverter
                                    </button>
                                </div>

                                {/* Separador */}
                                <div className="border-t border-gray-200 dark:border-gray-800" />

                                {/* Eliminar */}
                                <div className="flex items-center justify-between">
                                    {!confirmDelete ? (
                                        <button
                                            onClick={() =>
                                                setConfirmDelete(true)
                                            }
                                            disabled={isPending}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={14} />
                                            Eliminar registo
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-400">
                                                Confirmar eliminação?
                                            </span>
                                            <button
                                                onClick={handleEliminar}
                                                disabled={isPending}
                                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Sim, eliminar
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setConfirmDelete(false)
                                                }
                                                disabled={isPending}
                                                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setOpen(false);
                                            setConfirmDelete(false);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
