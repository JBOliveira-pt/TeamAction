// Navbar da landing page: logo, ícones de recursos, planos e autenticação.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ClipboardList,
    Volleyball,
    Building2,
    UserCheck,
    UserPlus,
    Menu,
    X,
} from "lucide-react";
import { ASSETS } from "@/app/lib/assets";

const profileLinks = [
    {
        label: "Presidente",
        icon: Building2,
        href: "#clube",
        color: "text-indigo-500 hover:text-indigo-400",
        bg: "hover:bg-indigo-500/10",
    },
    {
        label: "Treinador",
        icon: ClipboardList,
        href: "#treinador",
        color: "text-emerald-500 hover:text-blue-400",
        bg: "hover:bg-blue-500/10",
    },
    {
        label: "Atleta",
        icon: Volleyball,
        href: "#atleta",
        color: "text-blue-500 hover:text-emerald-400",
        bg: "hover:bg-emerald-500/10",
    },
    {
        label: "Responsável",
        icon: UserCheck,
        href: "#responsavel",
        color: "text-amber-500 hover:text-amber-400",
        bg: "hover:bg-amber-500/10",
    },
];

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    return (
        <>
            <nav
                className={`fixed w-full z-50 transition-all duration-700 ease-out ${
                    scrolled
                        ? "bg-white/35 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
                        : "bg-transparent border-b border-transparent"
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logotipo */}
                        <a
                            href="#"
                            className="flex-shrink-0 transition-opacity hover:opacity-80"
                        >
                            <Image
                                src={ASSETS.logoFullWhiteNoBg}
                                alt="TeamAction"
                                width={170}
                                height={42}
                                className="h-auto w-auto max-w-[170px]"
                                priority
                            />
                        </a>

                        {/* Centro: ícones Recursos + Planos */}
                        <div className="hidden lg:flex items-center gap-10">
                            {/* Grupo Recursos */}
                            <div className="flex items-center gap-3">
                                <span className="text-[13px] font-semibold uppercase tracking-widest text-[#27365D]-100 select-none">
                                    Recursos
                                </span>
                                <div className="w-px h-5 bg-slate-300/40" />
                                <div className="flex items-center gap-0.5">
                                    {profileLinks.map((link) => (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            className={`group relative p-2.5 rounded-xl transition-all duration-200 ${link.color} ${link.bg}`}
                                        >
                                            <link.icon className="h-[18px] w-[18px]" />
                                            {/* Tooltip */}
                                            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 text-[11px] font-medium bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none scale-90 group-hover:scale-100">
                                                {link.label}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Planos */}
                            <a
                                href="#planos"
                                className="text-[13px] font-semibold uppercase tracking-widest text-[#27365D]-100 hover:text-blue-400 transition-colors duration-200"
                            >
                                Planos
                            </a>
                        </div>

                        {/* Direita: botões Auth */}
                        <div className="hidden lg:flex items-center gap-3">
                            <Link
                                href="/login"
                                className="px-5 py-2.5 rounded-full text-1rem font-semibold text-[#27365D]-100 hover:text-blue-400 transition-colors duration-200"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                className="flex items-center gap-2 px-7 py-2.5 rounded-[0.8rem] text-sm font-semibold bg-blue-800 text-white hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30"
                            >
                                <UserPlus className="h-4 w-4" />
                                Sign up
                            </Link>
                        </div>

                        {/* Hamburger mobile */}
                        <button
                            onClick={() => setMobileOpen((o) => !o)}
                            className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                            aria-label="Menu"
                        >
                            {mobileOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Menu mobile overlay */}
            <div
                className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
                    mobileOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
            >
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl" />
                <div className="relative pt-28 px-6 flex flex-col gap-8">
                    {/* Recursos */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                            Recursos
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {profileLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white/60 transition-all duration-200 ${link.bg} ${link.color}`}
                                >
                                    <link.icon className="h-5 w-5 flex-shrink-0" />
                                    <span className="text-sm font-medium text-slate-700">
                                        {link.label}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Planos */}
                    <a
                        href="#planos"
                        onClick={() => setMobileOpen(false)}
                        className="text-sm font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors py-2"
                    >
                        Planos
                    </a>

                    {/* Botões Auth */}
                    <div className="border-t border-slate-200/60 pt-8 flex flex-col gap-3">
                        <Link
                            href="/login"
                            onClick={() => setMobileOpen(false)}
                            className="w-full text-center px-5 py-3.5 rounded-2xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            onClick={() => setMobileOpen(false)}
                            className="w-full text-center px-5 py-3.5 rounded-2xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
