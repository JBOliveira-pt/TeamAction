// app/ui/dashboard/sidenav.tsx
"use client";

import {
    LogOut,
    User,
    Users,
    History,
    Home,
    Menu,
    X,
    BarChart3,
    FileText,
    CircleUserRound,
    Receipt,
} from "lucide-react";
import Link from "next/link";
import AcmeLogo from "@/app/ui/primeflow-logo";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { DashboardHeader } from "@/app/components/header";

export default function SideNav() {
    const [isOpen, setIsOpen] = useState(false);
    const { isLoaded, user: clerkUser } = useUser();
    const pathname = usePathname();
    const [dbUser, setDbUser] = useState<{
        name: string;
        role: string;
        foto?: string;
    } | null>(null);

    // Busca dados do usuário do banco de dados
    useEffect(() => {
        async function fetchUserData() {
            if (!isLoaded || !clerkUser) return;

            try {
                const response = await fetch("/api/debug/user", {
                    cache: "no-store",
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
                console.error("Erro ao buscar dados do usuário:", error);
            }
        }

        fetchUserData();
    }, [isLoaded, clerkUser, pathname]);

    // Botão do menu mobile para passar ao header
    const mobileMenuTrigger = (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800 hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
        >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
    );

    // Usa dados do banco de dados se disponíveis, senão usa do Clerk
    const userData = dbUser || {
        name:
            isLoaded && clerkUser
                ? clerkUser.fullName || clerkUser.firstName || "Usuario"
                : "Usuario",
        role:
            isLoaded && clerkUser
                ? (clerkUser.publicMetadata?.role as string) || "user"
                : "user",
        foto: isLoaded && clerkUser ? clerkUser.imageUrl : undefined,
    };

    return (
        <>
            {/* Overlay - Visível apenas no mobile quando o menu está aberto */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Header */}
            <DashboardHeader
                mobileMenuTrigger={mobileMenuTrigger}
                user={userData}
            />

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-40
          w-64 bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-6 flex flex-col border-r border-gray-200 dark:border-gray-800 h-screen
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-15 h-10 flex items-center justify-center">
                        <AcmeLogo />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">PrimeFLOW</h1>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Dashboard
                        </p>
                    </div>
                </div>

                {/* Menu de Navegação */}
                <nav className="flex-1 space-y-2">
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
                </nav>

                {/* Sign Out Button */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-900">
                    <SignOutButton redirectUrl="/login">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300 transition w-full p-3 rounded-lg hover:bg-red-500/10 group cursor-pointer"
                        >
                            <LogOut
                                size={20}
                                className="group-hover:-translate-x-1 transition-transform"
                            />
                            <span className="font-medium">Sair da conta</span>
                        </button>
                    </SignOutButton>
                </div>
            </aside>
        </>
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

    // Para a página Home/Dashboard, só fica ativo quando está exatamente nela
    const active =
        href === "/dashboard"
            ? pathname === "/dashboard"
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
