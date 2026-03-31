import { fetchAtletaDoResponsavel } from '@/app/lib/data';
import {
    CheckCircle,
    Clock,
    FileText,
    Mail,
    School,
    UserCircle,
    Users,
} from 'lucide-react';
import AprovarPerfilButton from './_components/AprovarPerfilButton.client';

export const dynamic = 'force-dynamic';

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

export default async function PaiPerfilPage() {
    const dados = await fetchAtletaDoResponsavel();

    const nome = dados?.atleta?.nome ?? dados?.minorUser?.name ?? null;
    const posicao = dados?.atleta?.posicao ?? null;
    const equipa = dados?.atleta?.equipa_nome ?? null;
    const mao = dados?.atleta?.mao_dominante ?? null;
    const dataNascimento = dados?.minorUser?.data_nascimento ?? null;
    const email = dados?.minorUser?.email ?? null;
    const telefone = dados?.minorUser?.telefone ?? null;

    const addrParts = [
        dados?.minorUser?.morada,
        dados?.minorUser?.codigo_postal,
        dados?.minorUser?.cidade,
        dados?.minorUser?.pais,
    ].filter(Boolean);
    const endereco = addrParts.length > 0 ? addrParts.join(', ') : null;

    const nomeEncarregado = dados?.guardian?.name ?? null;
    const emailEncarregado = dados?.guardian?.email ?? null;
    const minorUserId = dados?.minorUser?.id ?? null;
    const status = dados?.minorUser?.status ?? null;

    let dataNascimentoFormatted: string | null = null;
    if (dataNascimento) {
        try {
            dataNascimentoFormatted = new Date(
                dataNascimento,
            ).toLocaleDateString('pt-PT');
        } catch {
            dataNascimentoFormatted = String(dataNascimento);
        }
    }

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Perfil do jogador
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Dados pessoais e desportivos do teu filho.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    {status !== null &&
                        (status ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <CheckCircle size={13} />
                                Aprovado
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <Clock size={13} />
                                Pendente de aprovação
                            </span>
                        ))}
                    {status === false && minorUserId && (
                        <AprovarPerfilButton minorUserId={minorUserId} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard
                    icon={<UserCircle size={18} />}
                    title="Informações do jogador"
                >
                    <InfoRow label="Nome" value={nome} />
                    <InfoRow
                        label="Data de nascimento"
                        value={dataNascimentoFormatted}
                    />
                    <InfoRow label="Posição" value={posicao} />
                    <InfoRow label="Equipa" value={equipa} />
                    <InfoRow label="Mão dominante" value={mao} />
                </SectionCard>

                <SectionCard icon={<Mail size={18} />} title="Contacto">
                    <InfoRow label="Email" value={email} />
                    <InfoRow label="Número de telefone" value={telefone} />
                    <InfoRow label="Endereço" value={endereco} />
                </SectionCard>

                <SectionCard
                    icon={<Users size={18} />}
                    title="Encarregado de Educação"
                >
                    <InfoRow label="Nome" value={nomeEncarregado} />
                    <InfoRow label="Email" value={emailEncarregado} />
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
