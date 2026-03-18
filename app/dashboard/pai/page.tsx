'use client';

import { Activity, Calendar, ChevronRight, Heart, Receipt } from 'lucide-react';
import Link from 'next/link';

function StatCard({
    title,
    value,
    sub,
    valueColor,
    href,
}: {
    title: string;
    value: string;
    sub?: string;
    valueColor?: string;
    href?: string;
}) {
    const inner = (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {title}
                </span>
                {href && <ChevronRight size={16} className="text-gray-400" />}
            </div>
            <span
                className={`text-2xl font-bold ${valueColor ?? 'text-gray-900 dark:text-white'}`}
            >
                {value}
            </span>
            {sub && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {sub}
                </span>
            )}
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function QuickLink({
    icon,
    label,
    href,
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
            <span className="text-blue-500">{icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {label}
            </span>
            <ChevronRight size={16} className="text-gray-400 ml-auto" />
        </Link>
    );
}

export default function PaiDashboard() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Painel do filho
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Visão geral da época atual
                </p>
            </div>

            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Status médico"
                    value="Disponível"
                    valueColor="text-emerald-500"
                    href="/dashboard/pai/medico"
                />
                <StatCard
                    title="Participação"
                    value="—"
                    sub="em 1 sessões nesta temporada"
                />
                <StatCard
                    title="Próximo treino"
                    value="—"
                    sub="Sem treinos agendados"
                />
                <StatCard
                    title="Mensalidades"
                    value="Em dia"
                    valueColor="text-emerald-500"
                    href="/dashboard/pai/mensalidades"
                />
            </div>

            {/* quick links */}
            <div>
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Acesso rápido
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <QuickLink
                        icon={<Heart size={20} />}
                        label="Médico"
                        href="/dashboard/pai/medico"
                    />
                    <QuickLink
                        icon={<Activity size={20} />}
                        label="Condição Física"
                        href="/dashboard/pai/condicao-fisica"
                    />
                    <QuickLink
                        icon={<Calendar size={20} />}
                        label="Calendário"
                        href="/dashboard/pai/calendario"
                    />
                    <QuickLink
                        icon={<Receipt size={20} />}
                        label="Mensalidades"
                        href="/dashboard/pai/mensalidades"
                    />
                </div>
            </div>
        </main>
    );
}
