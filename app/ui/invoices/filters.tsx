"use client";

import { InvoiceFilters } from "@/app/lib/data";
import DatePickerCalendar from "@/app/ui/components/date-picker-calendar";

export default function InvoiceFiltersForm({
    customers,
    invoiceDates,
    paymentDates,
    filters,
}: {
    customers: { id: string; name: string }[];
    invoiceDates: string[];
    paymentDates: string[];
    filters: InvoiceFilters;
}) {
    const handleDateFromChange = (date: string) => {
        const form = document.querySelector(
            'form[data-filter-form="invoices"]',
        ) as HTMLFormElement;
        const dateFromInput = form?.querySelector(
            'input[name="dateFrom"]',
        ) as HTMLInputElement;
        if (dateFromInput) {
            dateFromInput.value = date;
        }
    };

    const handleDateToChange = (date: string) => {
        const form = document.querySelector(
            'form[data-filter-form="invoices"]',
        ) as HTMLFormElement;
        const dateToInput = form?.querySelector(
            'input[name="dateTo"]',
        ) as HTMLInputElement;
        if (dateToInput) {
            dateToInput.value = date;
        }
    };

    return (
        <form
            className="grid gap-4 md:grid-cols-6"
            method="get"
            data-filter-form="invoices"
        >
            <input type="hidden" name="query" value={filters.query || ""} />
            <input
                type="hidden"
                name="dateFrom"
                value={filters.dateFrom || ""}
            />
            <input type="hidden" name="dateTo" value={filters.dateTo || ""} />

            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Cliente
                </label>
                <select
                    name="customer"
                    defaultValue={filters.customerId || ""}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                    <option value="">Todos</option>
                    {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                            {customer.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Datas das Faturas
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <DatePickerCalendar
                        availableDates={invoiceDates}
                        selectedDate={filters.dateFrom}
                        onChange={handleDateFromChange}
                        placeholder="Lançamento"
                    />
                    <DatePickerCalendar
                        availableDates={paymentDates}
                        selectedDate={filters.dateTo}
                        onChange={handleDateToChange}
                        placeholder="Pagamento"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Estado
                </label>
                <select
                    name="status"
                    defaultValue={filters.status || ""}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                    <option value="">Todos</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                </select>
            </div>

            <div className="md:col-span-6 flex items-center gap-2">
                <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                    Filtrar
                </button>
                <a
                    href="/dashboard/invoices"
                    className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    Limpar
                </a>
            </div>
        </form>
    );
}
