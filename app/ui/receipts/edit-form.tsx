"use client";

import { useState } from "react";
import { formatCurrencyPTBR, formatDateToLocal } from "@/app/lib/utils";
import { RECEIPT_ACTIVITIES } from "@/app/lib/receipt-activities";

export default function ReceiptEditForm({
    receipt,
    canSend,
}: {
    receipt: {
        receipt_id: string;
        receipt_number: number;
        status: "pending_send" | "sent_to_customer";
        received_date: string;
        amount: number;
        activity_code: string | null;
        tax_regime: string;
        irs_withholding: string;
        pdf_url: string | null;
        invoice_id: string;
        invoice_date: string;
        invoice_payment_date: string | null;
        customer_name: string;
        customer_nif: string | null;
        customer_address: string | null;
        sent_at?: string | null;
        sent_by_user_name?: string | null;
    };
    canSend: boolean;
}) {
    const [isToggling, setIsToggling] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const isSent = receipt.status === "sent_to_customer";

    // Função para formatar data e hora do envio
    const formatSentDateTime = (
        dateString: string | null | undefined,
    ): string => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("pt-PT", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    // Função para obter o nome da atividade baseado no código
    const getActivityLabel = (code: string | null): string => {
        if (!code) return "-";
        const activity = RECEIPT_ACTIVITIES.find((a) => a.code === code);
        return activity ? `${activity.code} - ${activity.label}` : code;
    };

    const handleToggleSent = async () => {
        if (isSent || !canSend) {
            return;
        }

        await markAsSent();
    };

    const markAsSent = async () => {
        setIsToggling(true);
        setMessage(null);

        try {
            const response = await fetch(
                `/api/receipts/${receipt.receipt_id}/mark-sent`,
                {
                    method: "POST",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to mark receipt as sent");
            }

            setMessage({
                type: "success",
                text: "Recibo marcado como enviado ao cliente.",
            });

            // Reload page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            setMessage({
                type: "error",
                text: "Erro ao marcar recibo como enviado.",
            });
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recibo #{receipt.receipt_number}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Valor: {formatCurrencyPTBR(receipt.amount)}
                        </p>
                    </div>
                    {receipt.pdf_url ? (
                        <a
                            href={receipt.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                            Download PDF
                        </a>
                    ) : null}
                </div>

                {/* Error/Success Messages */}
                {message && (
                    <div
                        className={`mb-4 rounded-lg border p-3 text-sm ${
                            message.type === "success"
                                ? "border-green-500/50 bg-green-500/10 text-green-400"
                                : "border-red-500/50 bg-red-500/10 text-red-400"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Dados do Recibo */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                        Dados do Recibo
                    </h3>
                    <div className="grid gap-3 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Cliente
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {receipt.customer_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    NIF/NIPC
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {receipt.customer_nif ?? "-"}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Morada Fiscal
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {receipt.customer_address ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Data de Pagamento
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {receipt.invoice_payment_date
                                        ? formatDateToLocal(
                                              receipt.invoice_payment_date,
                                          )
                                        : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Atividade Exercida
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {getActivityLabel(receipt.activity_code)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Regime de IVA
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {receipt.tax_regime}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Retenção na Fonte (IRS)
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {receipt.irs_withholding}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Fatura ID
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {receipt.invoice_id}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toggle Envio */}
                <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                                Status de Envio
                            </p>
                            <div className="mt-2 space-y-1">
                                {isSent ? (
                                    <>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Enviado por:{" "}
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {receipt.sent_by_user_name ||
                                                    "Utilizador desconhecido"}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Data e hora:{" "}
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {formatSentDateTime(
                                                    receipt.sent_at,
                                                )}
                                            </span>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Recibo ainda não foi enviado ao
                                            cliente
                                        </p>
                                        {!canSend && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Apenas o utilizador que criou
                                                este recibo pode marcar como
                                                enviado.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleToggleSent}
                            disabled={isToggling || isSent || !canSend}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                                isSent
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-gray-600"
                            }`}
                            aria-label="Alterar status de envio"
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                    isSent ? "translate-x-7" : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
