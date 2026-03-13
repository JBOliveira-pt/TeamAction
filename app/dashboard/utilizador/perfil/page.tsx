import type { Atleta } from "@/app/lib/definitions";
import { auth } from "@clerk/nextjs/server";
import {
    EnvelopeIcon,
    MapPinIcon,
    PencilIcon,
    PhoneIcon,
    ScaleIcon,
    UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getAtletaByClerkUser(
    clerkUserId: string,
): Promise<Atleta | null> {
    const users = await sql<{ email: string }[]>`
        SELECT email FROM users WHERE clerk_user_id = ${clerkUserId}
    `;
    if (!users.length) return null;

    const atletas = await sql<Atleta[]>`
        SELECT * FROM utilizador WHERE email = ${users[0].email}
    `;

    return atletas[0] ?? null;
}

function estadoBadge(estado: string) {
    const map: Record<string, string> = {
        Ativo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        Inativo: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        Pendente:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
    return map[estado] ?? "bg-gray-100 text-gray-600";
}

export default async function PerfilUtilizadorPage() {
    const { userId } = await auth();
    if (!userId) return null;

    const atleta = await getAtletaByClerkUser(userId);

    if (!atleta) {
        redirect("/dashboard/utilizador/perfil/criar");
    }

    const nascimentoFormatted = new Date(
        atleta.data_nascimento,
    ).toLocaleDateString("pt-PT");

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Perfil Utilizador
            </h1>
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <div className="px-6 pb-6 -mt-10 flex items-end gap-5">
                    <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 shadow-md">
                        {atleta.foto_perfil_url ? (
                            <Image
                                src={atleta.foto_perfil_url}
                                alt="Foto de perfil"
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserCircleIcon className="w-full h-full text-gray-400 p-1" />
                        )}
                    </div>
                    <div className="mt-10 flex-1 min-w-0 flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {atleta.nome} {atleta.sobrenome}
                                </h1>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${estadoBadge(atleta.estado)}`}
                                >
                                    {atleta.estado}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {atleta.email}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/utilizador/perfil/editar"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                        >
                            <PencilIcon className="w-4 h-4" />
                            Editar Perfil
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <InfoCard label="Dados Pessoais">
                    <InfoRow
                        icon={<UserCircleIcon className="w-4 h-4" />}
                        label="Data de Nascimento"
                        value={nascimentoFormatted}
                    />
                    <InfoRow
                        icon={<PhoneIcon className="w-4 h-4" />}
                        label="Telemovel"
                        value={atleta.telemovel}
                    />
                    <InfoRow
                        icon={<EnvelopeIcon className="w-4 h-4" />}
                        label="Email"
                        value={atleta.email}
                    />
                    <InfoRow
                        icon={<MapPinIcon className="w-4 h-4" />}
                        label="Morada"
                        value={atleta.morada}
                    />
                </InfoCard>

                <InfoCard label="Dados Fisicos">
                    <InfoRow
                        icon={<ScaleIcon className="w-4 h-4" />}
                        label="Peso"
                        value={atleta.peso_kg ? `${atleta.peso_kg} kg` : null}
                    />
                    <InfoRow
                        icon={<ScaleIcon className="w-4 h-4" />}
                        label="Altura"
                        value={
                            atleta.altura_cm ? `${atleta.altura_cm} cm` : null
                        }
                    />
                </InfoCard>
            </div>
        </div>
    );
}

function InfoCard({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                {label}
            </h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0">
                {icon}
            </span>
            <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    {label}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {value ?? <span className="text-gray-400">-</span>}
                </p>
            </div>
        </div>
    );
}
