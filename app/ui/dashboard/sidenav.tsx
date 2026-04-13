// Barra de navegação lateral do dashboard com menus dinâmicos por tipo de conta.
"use client";

import { DashboardHeader } from "@/app/components/header";
import { ASSETS, getProfilePlaceholder } from "@/app/lib/assets";
import { AccountType } from "@/app/lib/account-type";
import { useUser } from "@clerk/nextjs";
import {
    Activity,
    BarChart2,
    BarChart3,
    Bell,
    Calendar,
    CheckSquare,
    ChevronDown,
    CircleUserRound,
    Clipboard,
    FileText,
    Heart,
    LayoutDashboard,
    Leaf,
    Lock,
    MapPinned,
    Menu,
    NotebookPen,
    Receipt,
    Settings,
    ShieldCheck,
    TrendingUp,
    Trophy,
    User,
    UserCog,
    Users,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SideNavProps = {
    accountType: AccountType;
};

export default function SideNav({ accountType }: SideNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeProfile, setActiveProfile] = useState<
        "atleta" | "treinador" | "responsavel" | "presidente" | null
    >(null);
    const { isLoaded, user: clerkUser } = useUser();
    const pathname = usePathname();
    const [dbUser, setDbUser] = useState<{
        name: string;
        foto?: string;
        menorIdade?: boolean;
    } | null>(null);

    const forcedProfile:
        | "presidente"
        | "treinador"
        | "atleta"
        | "responsavel"
        | null =
        accountType === "responsavel"
            ? "responsavel"
            : accountType === "presidente" ||
                accountType === "treinador" ||
                accountType === "atleta"
              ? accountType
              : null;

    const accountTypeLabel =
        accountType === "presidente"
            ? "Presidente"
            : accountType === "treinador"
              ? "Treinador"
              : accountType === "atleta"
                ? "Atleta"
                : accountType === "responsavel"
                  ? "Responsável"
                  : null;

    const selectedProfile = forcedProfile || activeProfile;
    const clerkImageUrl = clerkUser?.imageUrl;
    const clerkUserId = clerkUser?.id;

    useEffect(() => {
        async function fetchUserData() {
            if (!isLoaded || !clerkUserId) return;

            try {
                const response = await fetch("/api/debug/user", {
                    cache: "no-store",
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        setDbUser({
                            name: data.user.name,
                            foto: data.user.image_url || clerkImageUrl,
                            menorIdade: data.user.menor_idade === true,
                        });
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar dados do utilizador:", error);
            }
        }

        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, clerkUserId]);

    const isCreatingProfile = pathname.startsWith(
        "/dashboard/utilizador/perfil/criar",
    );

    const mobileMenuTrigger = (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800 hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
        >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
    );

    const profileTabsEl = forcedProfile ? null : (
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            <button
                onClick={() =>
                    setActiveProfile(
                        activeProfile === "presidente" ? null : "presidente",
                    )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === "presidente"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
                🏛️ Presidente
            </button>
            <button
                onClick={() =>
                    setActiveProfile(
                        activeProfile === "treinador" ? null : "treinador",
                    )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === "treinador"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
                🧑‍🏫 Treinador
            </button>
            <button
                onClick={() =>
                    setActiveProfile(
                        activeProfile === "atleta" ? null : "atleta",
                    )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === "atleta"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
                🏃 Atleta
            </button>
            <button
                onClick={() =>
                    setActiveProfile(
                        activeProfile === "responsavel" ? null : "responsavel",
                    )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === "responsavel"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
                👨‍👦 Responsável
            </button>
        </div>
    );

    const userData = dbUser
        ? {
              ...dbUser,
              role: accountTypeLabel || "Conta",
              placeholderSrc: getProfilePlaceholder(accountType),
          }
        : {
              name:
                  isLoaded && clerkUser
                      ? clerkUser.fullName || clerkUser.firstName || "Usuario"
                      : "Usuario",
              role: accountTypeLabel || "Conta",
              foto: isLoaded && clerkUser ? clerkUser.imageUrl : undefined,
              placeholderSrc: getProfilePlaceholder(accountType),
          };

    const profileHref =
        selectedProfile === "presidente"
            ? "/dashboard/presidente/perfil"
            : selectedProfile === "atleta"
              ? "/dashboard/atleta/perfil"
              : selectedProfile === "treinador"
                ? "/dashboard/treinador/perfil"
                : "/dashboard/responsavel/perfil";

    const settingsHref = "/dashboard/definicoes";

    return (
        <>
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <DashboardHeader
                mobileMenuTrigger={mobileMenuTrigger}
                profileTabs={isCreatingProfile ? undefined : profileTabsEl}
                profileHref={profileHref}
                settingsHref={settingsHref}
                user={userData}
                isCreatingProfile={isCreatingProfile}
            />

            <aside
                className={`
          fixed top-0 left-0 z-40
          w-64 bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-6 flex flex-col border-r border-gray-200 dark:border-gray-800 h-screen
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
            >
                <div className="flex items-center gap-3 mb-10 px-2">
                    <Image
                        src={ASSETS.logoFullWhite}
                        alt="TeamAction"
                        width={190}
                        height={46}
                        className="dark:hidden h-auto w-auto max-w-[190px]"
                        priority
                    />
                    <Image
                        src={ASSETS.logoFullBlack}
                        alt="TeamAction"
                        width={190}
                        height={46}
                        className="hidden dark:block h-auto w-auto max-w-[190px]"
                        priority
                    />
                </div>

                <nav className="flex-1 space-y-0.5 overflow-y-auto pr-2">
                    {isCreatingProfile && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 px-2 text-center">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                                <Lock size={24} className="text-amber-500" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Completa o teu perfil de atleta para acederes ao
                                menu.
                            </p>
                        </div>
                    )}
                    {!isCreatingProfile && selectedProfile === "presidente" && (
                        <>
                            <NavSection label="O Meu Espaço" defaultOpen>
                                <NavItem
                                    icon={<LayoutDashboard size={20} />}
                                    label="Painel"
                                    href="/dashboard/presidente"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Calendar size={20} />}
                                    label="Calendário"
                                    href="/dashboard/presidente/calendario"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<NotebookPen size={20} />}
                                    label="Notas"
                                    href="/dashboard/presidente/notas"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Época">
                                <NavItem
                                    icon={<Calendar size={20} />}
                                    label="Época Atual"
                                    href="/dashboard/presidente/epoca"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<FileText size={20} />}
                                    label="Relatórios"
                                    href="/dashboard/presidente/relatorios"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Clube">
                                <NavItem
                                    icon={<Trophy size={20} />}
                                    label="Equipas"
                                    href="/dashboard/presidente/equipas"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Users size={20} />}
                                    label="Atletas"
                                    href="/dashboard/presidente/atletas"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<User size={20} />}
                                    label="Staff"
                                    href="/dashboard/presidente/staff"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Desporto">
                                <NavItem
                                    icon={<Trophy size={20} />}
                                    label="Jogos"
                                    href="/dashboard/presidente/jogos"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<BarChart2 size={20} />}
                                    label="Estatísticas"
                                    href="/dashboard/presidente/estatisticas"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Comunicação">
                                <NavItem
                                    icon={<Clipboard size={20} />}
                                    label="Comunicados"
                                    href="/dashboard/presidente/comunicados"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<CheckSquare size={20} />}
                                    label="Autorizações"
                                    href="/dashboard/presidente/autorizacoes"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Gestão">
                                <NavItem
                                    icon={<Receipt size={20} />}
                                    label="Mensalidades"
                                    href="/dashboard/presidente/mensalidades"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<FileText size={20} />}
                                    label="Recibos"
                                    href="/dashboard/presidente/recibos"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<FileText size={20} />}
                                    label="Documentos"
                                    href="/dashboard/presidente/documentos"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<CircleUserRound size={20} />}
                                    label="Clube"
                                    href="/dashboard/presidente/clube"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                        </>
                    )}

                    {!isCreatingProfile && selectedProfile === "treinador" && (
                        <>
                            <NavSection label="O Meu Espaço" defaultOpen>
                                <NavItem
                                    icon={<LayoutDashboard size={20} />}
                                    label="Painel"
                                    href="/dashboard/treinador"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Calendar size={20} />}
                                    label="Calendário"
                                    href="/dashboard/treinador/calendario"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<NotebookPen size={20} />}
                                    label="Notas"
                                    href="/dashboard/treinador/notas"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<ShieldCheck size={20} />}
                                    label="Autorizações"
                                    href="/dashboard/treinador/autorizacoes"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Plantel">
                                <NavItem
                                    icon={<Users size={20} />}
                                    label="Equipa"
                                    href="/dashboard/treinador/equipa-atletas"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<UserCog size={20} />}
                                    label="Staff"
                                    href="/dashboard/treinador/staff"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Treino">
                                <NavItem
                                    icon={<CheckSquare size={20} />}
                                    label="Sessões"
                                    href="/dashboard/treinador/sessoes"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Clipboard size={20} />}
                                    label="Exercícios"
                                    href="/dashboard/treinador/exercicios"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Tático">
                                <NavItem
                                    icon={<MapPinned size={20} />}
                                    label="Quadro Tático"
                                    href="/dashboard/treinador/quadro-tatico"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Clipboard size={20} />}
                                    label="Biblioteca"
                                    href="/dashboard/treinador/biblioteca"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Jogo">
                                <NavItem
                                    icon={<Trophy size={20} />}
                                    label="Jogos"
                                    href="/dashboard/treinador/jogos"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<BarChart2 size={20} />}
                                    label="Live Stats"
                                    href="/dashboard/treinador/estatisticas-ao-vivo"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Atletas">
                                <NavItem
                                    icon={<Activity size={20} />}
                                    label="Condição Física"
                                    href="/dashboard/treinador/condicao-fisica"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Leaf size={20} />}
                                    label="Nutrição"
                                    href="/dashboard/treinador/nutricao"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                        </>
                    )}
                    {!isCreatingProfile && selectedProfile === "atleta" && (
                        <>
                            <NavSection label="O Meu Espaço" defaultOpen>
                                <NavItem
                                    icon={<LayoutDashboard size={20} />}
                                    label="Painel"
                                    href="/dashboard/atleta"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Calendar size={20} />}
                                    label="Calendário"
                                    href="/dashboard/atleta/calendario"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<NotebookPen size={20} />}
                                    label="Notas"
                                    href="/dashboard/atleta/notas"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Saúde">
                                <NavItem
                                    icon={<Heart size={20} />}
                                    label="Médico"
                                    href="/dashboard/atleta/medico"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Activity size={20} />}
                                    label="Condição Física"
                                    href="/dashboard/atleta/condicao-fisica"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            <NavSection label="Desempenho">
                                <NavItem
                                    icon={<TrendingUp size={20} />}
                                    label="Estatísticas"
                                    href="/dashboard/atleta/estatisticas"
                                    onClick={() => setIsOpen(false)}
                                />
                                <NavItem
                                    icon={<Trophy size={20} />}
                                    label="Jogos"
                                    href="/dashboard/atleta/jogos"
                                    onClick={() => setIsOpen(false)}
                                />
                            </NavSection>
                            {!dbUser?.menorIdade && (
                                <NavSection label="Financeiro">
                                    <NavItem
                                        icon={<Receipt size={20} />}
                                        label="Mensalidades"
                                        href="/dashboard/atleta/mensalidades"
                                        onClick={() => setIsOpen(false)}
                                    />
                                </NavSection>
                            )}
                            <NavSection label="Clube">
                                <NavItem
                                    icon={<Clipboard size={20} />}
                                    label="Comunicados"
                                    href="/dashboard/atleta/comunicados"
                                    onClick={() => setIsOpen(false)}
                                />
                                {!dbUser?.menorIdade && (
                                    <NavItem
                                        icon={<ShieldCheck size={20} />}
                                        label="Autorizações"
                                        href="/dashboard/atleta/autorizacoes"
                                        onClick={() => setIsOpen(false)}
                                    />
                                )}
                            </NavSection>
                        </>
                    )}
                    {!isCreatingProfile &&
                        selectedProfile === "responsavel" && (
                            <>
                                <NavSection label="O Meu Espaço" defaultOpen>
                                    <NavItem
                                        icon={<LayoutDashboard size={20} />}
                                        label="Painel"
                                        href="/dashboard/responsavel"
                                        onClick={() => setIsOpen(false)}
                                    />
                                    <NavItem
                                        icon={<Calendar size={20} />}
                                        label="Calendário"
                                        href="/dashboard/responsavel/calendario"
                                        onClick={() => setIsOpen(false)}
                                    />
                                    <NavItem
                                        icon={<NotebookPen size={20} />}
                                        label="Notas"
                                        href="/dashboard/responsavel/notas"
                                        onClick={() => setIsOpen(false)}
                                    />
                                    <NavItem
                                        icon={<UserCog size={20} />}
                                        label="Dados do Atleta"
                                        href="/dashboard/responsavel/dados-educando"
                                        onClick={() => setIsOpen(false)}
                                    />
                                </NavSection>
                                <NavSection label="Saúde">
                                    <NavItem
                                        icon={<Heart size={20} />}
                                        label="Médico"
                                        href="/dashboard/responsavel/medico"
                                        onClick={() => setIsOpen(false)}
                                    />
                                    <NavItem
                                        icon={<Activity size={20} />}
                                        label="Condição Física"
                                        href="/dashboard/responsavel/condicao-fisica"
                                        onClick={() => setIsOpen(false)}
                                    />
                                </NavSection>
                                <NavSection label="Desempenho">
                                    <NavItem
                                        icon={<BarChart2 size={20} />}
                                        label="Estatísticas"
                                        href="/dashboard/responsavel/estatisticas"
                                        onClick={() => setIsOpen(false)}
                                    />
                                    <NavItem
                                        icon={<Trophy size={20} />}
                                        label="Jogos"
                                        href="/dashboard/responsavel/jogos"
                                        onClick={() => setIsOpen(false)}
                                    />
                                </NavSection>
                                <NavSection label="Clube">
                                    <NavItem
                                        icon={<Receipt size={20} />}
                                        label="Mensalidades"
                                        href="/dashboard/responsavel/mensalidades"
                                        onClick={() => setIsOpen(false)}
                                    />
                                    <NavItem
                                        icon={<Bell size={20} />}
                                        label="Comunicados"
                                        href="/dashboard/responsavel/comunicados"
                                        onClick={() => setIsOpen(false)}
                                    />
                                    <NavItem
                                        icon={<ShieldCheck size={20} />}
                                        label="Autorizações"
                                        href="/dashboard/responsavel/autorizacoes"
                                        onClick={() => setIsOpen(false)}
                                    />
                                </NavSection>
                            </>
                        )}
                    {!isCreatingProfile && !selectedProfile && (
                        <>
                            <NavItem
                                icon={<BarChart3 size={20} />}
                                label="Home"
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                href="/dashboard/presidente/recibos"
                                icon={<Receipt size={20} />}
                                label="Recibos"
                                onClick={() => setIsOpen(false)}
                            />
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}

function NavSection({
    label,
    defaultOpen = false,
    children,
}: {
    label: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-left w-full px-3 gap-2 pt-4 pb-1 group"
            >
                <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-600 uppercase">
                    {label}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-gray-400 dark:text-gray-600 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
                />
            </button>
            {open && <div className="space-y-0.5">{children}</div>}
        </div>
    );
}

function LockedNavItem({
    icon,
    label,
}: {
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl opacity-40 cursor-not-allowed text-gray-600 dark:text-gray-400">
            <span className="text-gray-500 dark:text-gray-500">{icon}</span>
            <span className="font-medium flex-1">{label}</span>
            <Lock size={12} className="text-gray-400" />
        </div>
    );
}

function NavItem({
    href,
    icon,
    label,
    onClick,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}) {
    const pathname = usePathname();

    const exactMatchPaths = [
        "/dashboard",
        "/dashboard/presidente",
        "/dashboard/treinador",
        "/dashboard/atleta",
        "/dashboard/responsavel",
    ];

    const active = exactMatchPaths.includes(href)
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                active
                    ? "bg-blue-600/10 text-blue-500 dark:text-blue-400 border-r-2 border-blue-500"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
        >
            <span
                className={
                    active
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
                }
            >
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}
