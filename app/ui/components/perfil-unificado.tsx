import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { fetchMeuPerfil } from "@/app/lib/data";
import EditarPerfilUnificadoModal from "@/app/ui/components/editar-perfil-modal";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    Building2,
    FileText,
} from "lucide-react";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    presidente: "Presidente",
    treinador: "Treinador",
    atleta: "Atleta",
    responsavel: "Responsável",
};

export default async function PerfilUnificadoPage() {
    const clerkUser = await currentUser();
    if (!clerkUser) redirect("/login");

    const perfil = await fetchMeuPerfil();
    if (!perfil) redirect("/login");

    const nome =
        clerkUser.fullName ??
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
    const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? perfil.email ?? "—";
    const avatar = clerkUser.imageUrl;
    const firstName = clerkUser.firstName ?? "";
    const lastName = clerkUser.lastName ?? "";
    const accountLabel =
        ACCOUNT_TYPE_LABELS[perfil.account_type ?? ""] ?? "Utilizador";

    const nascimentoFormatted = perfil.data_nascimento
        ? new Date(perfil.data_nascimento).toLocaleDateString("pt-PT")
        : null;
    const membroDesde = new Date(perfil.created_at).toLocaleDateString(
        "pt-PT",
        { day: "2-digit", month: "long", year: "numeric" },
    );

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Perfil
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Informações da tua conta
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card do avatar */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center space-y-4">
                        <div className="relative">
                            {avatar ? (
                                <Image
                                    src={avatar}
                                    alt={nome}
                                    width={96}
                                    height={96}
                                    className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center">
                                    <User size={40} className="text-gray-400" />
                                </div>
                            )}
                            <span className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {nome}
                            </h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mt-1">
                                {accountLabel}
                            </span>
                        </div>

                        {perfil.org_name && (
                            <div className="w-full pt-2 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Organização
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                                    {perfil.org_name}
                                </p>
                            </div>
                        )}

                        <div className="w-full pt-2 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Membro desde
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                                {membroDesde}
                            </p>
                        </div>

                        <EditarPerfilUnificadoModal
                            firstName={firstName}
                            lastName={lastName}
                            telefone={perfil.telefone}
                            morada={perfil.morada}
                            cidade={perfil.cidade}
                            codigoPostal={perfil.codigo_postal}
                            pais={perfil.pais}
                            dataNascimento={
                                perfil.data_nascimento
                                    ? typeof perfil.data_nascimento === "string"
                                        ? perfil.data_nascimento.slice(0, 10)
                                        : new Date(perfil.data_nascimento)
                                              .toISOString()
                                              .slice(0, 10)
                                    : null
                            }
                            nif={perfil.nif}
                            iban={perfil.iban}
                            accountType={perfil.account_type}
                        />
                    </div>
                </div>

                {/* Detalhes */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Informações Pessoais */}
                    <Section
                        icon={<User size={18} className="text-blue-500" />}
                        title="Informações Pessoais"
                    >
                        <InfoRow label="Nome completo" value={nome} />
                        <InfoRow label="Tipo de conta" value={accountLabel} />
                        <InfoRow
                            label="Data de Nascimento"
                            value={nascimentoFormatted}
                        />
                        <InfoRow label="NIF" value={perfil.nif} />
                    </Section>

                    {/* Contacto */}
                    <Section
                        icon={<Mail size={18} className="text-blue-500" />}
                        title="Contacto"
                    >
                        <InfoRow label="Email" value={email} />
                        <InfoRow label="Telefone" value={perfil.telefone} />
                    </Section>

                    {/* Morada */}
                    {(perfil.morada ||
                        perfil.cidade ||
                        perfil.codigo_postal ||
                        perfil.pais) && (
                        <Section
                            icon={
                                <MapPin size={18} className="text-blue-500" />
                            }
                            title="Morada"
                        >
                            <InfoRow label="Morada" value={perfil.morada} />
                            <InfoRow label="Cidade" value={perfil.cidade} />
                            <InfoRow
                                label="Código Postal"
                                value={perfil.codigo_postal}
                            />
                            <InfoRow label="País" value={perfil.pais} />
                        </Section>
                    )}

                    {/* Financeiro — só presidente */}
                    {perfil.account_type === "presidente" && (
                        <Section
                            icon={
                                <CreditCard
                                    size={18}
                                    className="text-blue-500"
                                />
                            }
                            title="Dados Financeiros"
                        >
                            <InfoRow label="IBAN" value={perfil.iban} mono />
                        </Section>
                    )}

                    {/* Organização */}
                    {perfil.org_name && (
                        <Section
                            icon={
                                <Building2
                                    size={18}
                                    className="text-blue-500"
                                />
                            }
                            title="Organização"
                        >
                            <InfoRow label="Nome" value={perfil.org_name} />
                        </Section>
                    )}
                </div>
            </div>
        </div>
    );
}

function Section({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    mono,
}: {
    label: string;
    value: string | null | undefined;
    mono?: boolean;
}) {
    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p
                className={`text-sm font-medium text-gray-900 dark:text-white mt-0.5 ${mono ? "font-mono" : ""}`}
            >
                {value || "—"}
            </p>
        </div>
    );
}
