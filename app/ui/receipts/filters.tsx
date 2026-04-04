"use client";

import Link from "next/link";
import { ReciboFilters } from "@/app/lib/receipts-data";

export default function ReciboFiltersForm({
    atletas,
    filters,
}: {
    atletas: { id: string; nome: string }[];
    filters: ReciboFilters;
}) {
    return (
        <form
            className="grid gap-4 md:grid-cols-4"
            method="get"
            data-filter-form="recibos"
        >
            <input type="hidden" name="query" value={filters.query || ""} />

            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Atleta
                </label>
                <select
                    name="atleta"
                    defaultValue={filters.atletaId || ""}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                    <option value="">Todos</option>
                    {atletas.map((atleta) => (
                        <option key={atleta.id} value={atleta.id}>
                            {atleta.nome}
                        </option>
                    ))}
                </select>
            </div>

            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Estado
                </label>
                <select
                    name="status"
                    defaultValue={filters.status || ""}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                    <option value="">Todos</option>
                    <option value="pendente_envio">Pendente de envio</option>
                    <option value="enviado_atleta">Enviado ao atleta</option>
                </select>
            </div>

            <div className="md:col-span-2 flex items-end gap-2">
                <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                    Filtrar
                </button>
                <Link
                    href="/dashboard/presidente/recibos"
                    className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    Limpar
                </Link>
            </div>
        </form>
    );
}
