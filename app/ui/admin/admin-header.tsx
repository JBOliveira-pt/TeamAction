// Componente admin header.
"use client";

import { adminLogoutAction } from "@/app/lib/admin-actions";
import { useTheme } from "@/app/components/theme-provider";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export function AdminHeader() {
    const { theme, toggleTheme } = useTheme();
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <header className="fixed left-0 right-0 top-0 z-30 h-20 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 lg:left-64">
            <div className="flex h-full items-center justify-end px-4 md:px-6">
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100"
                        aria-label="Alternar tema"
                    >
                        {!mounted ? (
                            <Sun size={20} />
                        ) : theme === "dark" ? (
                            <Moon size={20} />
                        ) : (
                            <Sun size={20} />
                        )}
                    </button>

                    <div
                        ref={menuRef}
                        className="relative ml-1 border-l border-gray-200 pl-3 dark:border-gray-800"
                    >
                        <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
                        >
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
                                <Image
                                    src={
                                        !mounted || theme === "dark"
                                            ? ASSETS.logoWhite
                                            : ASSETS.logoBlack
                                    }
                                    alt="TeamAction"
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="hidden text-right md:block">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    TeamAction
                                </p>
                                <p className="text-xs uppercase tracking-wide text-blue-500 dark:text-blue-400">
                                    Admin
                                </p>
                            </div>
                            <ChevronDown
                                size={16}
                                className="text-gray-500 dark:text-gray-400"
                            />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                                    Sessao administrativa ativa
                                </div>
                                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                                <form action={adminLogoutAction}>
                                    <button
                                        type="submit"
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        <LogOut size={16} />
                                        Sair da sessao
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
