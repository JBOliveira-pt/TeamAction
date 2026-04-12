// Componente sidenav.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";
import {
    Home,
    Logs,
    Megaphone,
    Menu,
    ShieldCheck,
    Users,
    X,
    CreditCard,
    FileEdit,
    Mail,
    Newspaper,
} from "lucide-react";
import { useState } from "react";

const links = [
    { href: "/admin", label: "Visão Geral", icon: Home },
    { href: "/admin/users", label: "Utilizadores", icon: Users },
    { href: "/admin/planos", label: "Pedidos de Plano", icon: CreditCard },
    { href: "/admin/pedidos", label: "Alterações de Perfil", icon: FileEdit },
    { href: "/admin/convites", label: "Convites", icon: Mail },
    { href: "/admin/newsletter", label: "Newsletter", icon: Newspaper },
    { href: "/admin/logs", label: "Logs", icon: Logs },
    { href: "/admin/avisos", label: "Avisos", icon: Megaphone },
];

export function AdminSideNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed left-4 top-6 z-50 rounded-lg border border-gray-300 bg-white p-2 text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 lg:hidden"
                aria-label="Abrir menu admin"
            >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <aside
                className={clsx(
                    "fixed top-0 left-0 z-40 h-screen w-64 border-r border-gray-200 bg-white p-6 text-gray-900 transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950 dark:text-white",
                    isOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0",
                )}
            >
                <div className="mb-10 px-2">
                    <Image
                        src={ASSETS.logoFullWhite}
                        alt="TeamAction"
                        width={190}
                        height={46}
                        className="h-auto w-auto max-w-[190px] dark:hidden"
                        priority
                    />
                    <Image
                        src={ASSETS.logoFullBlack}
                        alt="TeamAction"
                        width={190}
                        height={46}
                        className="hidden h-auto w-auto max-w-[190px] dark:block"
                        priority
                    />
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        <ShieldCheck size={14} />
                        Painel Administrativo
                    </div>
                </div>

                <nav className="space-y-1 pr-4">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active =
                            pathname === link.href ||
                            (link.href !== "/admin" &&
                                pathname.startsWith(link.href));

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={clsx(
                                    "group flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-200",
                                    active
                                        ? "border-r-2 border-blue-500 bg-blue-600/10 text-blue-500 dark:text-blue-400"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-gray-100",
                                )}
                            >
                                <Icon
                                    size={18}
                                    className={clsx(
                                        "transition-colors",
                                        active
                                            ? "text-blue-500 dark:text-blue-400"
                                            : "text-gray-500 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-100",
                                    )}
                                />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
