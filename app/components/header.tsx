// app/ui/dashboard/navbar.tsx
"use client";

import { Bell, Moon, Search, Sun } from "lucide-react";
import { ReactNode, useState } from "react";
import { Avatar } from "@/app/components/avatar";
import { Button } from "@/app/components/button";
import { useTheme } from "@/app/components/theme-provider";
import { NotificationDropdown } from "@/app/components/notification-dropdown";

interface DashboardHeaderProps {
    mobileMenuTrigger?: ReactNode;
    actionButton?: ReactNode;
    user?: {
        name: string;
        role: string;
        foto?: string;
    };
}

export function DashboardHeader({
    mobileMenuTrigger,
    actionButton,
    user,
}: DashboardHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

    // Pega as iniciais do name para o fallback do avatar
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
                {/* Botão do menu mobile */}
                {mobileMenuTrigger && (
                    <div className="lg:hidden">{mobileMenuTrigger}</div>
                )}
            </div>

            {/* Lado Direito */}
            <div className="flex items-center gap-2 md:gap-4 pl-4">
                {/* Ícones de Ação */}
                <div className="flex gap-1 text-gray-600 dark:text-gray-400">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full cursor-pointer"
                    >
                        {theme === "dark" ? (
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
                <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.name || "Utilizador"}
                        </p>
                        <p className="text-xs text-blue-500 dark:text-blue-400 font-bold tracking-wider uppercase">
                            {user?.role || "Guest"}
                        </p>
                    </div>
                    <Avatar
                        src={user?.foto}
                        alt={user?.name || "Avatar"}
                        fallback={user?.name ? getInitials(user.name) : "US"}
                    />
                </div>
            </div>
        </header>
    );
}
