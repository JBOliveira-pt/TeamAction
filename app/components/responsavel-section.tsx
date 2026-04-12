// Secção Responsável: vídeo scrub e cards de funcionalidades do responsável.
"use client";

import { useEffect, useRef, useState } from "react";
import {
    UserCheck,
    CalendarDays,
    Bell,
    Dumbbell,
    Heart,
    Trophy,
    ShieldCheck,
    CreditCard,
    Megaphone,
    ImageIcon,
} from "lucide-react";

const features = [
    {
        icon: CalendarDays,
        title: "Agenda do Jovem Atleta",
        description:
            "Consulte todos os treinos, jogos e eventos do seu jovem atleta num calendário unificado e sempre atualizado.",
        color: "from-amber-500 to-amber-600",
        bgLight: "bg-amber-50",
        iconColor: "text-amber-600",
    },
    {
        icon: Trophy,
        title: "Jogos & Resultados",
        description:
            "Acompanhe os jogos, resultados e o desempenho do seu jovem atleta ao longo da temporada.",
        color: "from-orange-500 to-orange-600",
        bgLight: "bg-orange-50",
        iconColor: "text-orange-600",
    },
    {
        icon: Dumbbell,
        title: "Condição Física",
        description:
            "Visualize os resultados das avaliações físicas e acompanhe a evolução do seu jovem atleta.",
        color: "from-emerald-500 to-emerald-600",
        bgLight: "bg-emerald-50",
        iconColor: "text-emerald-600",
    },
    {
        icon: Heart,
        title: "Informação Médica",
        description:
            "Aceda ao histórico médico e registos de saúde do seu jovem atleta de forma segura e centralizada.",
        color: "from-rose-500 to-rose-600",
        bgLight: "bg-rose-50",
        iconColor: "text-rose-600",
    },
    {
        icon: ShieldCheck,
        title: "Autorizações",
        description:
            "Gerencie pedidos de autorização federativa e outras solicitações que necessitem da sua aprovação para o seu jovem atleta.",
        color: "from-violet-500 to-violet-600",
        bgLight: "bg-violet-50",
        iconColor: "text-violet-600",
    },
    {
        icon: CreditCard,
        title: "Mensalidades",
        description:
            "Consulte o estado de pagamentos e mensalidades do seu jovem atleta. Saiba sempre o que está em dia.",
        color: "from-cyan-500 to-cyan-600",
        bgLight: "bg-cyan-50",
        iconColor: "text-cyan-600",
    },
    {
        icon: Megaphone,
        title: "Comunicados do Clube",
        description:
            "Receba os comunicados e avisos do clube dirigidos aos responsáveis. Nunca perca uma informação importante sobre o seu jovem atleta.",
        color: "from-pink-500 to-pink-600",
        bgLight: "bg-pink-50",
        iconColor: "text-pink-600",
    },
    {
        icon: Bell,
        title: "Notificações",
        description:
            "Alertas automáticos sobre convites, alterações de horário, pagamentos e atualizações relevantes para o seu jovem atleta.",
        color: "from-blue-500 to-blue-600",
        bgLight: "bg-blue-50",
        iconColor: "text-blue-600",
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

export function ResponsavelSection() {
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
            id="responsavel"
            className="relative"
            style={{ height: "400vh" }}
        >
            <section className="sticky top-0 h-screen bg-slate-50 overflow-hidden">
                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-row-reverse gap-10 items-stretch h-full">
                    {/* DIREITA: painel cabeçalho */}
                    <div className="flex-shrink-0 w-[38%] min-w-[320px] max-w-[440px] flex flex-col justify-center py-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-500 text-sm font-semibold mb-6 w-fit">
                            <UserCheck className="h-4 w-4" />
                            Responsável
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-videos/responsavel-scrub-small.mp4"
                                    muted
                                    playsInline
                                    preload="auto"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight text-left">
                                Sempre
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
                                    presente
                                </span>
                            </h2>
                        </div>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            Acompanhe a atividade, saúde, agenda e pagamentos de
                            seu jovem atleta. Tudo acessível numa única
                            plataforma pensada para quem cuida.
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
