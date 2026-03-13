// app/ui/dashboard/sidenav.tsx
'use client';

import { DashboardHeader } from '@/app/components/header';
import TeamActionLogo from '@/app/ui/teamaction-logo';
import { useUser } from '@clerk/nextjs';
import {
    Activity,
    BarChart2,
    BarChart3,
    Calendar,
    CheckSquare,
    CircleUserRound,
    Clipboard,
    FileText,
    Leaf,
    Lock,
    MapPinned,
    Menu,
    Receipt,
    TrendingUp,
    Trophy,
    User,
    Users,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SideNav() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeProfile, setActiveProfile] = useState<
        'atleta' | 'treinador' | 'pai' | 'presidente' | null
    >(null);
    const { isLoaded, user: clerkUser } = useUser();
    const pathname = usePathname();
    const [dbUser, setDbUser] = useState<{
        name: string;
        role: string;
        foto?: string;
    } | null>(null);

    useEffect(() => {
        async function fetchUserData() {
            if (!isLoaded || !clerkUser) return;

            try {
                const response = await fetch('/api/debug/user', {
                    cache: 'no-store',
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        setDbUser({
                            name: data.user.name,
                            role: data.user.role,
                            foto: data.user.image_url || clerkUser.imageUrl,
                        });
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
            }
        }

        fetchUserData();
    }, [isLoaded, clerkUser, pathname]);

    const isCreatingProfile = pathname.startsWith(
        '/dashboard/utilizador/perfil/criar',
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

    const profileTabsEl = (
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            <button
                onClick={() =>
                    setActiveProfile(
                        activeProfile === 'presidente' ? null : 'presidente',
                    )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === 'presidente'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
                🏛️ Presidente
            </button>
            <button
                onClick={() =>
                    setActiveProfile(
                        activeProfile === 'treinador' ? null : 'treinador',
                    )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === 'treinador'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
                🧑‍🏫 Treinador
            </button>
            <button
                onClick={() =>
                    setActiveProfile(
                        activeProfile === 'atleta' ? null : 'atleta',
                    )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === 'atleta'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
                🏃 Atleta
            </button>
            <button
                onClick={() =>
                    setActiveProfile(activeProfile === 'pai' ? null : 'pai')
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeProfile === 'pai'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
                👨‍👦 Pai/Enc.
            </button>
        </div>
    );

    const userData = dbUser || {
        name:
            isLoaded && clerkUser
                ? clerkUser.fullName || clerkUser.firstName || 'Usuario'
                : 'Usuario',
        role:
            isLoaded && clerkUser
                ? (clerkUser.publicMetadata?.role as string) || 'user'
                : 'user',
        foto: isLoaded && clerkUser ? clerkUser.imageUrl : undefined,
    };

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
                user={userData}
                isCreatingProfile={isCreatingProfile}
            />

            <aside
                className={`
          fixed top-0 left-0 z-40
          w-64 bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-6 flex flex-col border-r border-gray-200 dark:border-gray-800 h-screen
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-15 h-10 flex items-center justify-center">
                        <TeamActionLogo />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">PrimeFLOW</h1>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Dashboard
                        </p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto pr-8">
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
                    {!isCreatingProfile && activeProfile === 'presidente' && (
                        <>
                            <NavSectionLabel>Principal</NavSectionLabel>
                            <NavItem
                                icon={<BarChart3 size={20} />}
                                label="Dashboard"
                                href="/dashboard/presidente"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavSectionLabel>Época</NavSectionLabel>
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
                            <NavSectionLabel>Clube</NavSectionLabel>
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
                            <NavSectionLabel>Desporto</NavSectionLabel>
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
                            <NavSectionLabel>Comunicação</NavSectionLabel>
                            <NavItem
                                icon={<Activity size={20} />}
                                label="Notificações"
                                href="/dashboard/presidente/notificacoes"
                                onClick={() => setIsOpen(false)}
                            />
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
                            <NavSectionLabel>Gestão</NavSectionLabel>
                            <NavItem
                                icon={<Receipt size={20} />}
                                label="Mensalidades"
                                href="/dashboard/presidente/mensalidades"
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
                                label="Definições"
                                href="/dashboard/presidente/definicoes"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                icon={<User size={20} />}
                                label="Perfil"
                                href="/dashboard/presidente/perfil"
                                onClick={() => setIsOpen(false)}
                            />
                        </>
                    )}

                    {!isCreatingProfile && activeProfile === 'treinador' && (
                        <>
                            <NavSectionLabel>O Meu Espaço</NavSectionLabel>
                            <NavItem
                                icon={<User size={20} />}
                                label="O meu perfil"
                                href="/dashboard/atleta/perfil"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                icon={<Calendar size={20} />}
                                label="Calendário"
                                href="/dashboard/treinador/calendario"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavSectionLabel>Treino</NavSectionLabel>
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
                            <NavItem
                                icon={<CheckSquare size={20} />}
                                label="Assiduidade"
                                href="/dashboard/treinador/assiduidade"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavSectionLabel>Tático</NavSectionLabel>
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
                            <NavSectionLabel>Jogo</NavSectionLabel>
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
                            <NavSectionLabel>Atletas</NavSectionLabel>
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
                        </>
                    )}
                    {activeProfile === 'atleta' && (
                        <>
                            <NavSectionLabel>Evolução</NavSectionLabel>
                            <NavItem
                                icon={<Activity size={20} />}
                                label="Condição Física"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                icon={<Leaf size={20} />}
                                label="Plano Alimentar"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                icon={<TrendingUp size={20} />}
                                label="As minhas stats"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                        </>
                    )}
                    {!isCreatingProfile && activeProfile === 'pai' && (
                        <>
                            <NavSectionLabel>O Meu Filho</NavSectionLabel>
                            <NavItem
                                icon={<User size={20} />}
                                label="Perfil"
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                icon={<Calendar size={20} />}
                                label="Agenda"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                icon={<CheckSquare size={20} />}
                                label="Assiduidade"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavSectionLabel>Equipa</NavSectionLabel>
                            <NavItem
                                icon={<Trophy size={20} />}
                                label="Jogos"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                icon={<BarChart2 size={20} />}
                                label="Estatísticas"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavSectionLabel>Saúde</NavSectionLabel>
                            <NavItem
                                icon={<Activity size={20} />}
                                label="Condição Física"
                                href="#"
                                onClick={() => setIsOpen(false)}
                            />
                            <LockedNavItem
                                icon={<Leaf size={20} />}
                                label="Nutrição"
                            />
                        </>
                    )}
                    {!isCreatingProfile && !activeProfile && (
                        <>
                            <NavItem
                                icon={<BarChart3 size={20} />}
                                label="Home"
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                href="/dashboard/invoices"
                                icon={<FileText size={20} />}
                                label="Faturas"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                href="/dashboard/receipts"
                                icon={<Receipt size={20} />}
                                label="Recibos"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                href="/dashboard/customers"
                                icon={<Users size={20} />}
                                label="Clientes"
                                onClick={() => setIsOpen(false)}
                            />
                            <NavItem
                                href="/dashboard/users"
                                icon={<CircleUserRound size={20} />}
                                label="Utilizadores"
                                onClick={() => setIsOpen(false)}
                            />
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}

function NavSectionLabel({ children }: { children: string }) {
    return (
        <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-600 uppercase px-3 pt-4 pb-1">
            {children}
        </p>
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

    const active =
        href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                active
                    ? 'bg-blue-600/10 text-blue-500 dark:text-blue-400 border-r-2 border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
        >
            <span
                className={
                    active
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors'
                }
            >
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}
