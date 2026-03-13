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

export default function PaiPerfilPage() {
    const jogador = {
        nome: '-',
        posicao: '-',
        equipa: '-',
        dataNascimento: '-',
        pe: null as string | null,
        idMembroClube: null as string | null,
        idLiga: null as string | null,
    };
    const contato = {
        email: null as string | null,
        telefone: null as string | null,
        endereco: null as string | null,
    };

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Perfil do jogador
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Dados pessoais e desportivos do teu filho.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard
                    icon={<UserCircle size={18} />}
                    title="Informações do jogador"
                >
                    <InfoRow
                        label="Data de nascimento"
                        value={jogador.dataNascimento}
                    />
                    <InfoRow label="Posição" value={jogador.posicao} />
                    <InfoRow label="Equipa" value={jogador.equipa} />
                    <InfoRow label="Pé" value={jogador.pe} />
                    <InfoRow
                        label="ID de membro do clube"
                        value={jogador.idMembroClube}
                    />
                    <InfoRow label="ID da liga" value={jogador.idLiga} />
                </SectionCard>

                <SectionCard icon={<Mail size={18} />} title="Contato">
                    <InfoRow label="Email" value={contato.email} />
                    <InfoRow
                        label="Número de telefone"
                        value={contato.telefone}
                    />
                    <InfoRow label="Endereço" value={contato.endereco} />
                </SectionCard>

                <SectionCard icon={<Users size={18} />} title="Pai/Responsável">
                    <InfoRow label="" value={undefined} />
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionCard
                    icon={<School size={18} />}
                    title="Informações escolares"
                >
                    <InfoRow label="Nome" value={null} />
                    <InfoRow label="Endereço" value={null} />
                    <InfoRow label="É escola parceira" value="Não" />
                    <InfoRow label="É escola financiadora" value="Não" />
                </SectionCard>

                <SectionCard icon={<FileText size={18} />} title="Contrato">
                    <InfoRow label="" value={undefined} />
                </SectionCard>
            </div>
        </main>
    );
}
