// Componente geral client.
"use client";

import { atualizarPerfilAtleta } from "@/app/lib/actions";
import {
    CheckCircle,
    Clock,
    FileText,
    Mail,
    Pencil,
    School,
    UserCircle,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type GeralClientProps = {
    email: string | null;
    telefone: string | null;
    morada: string | null;
    cidade: string | null;
    codigoPostal: string | null;
    pais: string | null;
    dataNascimento: string | null;
    dataNascimentoFormatted: string | null;
    mao: string | null;
    equipa: string | null;
    endereco: string | null;
    menor: boolean | null;
    nomeEncarregado: string | null;
    emailEncarregado: string | null;
    aprovado: boolean | null;
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
                {value ?? "-"}
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

export default function GeralClient({
    email,
    telefone,
    morada,
    cidade,
    codigoPostal,
    pais,
    dataNascimento,
    dataNascimentoFormatted,
    mao,
    equipa,
    endereco,
    menor,
    nomeEncarregado,
    emailEncarregado,
    aprovado,
}: GeralClientProps) {
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    const temEncarregado = menor && (nomeEncarregado || emailEncarregado);

    function handleSave(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await atualizarPerfilAtleta(null, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setShowModal(false);
                formRef.current?.reset();
                router.refresh();
            }
        });
    }

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Informações de contato, contratos e dados pessoais em um só
                    lugar.
                </p>
                <div className="flex items-center gap-3 shrink-0">
                    {menor &&
                        aprovado !== null &&
                        (aprovado ? (
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
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Pencil size={14} />
                        Editar perfil
                    </button>
                </div>
            </div>

            {/* Linha superior */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard
                    icon={<UserCircle size={18} />}
                    title="Informações do jogador"
                >
                    <InfoRow
                        label="Data de nascimento"
                        value={dataNascimentoFormatted}
                    />
                    <InfoRow label="Mão dominante" value={mao} />
                    <InfoRow label="Equipa" value={equipa} />
                </SectionCard>

                <SectionCard icon={<Mail size={18} />} title="Contato">
                    <InfoRow label="Email" value={email} />
                    <InfoRow label="Número de telefone" value={telefone} />
                    <InfoRow label="Endereço" value={endereco} />
                </SectionCard>

                <SectionCard
                    icon={<Users size={18} />}
                    title="Encarregado de Educação"
                >
                    {temEncarregado ? (
                        <>
                            <InfoRow label="Nome" value={nomeEncarregado} />
                            <InfoRow label="Email" value={emailEncarregado} />
                        </>
                    ) : (
                        <InfoRow label="" value={null} />
                    )}
                </SectionCard>
            </div>

            {/* Linha inferior */}
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

            {/* Modal Editar */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Editar perfil
                            </h2>
                            {menor && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    As alterações ficam pendentes de aprovação
                                    do encarregado de educação.
                                </p>
                            )}
                        </div>

                        <form
                            ref={formRef}
                            action={handleSave}
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Data de nascimento
                                    </label>
                                    <input
                                        name="data_nascimento"
                                        type="date"
                                        defaultValue={dataNascimento ?? ""}
                                        disabled={!!menor}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {menor && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            A data de nascimento não pode ser
                                            alterada.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Telefone
                                    </label>
                                    <input
                                        name="telefone"
                                        type="tel"
                                        defaultValue={telefone ?? ""}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Mão dominante
                                </label>
                                <select
                                    name="mao_dominante"
                                    defaultValue={mao ?? ""}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">— Não definido —</option>
                                    <option value="direita">Direita</option>
                                    <option value="esquerda">Esquerda</option>
                                    <option value="ambidestro">
                                        Ambidestro
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Morada
                                </label>
                                <input
                                    name="morada"
                                    type="text"
                                    defaultValue={morada ?? ""}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Cidade
                                    </label>
                                    <input
                                        name="cidade"
                                        type="text"
                                        defaultValue={cidade ?? ""}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Código postal
                                    </label>
                                    <input
                                        name="codigo_postal"
                                        type="text"
                                        defaultValue={codigoPostal ?? ""}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        País
                                    </label>
                                    <input
                                        name="pais"
                                        type="text"
                                        defaultValue={pais ?? ""}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {menor && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                            Encarregado de Educação
                                        </p>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                Email do encarregado
                                            </label>
                                            <input
                                                name="encarregado_email"
                                                type="email"
                                                defaultValue={
                                                    emailEncarregado ?? ""
                                                }
                                                placeholder="email@exemplo.com"
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                O encarregado com este email e
                                                conta registada poderá aprovar o
                                                perfil.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {error && (
                                <p className="text-xs text-red-500">{error}</p>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError(null);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                    {isPending
                                        ? "A guardar…"
                                        : "Guardar alterações"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
