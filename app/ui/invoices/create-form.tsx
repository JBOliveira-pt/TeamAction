// app/ui/invoices/create-form.tsx
"use client";

import { CustomerField } from "@/app/lib/definitions";
import Link from "next/link";
import {
    CheckIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/button";
import { createInvoice, State } from "@/app/lib/actions";
import { useActionState, useState } from "react";
import { formatCurrency } from "@/app/lib/utils";
import { RECEIPT_ACTIVITIES } from "@/app/lib/receipt-activities";

export default function Form({ customers }: { customers: CustomerField[] }) {
    const initialState: State = { message: null, errors: {} };
    const [state, formAction] = useActionState(createInvoice, initialState);
    const [amount, setAmount] = useState("");
    const today = new Date().toISOString().split("T")[0];

    const formatCurrencyInput = (value: string) => {
        if (!value) return "";
        return formatCurrency(value, "pt-BR", "EUR", false);
    };

    return (
        <form action={formAction}>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                {/* Form Header */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Detalhes da Fatura
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Preencha as informações para criar uma nova fatura
                    </p>
                </div>

                {/* Customer Name */}
                <div className="mb-6">
                    <label
                        htmlFor="customer"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Selecionar Cliente
                    </label>
                    <div className="relative">
                        <select
                            id="customer"
                            name="customerId"
                            className="peer block w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-8 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                            defaultValue=""
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
                        {/* Custom dropdown arrow */}
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
                            placeholder="Digite o valor em euros (ex: 850,00)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            required
                            aria-describedby="amount-error"
                        />
                        <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                    </div>
                    {amount && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                            Valor: {formatCurrencyInput(amount)}
                        </p>
                    )}
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
                    <label
                        htmlFor="date"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Data da Fatura
                    </label>
                    <div className="relative">
                        <input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={today}
                            max={today}
                            className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-10 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:[color-scheme:dark]"
                            required
                        />
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div id="date-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.date &&
                            state.errors.date.map((error: string) => (
                                <p
                                    className="mt-2 text-sm text-red-400"
                                    key={error}
                                >
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

                {/* Hidden status field - always "pending" */}
                <input type="hidden" name="status" value="pending" />

                {/* Activity Code */}
                <div className="mb-6">
                    <label
                        htmlFor="activityCode"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Atividade Exercida
                    </label>
                    <div className="relative">
                        <select
                            id="activityCode"
                            name="activityCode"
                            className="peer block w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-8 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                            defaultValue=""
                            aria-describedby="activity-error"
                            required
                        >
                            <option value="" disabled className="text-gray-500">
                                Selecione uma atividade
                            </option>
                            {RECEIPT_ACTIVITIES.map((activity) => (
                                <option
                                    key={activity.code}
                                    value={activity.code}
                                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {activity.code} - {activity.label}
                                </option>
                            ))}
                        </select>
                        {/* Custom dropdown arrow */}
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
                        id="activity-error"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.errors?.activityCode &&
                            state.errors.activityCode.map((error: string) => (
                                <p
                                    className="mt-2 text-sm text-red-400"
                                    key={error}
                                >
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

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
                    className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                >
                    Cancelar
                </Link>
                <Button type="submit">Criar Fatura</Button>
            </div>
        </form>
    );
}
