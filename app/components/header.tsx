'use client';

import { Avatar } from '@/app/components/avatar';
import { Button } from '@/app/components/button';
import { NotificationDropdown } from '@/app/components/notification-dropdown';
import { useTheme } from '@/app/components/theme-provider';
import { useClerk } from '@clerk/nextjs';
import { LogOut, Moon, Settings, Sun, UserRoundCog } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface DashboardHeaderProps {
    mobileMenuTrigger?: ReactNode;
    actionButton?: ReactNode;
    profileTabs?: ReactNode;
    isCreatingProfile?: boolean;
    user?: {
        name: string;
        role: string;
        foto?: string;
    };
}

export function DashboardHeader({
    mobileMenuTrigger,
    actionButton,
    profileTabs,
    isCreatingProfile = false,
    user,
}: DashboardHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { signOut } = useClerk();
    const router = useRouter();

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleNotificationClick = () => {
        setHasUnreadNotifications(false);
    };

    useEffect(() => {
        if (!userMenuOpen) return;
        function handleClickOutside(e: MouseEvent) {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target as Node)
            ) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    return (
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-20 bg-white dark:bg-gray-950 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-40 px-4 md:px-8 flex items-center justify-between transition-all">
            {/* Lado Esquerdo */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                {mobileMenuTrigger && (
                    <div className="lg:hidden">{mobileMenuTrigger}</div>
                )}
                {profileTabs && (
                    <div className="hidden lg:flex">{profileTabs}</div>
                )}
            </div>

            {/* Lado Direito */}
            <div className="flex items-center gap-2 md:gap-4 pl-4">
                <div className="flex gap-1 text-gray-600 dark:text-gray-400">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full cursor-pointer"
                    >
                        {!mounted ? (
                            <Sun size={20} />
                        ) : theme === 'dark' ? (
                            <Moon size={20} />
                        ) : (
                            <Sun size={20} />
                        )}
                    </Button>

                    <div onClick={handleNotificationClick}>
                        <NotificationDropdown
                            hasUnread={hasUnreadNotifications}
                        />
                    </div>
                </div>

                {/* Perfil do Utilizador — clicável com dropdown */}
                <div
                    ref={userMenuRef}
                    className="relative flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2"
                >
                    <button
                        onClick={() => setUserMenuOpen((o) => !o)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user?.name || 'Utilizador'}
                            </p>
                            <p className="text-xs text-blue-500 dark:text-blue-400 font-bold tracking-wider uppercase">
                                {user?.role || 'Guest'}
                            </p>
                        </div>
                        <Avatar
                            src={user?.foto}
                            alt={user?.name || 'Avatar'}
                            fallback={
                                user?.name ? getInitials(user.name) : 'US'
                            }
                        />
                    </button>

                    {/* Dropdown */}
                    {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-52 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl py-1 z-50">
                            {isCreatingProfile ? (
                                <div className="px-4 py-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                                    Completa o registo do perfil para acederes
                                    às restantes opções.
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/dashboard/utilizador/perfil"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Settings
                                            size={16}
                                            className="text-gray-500 dark:text-gray-400"
                                        />
                                        Definições da Conta
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            router.push('/dashboard');
                                        }}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                    >
                                        <UserRoundCog
                                            size={16}
                                            className="text-gray-500 dark:text-gray-400"
                                        />
                                        Trocar de Perfil
                                    </button>
                                    <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                                </>
                            )}
                            <button
                                onClick={() =>
                                    signOut(() => router.push('/login'))
                                }
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                            >
                                <LogOut size={16} />
                                Sair da Conta
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
