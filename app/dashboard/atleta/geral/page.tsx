'use client';

import { FileText, Mail, School, UserCircle, Users } from 'lucide-react';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
                {value ?? '-'}
            </span>
        </div>
    );
}

function SectionCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </span>
            </div>
            <div className="flex flex-col gap-4">{children}</div>
        </div>
    );
}

export default function GeralPage() {
    // substituir pelos dados reais do atleta quando tiveres a API
    const jogador = {
        dataNascimento: '3 de mar. de 2026',
        pe: null as string | null,
        idMembroClube: null as string | null,
        idLiga: null as string | null,
    };

    const contato = {
        email: null as string | null,
        telefone: null as string | null,
        endereco: null as string | null,
    };

    const escola = {
        nome: null as string | null,
        endereco: null as string | null,
        parceira: false,
        financiadora: false,
    };

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Informações de contato, contratos e dados pessoais em um só
                lugar.
            </p>

            {/* top row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Informações do jogador */}
                <SectionCard
                    icon={<UserCircle size={18} />}
                    title="Informações do jogador"
                >
                    <InfoRow
                        label="Data de nascimento"
                        value={jogador.dataNascimento}
                    />
                    <InfoRow label="Pé" value={jogador.pe} />
                    <InfoRow
                        label="ID de membro do clube"
                        value={jogador.idMembroClube}
                    />
                    <InfoRow label="ID da liga" value={jogador.idLiga} />
                </SectionCard>

                {/* Contato */}
                <SectionCard icon={<Mail size={18} />} title="Contato">
                    <InfoRow label="Email" value={contato.email} />
                    <InfoRow
                        label="Número de telefone"
                        value={contato.telefone}
                    />
                    <InfoRow label="Endereço" value={contato.endereco} />
                </SectionCard>

                {/* Pai/Responsável */}
                <SectionCard icon={<Users size={18} />} title="Pai/Responsável">
                    <InfoRow label="" value={undefined} />
                </SectionCard>
            </div>

            {/* bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informações escolares */}
                <SectionCard
                    icon={<School size={18} />}
                    title="Informações escolares"
                >
                    <InfoRow label="Nome" value={escola.nome} />
                    <InfoRow label="Endereço" value={escola.endereco} />
                    <InfoRow
                        label="É escola parceira"
                        value={escola.parceira ? 'Sim' : 'Não'}
                    />
                    <InfoRow
                        label="É escola financiadora"
                        value={escola.financiadora ? 'Sim' : 'Não'}
                    />
                </SectionCard>

                {/* Contrato */}
                <SectionCard icon={<FileText size={18} />} title="Contrato">
                    <InfoRow label="" value={undefined} />
                </SectionCard>
            </div>
        </main>
    );
}
