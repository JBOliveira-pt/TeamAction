// Secção Treinador: vídeo scrub e cards de funcionalidades do treinador.
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    CalendarDays,
    ClipboardList,
    Dumbbell,
    Gamepad2,
    BarChart3,
    BookOpen,
    Users,
    Bell,
    Salad,
} from "lucide-react";

const R2_BASE = process.env.NEXT_PUBLIC_R2_IMAGES_URL;

const features = [
    {
        icon: CalendarDays,
        title: "Planejador de Sessões",
        description:
            "Crie sessões de treino completas em minutos. Defina tipo, duração, intensidade e exercícios. Tudo organizado por data.",
        color: "from-emerald-500 to-emerald-600",
        bgLight: "bg-emerald-50",
        iconColor: "text-emerald-600",
        image: `${R2_BASE}/Treinador-PlanejadorDeSessoes.png`,
    },
    {
        icon: BookOpen,
        title: "Biblioteca de Exercícios",
        description:
            "Monte e organize a sua própria biblioteca de exercícios. Categorize, edite e reutilize nos planos de treino.",
        color: "from-blue-500 to-blue-600",
        bgLight: "bg-blue-50",
        iconColor: "text-blue-600",
        image: `${R2_BASE}/Treinador-BibliotecaDeExercicios.png`,
    },
    {
        icon: Users,
        title: "Gestão de Elenco",
        description:
            "Acompanhe a presença, assiduidade e o estado de cada atleta. Convoque jogadores e controle a staff técnica.",
        color: "from-indigo-500 to-indigo-600",
        bgLight: "bg-indigo-50",
        iconColor: "text-indigo-600",
        image: `${R2_BASE}/Treinador-GestaoDeElenco.png`,
    },
    {
        icon: Gamepad2,
        title: "Quadro Tático Digital",
        description:
            "Desenhe jogadas, posicionamentos e formações. Salve e organize na sua biblioteca tática para consulta rápida.",
        color: "from-violet-500 to-violet-600",
        bgLight: "bg-violet-50",
        iconColor: "text-violet-600",
        image: `${R2_BASE}/Treinador-QuadroTaticoDigital.png`,
    },
    {
        icon: BarChart3,
        title: "Estatísticas ao Vivo",
        description:
            "Registe eventos em tempo real durante os jogos. Acompanhe métricas individuais e coletivas no momento.",
        color: "from-orange-500 to-orange-600",
        bgLight: "bg-orange-50",
        iconColor: "text-orange-600",
        image: `${R2_BASE}/Treinador-EstatisticasaoVivo.png`,
    },
    {
        icon: Dumbbell,
        title: "Avaliações Físicas",
        description:
            "Registe e acompanhe testes físicos dos atletas. Visualize a evolução e identifique pontos a melhorar.",
        color: "from-rose-500 to-rose-600",
        bgLight: "bg-rose-50",
        iconColor: "text-rose-600",
        image: `${R2_BASE}/Treinador-AvaliacoesFisicas.png`,
    },
    {
        icon: Salad,
        title: "Planos de Nutrição",
        description:
            "Crie e atribua planos nutricionais personalizados. Apoie a performance dos atletas dentro e fora do campo.",
        color: "from-amber-500 to-amber-600",
        bgLight: "bg-amber-50",
        iconColor: "text-amber-600",
        image: `${R2_BASE}/Treinador-PlanosdeNutricao.png`,
    },
    {
        icon: Bell,
        title: "Notificações & Convocatórias",
        description:
            "Envie convocatórias para jogos e treinos. Receba alertas automáticos sobre atualizações da equipa.",
        color: "from-cyan-500 to-cyan-600",
        bgLight: "bg-cyan-50",
        iconColor: "text-cyan-600",
        image: `${R2_BASE}/Treinador-NotificacoeseConvocatorias.png`,
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
            className="group relative rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(40px)",
                transitionDelay: `${index * 80}ms`,
            }}
        >
            <div className={`h-1 w-full bg-gradient-to-r ${feature.color}`} />
            <div className="p-7 backdrop-blur-[2px] bg-white/80">
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
                {feature.image ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm">
                        <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                    </div>
                ) : (
                    <div className="relative w-full aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-300 group-hover:border-slate-300 transition-colors">
                        <span className="text-xs font-medium text-slate-400">
                            Em breve
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TreinadorSection() {
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

    const cardsTranslateY = progress * 260;

    return (
        <div
            ref={wrapperRef}
            id="treinador"
            className="relative"
            style={{ height: "400vh" }}
        >
            <section className="sticky top-0 h-screen bg-slate-50 overflow-hidden">
                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-row-reverse gap-10 items-stretch h-full">
                    {/* DIREITA: painel cabeçalho */}
                    <div className="flex-shrink-0 w-[38%] min-w-[320px] max-w-[440px] flex flex-col justify-center py-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-500 text-sm font-semibold mb-6 w-fit">
                            <ClipboardList className="h-4 w-4" />
                            Treinador
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-videos/treinador-scrub-small.mp4"
                                    muted
                                    playsInline
                                    preload="auto"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight text-left">
                                O treinador
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
                                    moderno
                                </span>
                            </h2>
                        </div>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            Planeie sessões, desenhe táticas, acompanhe a
                            evolução física e nutricional dos seus atletas. Tudo
                            com a simplicidade que merece.
                        </p>
                    </div>

                    {/* ESQUERDA: cards de funcionalidades — sobem */}
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
