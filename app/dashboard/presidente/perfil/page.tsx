import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchPerfilPresidente } from "@/app/lib/data";

export const dynamic = 'force-dynamic';
import {
    UserCircleIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
    CreditCardIcon,
    PencilSquareIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/outline";

export default async function PerfilPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const perfil = await fetchPerfilPresidente();

    const nome = user.fullName ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const email = user.emailAddresses[0]?.emailAddress ?? "—";
    const avatar = user.imageUrl;

    const formatData = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Informações da tua conta e do clube
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Card Principal */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center space-y-4">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={avatar}
                                alt={nome}
                                className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md object-cover"
                            />
                            <span className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{nome}</h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mt-1">
                                Presidente
                            </span>
                        </div>

                        {perfil && (
                            <div className="w-full pt-2 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Clube</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                                    {perfil.org_name}
                                </p>
                            </div>
                        )}

                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            <PencilSquareIcon className="w-4 h-4" />
                            Editar Perfil
                        </button>
                    </div>
                </div>

                {/* Detalhes */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Informações Pessoais */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-blue-500" />
                            Informações Pessoais
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Nome completo</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{nome}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Função</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">Presidente</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">ID da conta</p>
                                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                            Contacto
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email verificado</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                                    user.emailAddresses[0]?.verification?.status === "verified"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-amber-500/10 text-amber-400"
                                }`}>
                                    {user.emailAddresses[0]?.verification?.status === "verified" ? "Verificado" : "Por verificar"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Clube */}
                    {perfil && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
                                Clube
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Nome</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{perfil.org_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Slug</p>
                                    <p className="text-sm font-mono text-gray-900 dark:text-white mt-0.5">{perfil.org_slug}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Membro desde</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 flex items-center gap-1">
                                        <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                        {formatData(perfil.org_created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financeiro */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-blue-500" />
                            Financeiro
                        </h3>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">IBAN</p>
                            <p className="text-sm font-mono text-gray-900 dark:text-white mt-0.5">
                                {perfil?.iban ?? (
                                    <span className="text-gray-400 dark:text-gray-500 italic not-italic font-sans text-xs">
                                        Não definido
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

