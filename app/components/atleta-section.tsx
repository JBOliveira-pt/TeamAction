// Secção Atleta: vídeo scrub e cards de funcionalidades do atleta.
"use client";

import { useEffect, useRef, useState } from "react";
import {
    TrendingUp,
    CalendarDays,
    Bell,
    Dumbbell,
    Heart,
    Trophy,
    ShieldCheck,
    Volleyball,
    ImageIcon,
} from "lucide-react";

const features = [
    {
        icon: TrendingUp,
        title: "Evolução de Performance",
        description:
            "Visualize o seu progresso técnico e físico através de gráficos claros e metas definidas pela comissão técnica.",
        color: "from-blue-500 to-blue-600",
        bgLight: "bg-blue-50",
        iconColor: "text-blue-600",
    },
    {
        icon: CalendarDays,
        title: "Agenda & Calendário",
        description:
            "Consulte treinos, jogos e eventos num calendário pessoal. Nunca mais perca um compromisso da equipa.",
        color: "from-indigo-500 to-indigo-600",
        bgLight: "bg-indigo-50",
        iconColor: "text-indigo-600",
    },
    {
        icon: Bell,
        title: "Convocatórias em Tempo Real",
        description:
            "Receba notificações instantâneas sobre convocatórias, alterações de horário e comunicados da equipa.",
        color: "from-amber-500 to-amber-600",
        bgLight: "bg-amber-50",
        iconColor: "text-amber-600",
    },
    {
        icon: Dumbbell,
        title: "Avaliações Físicas",
        description:
            "Acompanhe os resultados dos seus testes físicos e veja a sua evolução ao longo da temporada.",
        color: "from-emerald-500 to-emerald-600",
        bgLight: "bg-emerald-50",
        iconColor: "text-emerald-600",
    },
    {
        icon: Heart,
        title: "Saúde & Bem-Estar",
        description:
            "Relate o seu nível de cansaço, dores ou lesões diretamente pelo app, permitindo um cuidado preventivo.",
        color: "from-rose-500 to-rose-600",
        bgLight: "bg-rose-50",
        iconColor: "text-rose-600",
    },
    {
        icon: Trophy,
        title: "Jogos & Estatísticas",
        description:
            "Consulte os seus números: golos, assistências, minutos jogados e o desempenho da equipa em cada jogo.",
        color: "from-orange-500 to-orange-600",
        bgLight: "bg-orange-50",
        iconColor: "text-orange-600",
    },
    {
        icon: ShieldCheck,
        title: "Autorizações Federativas",
        description:
            "Acompanhe o estado das suas autorizações junto da federação diretamente na plataforma.",
        color: "from-violet-500 to-violet-600",
        bgLight: "bg-violet-50",
        iconColor: "text-violet-600",
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
            { threshold: 0.15 },
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
                transform: visible ? "translateY(0)" : "translateY(40px)",
                transitionDelay: `${index * 80}ms`,
            }}
        >
            <div className={`h-1 w-full bg-gradient-to-r ${feature.color}`} />
            <div className="p-7">
                <div
                    className={`w-12 h-12 ${feature.bgLight} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                    {feature.description}
                </p>
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

export function AtletaSection() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);

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

    const cardsTranslateY = progress * 250;

    return (
        <div
            ref={wrapperRef}
            id="atleta"
            className="relative"
            style={{ height: "400vh" }}
        >
            <section className="sticky top-0 h-screen bg-white overflow-hidden">
                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-10 items-stretch h-full">
                    {/* ESQUERDA: painel cabeçalho */}
                    <div className="flex-shrink-0 w-[38%] min-w-[320px] max-w-[440px] flex flex-col justify-center py-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-500 text-sm font-semibold mb-6 w-fit">
                            <Volleyball className="h-4 w-4" />
                            Atleta
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-videos/atleta-scrub-small.mp4"
                                    muted
                                    playsInline
                                    preload="auto"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight text-left">
                                No centro
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700">
                                    do jogo
                                </span>
                            </h2>
                        </div>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            Acompanhe a sua evolução, receba convocatórias,
                            consulte estatísticas e esteja sempre pronto para o
                            próximo desafio.
                        </p>
                    </div>

                    {/* DIREITA: cards de funcionalidades — sobem */}
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
