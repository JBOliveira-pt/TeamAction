// Secção Presidente: vídeo scrub e cards de funcionalidades do presidente.
"use client";

import { useEffect, useRef, useState } from "react";
import {
    Users,
    CalendarDays,
    CreditCard,
    Receipt,
    BarChart3,
    Trophy,
    Megaphone,
    ShieldCheck,
    Bell,
    Building2,
    ImageIcon,
} from "lucide-react";

const features = [
    {
        icon: Users,
        title: "Gestão de Atletas & Equipas",
        description:
            "Controle total do plantel: convide atletas, organize equipas por escalão, acompanhe o estado de cada jogador e gerencie a staff técnica.",
        color: "from-indigo-500 to-indigo-600",
        bgLight: "bg-indigo-50",
        iconColor: "text-indigo-600",
    },
    {
        icon: CreditCard,
        title: "Mensalidades & Pagamentos",
        description:
            "Acompanhe pagamentos em tempo real. Veja quem está em dia, em atraso ou pendente — com resumo financeiro automático.",
        color: "from-emerald-500 to-emerald-600",
        bgLight: "bg-emerald-50",
        iconColor: "text-emerald-600",
    },
    {
        icon: Receipt,
        title: "Recibos & Documentos",
        description:
            "Gere recibos em PDF com um clique, organize documentos do clube e mantenha tudo acessível para a contabilidade.",
        color: "from-amber-500 to-amber-600",
        bgLight: "bg-amber-50",
        iconColor: "text-amber-600",
    },
    {
        icon: CalendarDays,
        title: "Calendário Integrado",
        description:
            "Visualize jogos, treinos e eventos de todas as equipas num calendário unificado. Nunca mais perca uma data importante.",
        color: "from-blue-500 to-blue-600",
        bgLight: "bg-blue-50",
        iconColor: "text-blue-600",
    },
    {
        icon: Trophy,
        title: "Jogos & Estatísticas",
        description:
            "Agende jogos, registe resultados e acompanhe o desempenho de cada equipa: vitórias, derrotas, golos e ranking de atletas.",
        color: "from-orange-500 to-orange-600",
        bgLight: "bg-orange-50",
        iconColor: "text-orange-600",
    },
    {
        icon: Megaphone,
        title: "Comunicados & Avisos",
        description:
            "Envie comunicados segmentados — para todos os membros, apenas treinadores, atletas ou responsáveis. Comunicação direta e eficiente.",
        color: "from-pink-500 to-pink-600",
        bgLight: "bg-pink-50",
        iconColor: "text-pink-600",
    },
    {
        icon: ShieldCheck,
        title: "Autorizações & Federação",
        description:
            "Gerencie pedidos de autorização federativa. Aprove ou rejeite solicitações de treinadores e atletas de forma centralizada.",
        color: "from-violet-500 to-violet-600",
        bgLight: "bg-violet-50",
        iconColor: "text-violet-600",
    },
    {
        icon: BarChart3,
        title: "Painel com Métricas",
        description:
            "Dashboard completo: total de atletas, equipas ativas, jogos agendados, pagamentos em atraso — tudo num olhar.",
        color: "from-cyan-500 to-cyan-600",
        bgLight: "bg-cyan-50",
        iconColor: "text-cyan-600",
    },
    {
        icon: Bell,
        title: "Notificações em Tempo Real",
        description:
            "Receba alertas automáticos sobre convites, pagamentos, atualizações de jogos, suspensões e muito mais.",
        color: "from-rose-500 to-rose-600",
        bgLight: "bg-rose-50",
        iconColor: "text-rose-600",
    },
];

function FeatureCard({
    feature,
    index,
}: {
    feature: (typeof features)[number];
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
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={cardRef}
            className="group relative rounded-2xl border border-slate-100 bg-white overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : `translateY(40px)`,
                transitionDelay: `${index * 80}ms`,
            }}
        >
            {/* Barra gradiente no topo */}
            <div className={`h-1 w-full bg-gradient-to-r ${feature.color}`} />

            <div className="p-7">
                {/* Ícone */}
                <div
                    className={`w-12 h-12 ${feature.bgLight} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>

                {/* Título */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feature.title}
                </h3>

                {/* Descrição */}
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                    {feature.description}
                </p>

                {/* Placeholder de mídia */}
                <div className="relative w-full aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-300 group-hover:border-slate-300 transition-colors">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs font-medium text-slate-400">
                        Imagem / Vídeo
                    </span>
                </div>
            </div>
        </div>
    );
}

export function PresidenteSection() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);

    // Vídeo scroll-scrub
    useEffect(() => {
        const wrapper = wrapperRef.current;
        const video = videoRef.current;
        if (!wrapper || !video) return;

        let targetTime = 0;
        let curTime = 0;
        let rafId: number;

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const onScroll = () => {
            const rect = wrapper.getBoundingClientRect();
            const vh = window.innerHeight;
            const traveled = vh - rect.top;
            const total = rect.height;
            const raw = Math.max(0, Math.min(1, traveled / total));
            setProgress(raw);

            if (video.duration && isFinite(video.duration)) {
                targetTime = raw * video.duration;
            }
        };

        const tick = () => {
            curTime = lerp(curTime, targetTime, 0.1);
            if (Math.abs(video.currentTime - curTime) > 0.01) {
                video.currentTime = curTime;
            }
            rafId = requestAnimationFrame(tick);
        };

        const start = () => {
            video.pause();
            window.addEventListener("scroll", onScroll, { passive: true });
            onScroll();
            rafId = requestAnimationFrame(tick);
        };

        if (video.readyState >= 1) {
            start();
        } else {
            video.addEventListener("loadedmetadata", start, { once: true });
        }

        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Scroll dos cards: progress mapeia para translate vertical
    const cardsTranslateY = progress * 260;

    return (
        <div
            ref={wrapperRef}
            id="clube"
            className="relative"
            style={{ height: "400vh" }}
        >
            <section
                ref={sectionRef}
                className="sticky top-0 h-screen bg-white overflow-hidden"
            >
                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-10 items-stretch h-full">
                    {/* Esquerda: painel cabeçalho — fixo à esquerda */}
                    <div className="flex-shrink-0 w-[38%] min-w-[320px] max-w-[440px] flex flex-col justify-center py-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-500 text-sm font-semibold mb-6 w-fit">
                            <Building2 className="h-4 w-4" />
                            Clube / Presidente
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-videos/presidente-scrub-small.mp4"
                                    muted
                                    playsInline
                                    preload="auto"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight text-left">
                                Gestão desportiva
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                                    de elite
                                </span>
                            </h2>
                        </div>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            Visão macro do seu clube: finanças, staff, equipas,
                            atletas, jogos, comunicação — tudo centralizado numa
                            plataforma construída para quem lidera.
                        </p>
                    </div>

                    {/* Direita: cards de funcionalidades — sobem com progress */}
                    <div className="flex-1 min-w-0 overflow-hidden h-full">
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-5 will-change-transform py-16"
                            style={{
                                transform: `translateY(calc(70vh - ${cardsTranslateY}vh))`,
                            }}
                        >
                            {features.map((feature, i) => (
                                <FeatureCard
                                    key={feature.title}
                                    feature={feature}
                                    index={i}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
