// Secção Planos: grelha de preços com animação scroll e destaque no Club Pro.
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Crown, Rocket, Shield, Star, Sparkles } from "lucide-react";
import Link from "next/link";

const planos = [
    {
        id: "rookie",
        nome: "Rookie",
        preco: "Grátis",
        precoLabel: "0 €",
        descricao:
            "Ideal para quem está a começar. Acede às funcionalidades essenciais da plataforma para gerir a tua equipa.",
        features: [
            "Gestão básica de equipas",
            "Calendário de jogos",
            "Perfis de atletas",
            "Comunicados simples",
        ],
        icon: Rocket,
        gradient: "from-slate-400 to-slate-500",
        accent: "slate",
        ring: "ring-slate-200",
        badge: "bg-slate-100 text-slate-600",
        iconBg: "bg-slate-100",
        iconColor: "text-slate-500",
        checkColor: "text-slate-400",
        popular: false,
    },
    {
        id: "team",
        nome: "Team",
        preco: "Pago",
        precoLabel: "—",
        descricao:
            "Para equipas que querem ir mais longe. Ferramentas avançadas de gestão e acompanhamento dos atletas.",
        features: [
            "Tudo do plano Rookie",
            "Estatísticas avançadas",
            "Relatórios de desempenho",
            "Gestão de mensalidades",
            "Notificações prioritárias",
        ],
        icon: Shield,
        gradient: "from-blue-500 to-blue-600",
        accent: "blue",
        ring: "ring-blue-200",
        badge: "bg-blue-50 text-blue-600",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        checkColor: "text-blue-500",
        popular: false,
    },
    {
        id: "club_pro",
        nome: "Club Pro",
        preco: "Pago",
        precoLabel: "—",
        descricao:
            "A solução completa para clubes profissionais. Controlo total sobre todas as operações do clube.",
        features: [
            "Tudo do plano Team",
            "Multi-equipas ilimitadas",
            "Planos nutricionais",
            "Avaliações físicas",
            "Jogadas táticas",
            "Suporte prioritário",
        ],
        icon: Star,
        gradient: "from-violet-500 to-violet-600",
        accent: "violet",
        ring: "ring-violet-300",
        badge: "bg-violet-50 text-violet-600",
        iconBg: "bg-violet-50",
        iconColor: "text-violet-500",
        checkColor: "text-violet-500",
        popular: true,
    },
    {
        id: "legend",
        nome: "Legend",
        preco: "Pago",
        precoLabel: "—",
        descricao:
            "O plano definitivo. Acesso ilimitado a todas as funcionalidades presentes e futuras da plataforma.",
        features: [
            "Tudo do plano Club Pro",
            "API de integração",
            "Relatórios personalizados",
            "Funcionalidades beta exclusivas",
            "Gestor de conta dedicado",
            "Armazenamento ilimitado",
        ],
        icon: Crown,
        gradient: "from-amber-500 to-amber-600",
        accent: "amber",
        ring: "ring-amber-200",
        badge: "bg-amber-50 text-amber-600",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        checkColor: "text-amber-500",
        popular: false,
    },
];

function PlanoCard({
    plano,
    index,
}: {
    plano: (typeof planos)[number];
    index: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={cardRef}
            className={`relative flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                plano.popular
                    ? `border-violet-300 ring-2 ${plano.ring} shadow-lg shadow-violet-100`
                    : "border-slate-200"
            }`}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(40px)",
                transitionDelay: `${index * 120}ms`,
            }}
        >
            {/* Badge popular */}
            {plano.popular && (
                <div className="absolute -top-px left-0 right-0 flex justify-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-b-lg bg-gradient-to-r from-violet-500 to-violet-600 text-white text-[11px] font-bold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        Mais popular
                    </span>
                </div>
            )}

            {/* Barra gradiente no topo */}
            <div
                className={`h-1.5 w-full bg-gradient-to-r ${plano.gradient}`}
            />

            <div className="flex flex-col flex-1 p-7 pt-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className={`w-11 h-11 ${plano.iconBg} rounded-xl flex items-center justify-center`}
                    >
                        <plano.icon className={`h-5 w-5 ${plano.iconColor}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {plano.nome}
                        </h3>
                        <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${plano.badge}`}
                        >
                            {plano.preco}
                        </span>
                    </div>
                </div>

                {/* Descrição */}
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    {plano.descricao}
                </p>

                {/* Funcionalidades */}
                <ul className="space-y-2.5 mb-8 flex-1">
                    {plano.features.map((f) => (
                        <li
                            key={f}
                            className="flex items-start gap-2.5 text-sm text-slate-600"
                        >
                            <Check
                                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plano.checkColor}`}
                            />
                            {f}
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                <Link
                    href="/signup"
                    className={`block w-full py-2.5 text-center text-sm font-semibold rounded-xl transition-all duration-200 ${
                        plano.popular
                            ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:shadow-lg hover:shadow-violet-200"
                            : plano.id === "rookie"
                              ? "bg-slate-900 text-white hover:bg-slate-800"
                              : `bg-gradient-to-r ${plano.gradient} text-white hover:shadow-lg`
                    }`}
                >
                    {plano.id === "rookie" ? "Começar grátis" : "Começar agora"}
                </Link>
            </div>
        </div>
    );
}

export function PlanosSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const clubProWrapRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.05 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    /* ── Club Pro flutua no scroll ── */
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        let rafId: number;

        const update = () => {
            const wrap = clubProWrapRef.current;
            if (!wrap) return;

            const rect = section.getBoundingClientRect();
            const scrollableDistance =
                section.offsetHeight - window.innerHeight;
            if (scrollableDistance <= 0) return;

            const scrolled = Math.max(0, -rect.top);
            const progress = Math.min(1, scrolled / scrollableDistance);

            const float = Math.sin(progress * Math.PI * 6) * 10;
            wrap.style.transform = `translateY(${float}px)`;
        };

        const handleScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(update);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        update();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            id="planos"
            className="relative z-20 bg-slate-50"
            style={{ height: "300vh" }}
        >
            {/* Espaço para os cards entrarem por baixo */}
            <div style={{ height: "70vh" }} />

            {/* O conteúdo trava quando o seu centro chega ao centro da viewport */}
            <div
                className="sticky"
                style={{ top: "38vh", transform: "translateY(-50%)" }}
            >
                {/* Fundo decorativo */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-violet-100/40 to-blue-100/40 blur-3xl" />
                </div>

                <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Cabeçalho */}
                    <div
                        className="text-center mb-16 transition-all duration-700"
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible
                                ? "translateY(0)"
                                : "translateY(30px)",
                        }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-500 text-sm font-semibold mb-6">
                            <Sparkles className="h-4 w-4" />
                            Planos & Preços
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                            Escolha o plano{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
                                ideal
                            </span>
                        </h2>
                        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Do amador ao profissional: temos o plano certo para
                            o seu clube, para sua equipa ou para sua carreira
                            desportiva.
                        </p>
                    </div>

                    {/* Grelha de planos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {planos.map((plano, i) => {
                            const card = (
                                <PlanoCard
                                    key={plano.id}
                                    plano={plano}
                                    index={i}
                                />
                            );
                            if (plano.id === "club_pro") {
                                return (
                                    <div
                                        key={plano.id}
                                        ref={clubProWrapRef}
                                        style={{ willChange: "transform" }}
                                    >
                                        {card}
                                    </div>
                                );
                            }
                            return card;
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
