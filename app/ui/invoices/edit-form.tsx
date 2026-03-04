// app/ui/invoices/edit-form.tsx
"use client";

import { CustomerField, InvoiceForm } from "@/app/lib/definitions";
import {
    CheckIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
    CalendarIcon,
    XMarkIcon,
    PencilIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/app/ui/button";
import {
    useActionState,
    useState,
    useEffect,
    useRef,
    useTransition,
} from "react";
import { updateInvoice, State } from "@/app/lib/actions";

// Helper function to format date to YYYY-MM-DD
const formatDateForInput = (date: string | Date | null | undefined): string => {
    if (!date) return "";

    // If it's a Date object, use toISOString
    if (date instanceof Date) {
        return date.toISOString().split("T")[0];
    }

    // If already a string in YYYY-MM-DD format, return as is
    const dateStr = String(date);
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.split("T")[0];
    }

    return "";
};

// Helper function to format amount from cents to currency
const formatAmountForInput = (amount: number | string | undefined): string => {
    if (!amount) return "";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "";
    // Convert from cents to euros
    return (numAmount / 100).toFixed(2);
};

export default function EditInvoiceForm({
    invoice,
    customers,
}: {
    invoice: InvoiceForm;
    customers: CustomerField[];
}) {
    const initialState: State = { message: null, errors: {} };
    const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
    const [state, formAction] = useActionState(
        updateInvoiceWithId,
        initialState,
    );
    const [isPending, startTransition] = useTransition();

    // Format dates for input fields
    const launchDate = formatDateForInput(invoice.date);

    // Estado para controlar o formulário
    const [status, setStatus] = useState<"pending" | "paid">(
        (invoice.status as "pending" | "paid") || "pending",
    );
    const [paymentDateValue, setPaymentDateValue] = useState(
        formatDateForInput(invoice.payment_date),
    );
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [pendingSubmit, setPendingSubmit] = useState(false);

    // Quando a data de pagamento é preenchida, automaticamente muda para "Pago"
    useEffect(() => {
        if (paymentDateValue && status === "pending") {
            setStatus("paid");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentDateValue]);

    // Mostrar mensagem de sucesso após a action retornar
    useEffect(() => {
        if (pendingSubmit && !state.message) {
            setShowSuccessMessage(true);
            setPendingSubmit(false);
        }
    }, [pendingSubmit, state]);

    // Função para lidar com mudança do toggle
    const handleStatusToggle = () => {
        const newStatus = status === "pending" ? "paid" : "pending";

        // Se tentar mudar para "Pago" sem data de pagamento
        if (newStatus === "paid" && !paymentDateValue) {
            alert(
                "Por favor, preencha a data de pagamento antes de marcar como Pago.",
            );
            return;
        }

        setStatus(newStatus);
    };

    // Função para lidar com o submit do formulário
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Se o status for "Pago", mostrar modal de confirmação
        if (status === "paid") {
            e.preventDefault();
            setShowConfirmModal(true);
        } else {
            // Status é "Pendente" - submeter normalmente
            e.preventDefault();
            if (formRef.current) {
                const formData = new FormData(formRef.current);
                startTransition(() => {
                    formAction(formData);
                });
            }
        }
    };

    // Confirmar e enviar o formulário
    const confirmSubmit = () => {
        setShowConfirmModal(false);
        setPendingSubmit(true);
        if (formRef.current) {
            // Criar um FormData e chamar a action
            const formData = new FormData(formRef.current);
            startTransition(() => {
                formAction(formData);
            });
        }
    };

    console.log("Invoice data:", {
        rawDate: invoice.date,
        formattedDate: launchDate,
        rawPaymentDate: invoice.payment_date,
        formattedPaymentDate: paymentDateValue,
        rawAmount: invoice.amount,
        formattedAmount: formatAmountForInput(invoice.amount),
    });

    // Prevent editing paid invoices
    if ((invoice.status as string) === "paid") {
        return (
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 p-6 md:p-8">
                <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <XMarkIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-200">
                            Fatura Paga
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                            Não é possível editar faturas que já foram marcadas
                            como pagas. Se precisar fazer alterações, entre em
                            contato com o administrador.
                        </p>
                    </div>
                </div>
                <div className="mt-6">
                    <Link
                        href="/dashboard/invoices"
                        className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                    >
                        Voltar para Faturas
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} action={formAction}>
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="date" value={launchDate} />
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                {/* Form Header */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <PencilIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Editar Fatura
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                ID: {invoice.id.slice(0, 8)}...
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Name */}
                <div className="mb-6">
                    <label
                        htmlFor="customer"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Cliente
                    </label>
                    <div className="relative">
                        <select
                            id="customer"
                            name="customerId"
                            className="peer block w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-10 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                            defaultValue={invoice.customer_id}
                            aria-describedby="customer-error"
                        >
                            <option value="" disabled className="text-gray-500">
                                Selecione um cliente
                            </option>
                            {customers.map((customer) => (
                                <option
                                    key={customer.id}
                                    value={customer.id}
                                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                        <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                            <svg
                                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div
                        id="customer-error"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.errors?.customerId &&
                            state.errors.customerId.map((error: string) => (
                                <p
                                    className="mt-2 text-sm text-red-400"
                                    key={error}
                                >
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

                {/* Invoice Amount */}
                <div className="mb-6">
                    <label
                        htmlFor="amount"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Valor da Fatura
                    </label>
                    <div className="relative">
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            defaultValue={formatAmountForInput(invoice.amount)}
                            placeholder="Digite o valor em R$"
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            aria-describedby="amount-error"
                        />
                        <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                    </div>
                    <div
                        id="amount-error"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.errors?.amount &&
                            state.errors.amount.map((error: string) => (
                                <p
                                    className="mt-2 text-sm text-red-400"
                                    key={error}
                                >
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

                {/* Invoice Date */}
                <div className="mb-6">
                    <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Data da Fatura
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Data de Lançamento (read-only) */}
                        <div>
                            <label
                                htmlFor="launch-date"
                                className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400"
                            >
                                Lançamento
                            </label>
                            <div className="relative">
                                <input
                                    id="launch-date"
                                    type="date"
                                    value={launchDate}
                                    readOnly
                                    className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 py-3 px-10 text-sm text-gray-600 dark:text-gray-400 outline-none cursor-not-allowed dark:[color-scheme:dark]"
                                />
                                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>

                        {/* Data de Pagamento (editable) */}
                        <div>
                            <label
                                htmlFor="payment-date"
                                className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400"
                            >
                                Pagamento
                            </label>
                            <div className="relative">
                                <input
                                    id="payment-date"
                                    name="paymentDate"
                                    type="date"
                                    value={paymentDateValue}
                                    onChange={(e) =>
                                        setPaymentDateValue(e.target.value)
                                    }
                                    min={launchDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-10 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:[color-scheme:dark]"
                                    aria-describedby="payment-date-error"
                                />
                                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Data de pagamento entre{" "}
                        {launchDate &&
                            new Date(launchDate).toLocaleDateString(
                                "pt-PT",
                            )}{" "}
                        e hoje
                    </p>
                    <div
                        id="payment-date-error"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.errors?.paymentDate &&
                            state.errors.paymentDate.map((error: string) => (
                                <p
                                    className="mt-2 text-sm text-red-400"
                                    key={error}
                                >
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

                {/* Invoice Status - Toggle Switch */}
                <fieldset className="mb-6">
                    <legend className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status da Fatura
                    </legend>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            {status === "pending" ? (
                                <>
                                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                                        <ClockIcon className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            Pendente
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Aguardando pagamento
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <CheckIcon className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            Pago
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Pagamento confirmado
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Toggle Switch */}
                        <button
                            type="button"
                            onClick={handleStatusToggle}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                                status === "paid"
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-gray-600"
                            }`}
                            aria-label="Alterar status da fatura"
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                    status === "paid"
                                        ? "translate-x-7"
                                        : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>

                    <div
                        id="status-error"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.errors?.status &&
                            state.errors.status.map((error: string) => (
                                <p
                                    className="mt-2 text-sm text-red-400"
                                    key={error}
                                >
                                    {error}
                                </p>
                            ))}
                    </div>
                </fieldset>

                {/* Error Message */}
                {state.message && (
                    <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-4">
                        <p className="text-sm text-red-400">{state.message}</p>
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex items-center justify-end gap-4">
                <Link
                    href="/dashboard/invoices"
                    className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                >
                    <XMarkIcon className="h-4 w-4" />
                    Cancelar
                </Link>
                <Button type="submit">
                    <PencilIcon className="h-4 w-4" />
                    Salvar Alterações
                </Button>
            </div>

            {/* Modal de Confirmação */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <CheckIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Confirmar Pagamento
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Tem certeza que deseja marcar esta fatura como paga?
                            Um recibo será gerado automaticamente.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmit}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Sim, Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mensagem de Sucesso */}
            {showSuccessMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <CheckIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Recibo Gerado
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Recibo gerado com sucesso. Verifique na aba
                            "Recibos" o recibo gerado para esta fatura.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Link
                                href="/dashboard/invoices"
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Voltar às Faturas
                            </Link>
                            <Link
                                href="/dashboard/receipts"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Ver Recibos
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
