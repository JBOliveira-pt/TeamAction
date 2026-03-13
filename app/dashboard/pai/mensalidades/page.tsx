'use client';

import { CheckCircle, Clock, Receipt, XCircle } from 'lucide-react';

const mensalidadesMock: {
    mes: string;
    valor: string;
    estado: 'pago' | 'pendente' | 'atrasado';
    data?: string;
}[] = [
    {
        mes: 'Setembro 2025',
        valor: '40,00 €',
        estado: 'pago',
        data: '02/09/2025',
    },
    {
        mes: 'Outubro 2025',
        valor: '40,00 €',
        estado: 'pago',
        data: '01/10/2025',
    },
    {
        mes: 'Novembro 2025',
        valor: '40,00 €',
        estado: 'pago',
        data: '03/11/2025',
    },
    {
        mes: 'Dezembro 2025',
        valor: '40,00 €',
        estado: 'pago',
        data: '02/12/2025',
    },
    {
        mes: 'Janeiro 2026',
        valor: '40,00 €',
        estado: 'pago',
        data: '04/01/2026',
    },
    {
        mes: 'Fevereiro 2026',
        valor: '40,00 €',
        estado: 'pago',
        data: '02/02/2026',
    },
    { mes: 'Março 2026', valor: '40,00 €', estado: 'pendente' },
];

const estadoConfig = {
    pago: {
        label: 'Pago',
        icon: CheckCircle,
        cls: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    pendente: {
        label: 'Pendente',
        icon: Clock,
        cls: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    atrasado: {
        label: 'Atrasado',
        icon: XCircle,
        cls: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
    },
};

export default function PaiMensalidadesPage() {
    const total = mensalidadesMock.length;
    const pagas = mensalidadesMock.filter((m) => m.estado === 'pago').length;
    const pendentes = mensalidadesMock.filter(
        (m) => m.estado !== 'pago',
    ).length;

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Mensalidades
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Estado de pagamentos da época atual.
                </p>
            </div>

            {/* summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Total</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {total}
                    </span>
                    <span className="text-xs text-gray-400">mensalidades</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Pagas</span>
                    <span className="text-2xl font-bold text-emerald-500">
                        {pagas}
                    </span>
                    <span className="text-xs text-gray-400">em dia</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Pendentes</span>
                    <span
                        className={`text-2xl font-bold ${pendentes > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}
                    >
                        {pendentes}
                    </span>
                    <span className="text-xs text-gray-400">por pagar</span>
                </div>
            </div>

            {/* table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {mensalidadesMock.length === 0 ? (
                    <div className="p-12 flex flex-col items-center gap-3 text-center">
                        <Receipt size={28} className="text-gray-300" />
                        <p className="text-sm text-gray-500">
                            Nenhuma mensalidade registada.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Mês
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Data pagamento
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {mensalidadesMock.map((m, i) => {
                                const cfg = estadoConfig[m.estado];
                                const Icon = cfg.icon;
                                return (
                                    <tr
                                        key={i}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                                            {m.mes}
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-gray-200">
                                            {m.valor}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {m.data ?? '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.cls}`}
                                            >
                                                <Icon size={12} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
