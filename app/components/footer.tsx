"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Github,
    Youtube,
    Mail,
    Loader2,
    CheckCircle,
    Building2,
    ClipboardList,
    Volleyball,
    UserCheck,
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

export function Footer() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [errorMsg, setErrorMsg] = useState("");

    async function handleSubscribe(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setErrorMsg("");

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nome.trim(),
                    email: email.trim(),
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setStatus("error");
                setErrorMsg(data.error || "Erro ao inscrever-se.");
                return;
            }

            setStatus("success");
            setNome("");
            setEmail("");
        } catch {
            setStatus("error");
            setErrorMsg("Erro de rede. Tente novamente.");
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <footer className="bg-gradient-to-b from-[#0f172a] to-[#0c1222] text-white">
            {/* Main Footer — 4 columns */}
            <div className="mx-auto max-w-7xl px-5 py-14">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    {/* Col 1 — Brand + Navigation */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Image
                                src={ASSETS.logoFullWhiteNoBg}
                                alt="TeamAction"
                                width={180}
                                height={30}
                                className="h-30 w-auto max-w-[180px] mt-[-2rem]"
                            />
                            <p className="text-sm mt-[-1.5rem] w-[14rem] leading-relaxed text-slate-400">
                                A plataforma de gestão desportiva que simplifica
                                o dia a dia de clubes, treinadores, atletas e
                                responsáveis.
                            </p>
                        </div>

                        <div>
                            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                                Navegação
                            </h4>
                            <nav className="flex flex-row gap-3">
                                <button
                                    onClick={scrollToTop}
                                    className="w-fit text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                                >
                                    Home
                                </button>
                                <Link
                                    href="/login"
                                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                                >
                                    Sign up
                                </Link>
                            </nav>
                        </div>
                    </div>

                    {/* Col 2 — Recursos (with profile icons matching navbar) */}
                    <div>
                        <h4 className="mb-4 mt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                            Recursos
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {profileLinks.map((p) => {
                                const Icon = p.icon;
                                return (
                                    <a
                                        key={p.label}
                                        href={p.href}
                                        className={`flex w-fit items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all duration-200 ${p.color} ${p.bg}`}
                                    >
                                        <Icon className="h-[18px] w-[18px]" />
                                        {p.label}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Col 3 — Contact */}
                    <div>
                        <h4 className="mb-4 mt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                            Contacto
                        </h4>
                        <div className="space-y-3">
                            <a
                                href="mailto:teamaction@outlook.pt"
                                className="flex items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                            >
                                <Mail className="h-4 w-4" />
                                teamaction@outlook.pt
                            </a>
                            <p className="text-sm text-slate-500">
                                Lisboa, Portugal
                            </p>

                            <div className="flex gap-3 pt-2">
                                <a
                                    href="https://github.com/JBOliveira-pt/TeamAction"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-slate-700/60 p-2.5 text-slate-500 transition-all duration-200 hover:border-slate-500 hover:bg-white/5 hover:text-white"
                                >
                                    <Github className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://youtube.com/@teamactionapp?si=38qfAmuuQMnQyfy3"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-slate-700/60 p-2.5 text-slate-500 transition-all duration-200 hover:border-slate-500 hover:bg-white/5 hover:text-white"
                                >
                                    <Youtube className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Col 4 — Newsletter Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-white/[0.04] p-5">
                        {/* Gradient accent top bar (matches feature cards) */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />

                        <h4 className="mt-1 text-sm font-bold text-white">
                            Inscreva-se em nossa Newsletter
                        </h4>
                        <p className="mt-1 text-xs text-slate-400">
                            Fique por dentro das novidades do TeamAction
                        </p>

                        <form
                            onSubmit={handleSubscribe}
                            className="mt-4 flex flex-col gap-2.5"
                        >
                            <input
                                type="text"
                                placeholder="Nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700/60 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700/60 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                            />
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-[0.8rem] bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/30 disabled:opacity-60"
                            >
                                {status === "loading" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                Inscrever-se
                            </button>
                        </form>

                        {status === "success" && (
                            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Inscrição realizada com sucesso!
                            </p>
                        )}
                        {status === "error" && (
                            <p className="mt-2.5 text-xs text-rose-400">
                                {errorMsg}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-slate-800/80">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row">
                    <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} TeamAction — Todos os
                        direitos reservados
                    </p>
                    <div className="flex gap-5">
                        <Link
                            href="/privacidade"
                            className="text-xs text-slate-600 transition-colors duration-200 hover:text-slate-300"
                        >
                            Privacidade
                        </Link>
                        <Link
                            href="/termos"
                            className="text-xs text-slate-600 transition-colors duration-200 hover:text-slate-300"
                        >
                            Termos de Uso
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
