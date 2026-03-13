"use client";

import { Avatar } from "@/app/components/avatar";
import { Button } from "@/app/components/button";
import { NotificationDropdown } from "@/app/components/notification-dropdown";
import { useTheme } from "@/app/components/theme-provider";
import { SignOutButton } from "@clerk/nextjs";
import { ChevronDown, Moon, Sun, UserCircle } from "lucide-react";
import Link from "next/link";
import { ReactNode, useState, useEffect, useRef } from "react";

interface DashboardHeaderProps {
    mobileMenuTrigger?: ReactNode;
    actionButton?: ReactNode;
    profileTabs?: ReactNode;
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
    user,
}: DashboardHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isProfileMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleNotificationClick = () => {
        setHasUnreadNotifications(false);
    };

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
                        ) : theme === "dark" ? (
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

                {/* Perfil do Utilizador */}
                <div
                    className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2"
                    ref={profileMenuRef}
                >
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.name || "Utilizador"}
                        </p>
                        <p className="text-xs text-blue-500 dark:text-blue-400 font-bold tracking-wider uppercase">
                            {user?.role || "Guest"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                        className="flex items-center gap-1 rounded-full focus:outline-none"
                        aria-label="Abrir menu do utilizador"
                    >
                        <Avatar
                            src={user?.foto}
                            alt={user?.name || "Avatar"}
                            fallback={
                                user?.name ? getInitials(user.name) : "US"
                            }
                        />
                        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {isProfileMenuOpen && (
                        <div className="absolute right-4 top-16 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.name || "Utilizador"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {user?.role || "Guest"}
                                </p>
                            </div>

                            <Link
                                href="/dashboard"
                                onClick={() => setIsProfileMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <UserCircle className="h-4 w-4" />
                                Painel Principal
                            </Link>

                            <div className="border-t border-gray-200 dark:border-gray-800 p-2">
                                <SignOutButton redirectUrl="/login">
                                    <button
                                        type="button"
                                        className="w-full rounded-md px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                    >
                                        Sair da conta
                                    </button>
                                </SignOutButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
