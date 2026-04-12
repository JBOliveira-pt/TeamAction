// Tagline animada com scroll: texto progressivo e vídeo de bola em queda.
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

const lines: ReactNode[] = [
    <>Gerencia o teu clube</>,
    <>Coordena a tua equipa</>,
    <>Agenda jogos e treinos</>,
    <>Analisa o desempenho de teus atletas</>,
    <>Tudo em uma plataforma simples e intuitiva</>,
];

function getLineReveal(
    progress: number,
    lineIndex: number,
    totalLines: number,
) {
    const stagger = 0.1;
    const isLast = lineIndex === totalLines - 1;
    const extraDelay = isLast ? 0.15 : 0;
    const offset = lineIndex * stagger + extraDelay;
    const p = progress - offset;

    const revealStart = 0.0;
    const revealEnd = 0.1;

    if (p < revealStart) return 0;
    if (p > revealEnd) return 1;
    return (p - revealStart) / (revealEnd - revealStart);
}

function CheckDrawn({ visible }: { visible: boolean }) {
    return (
        <span
            className="inline-flex items-center flex-shrink-0"
            style={{
                opacity: visible ? 1 : 0,
                transition: "opacity 0.15s ease",
            }}
        >
            <Check
                className="w-8 h-8 text-green-500"
                strokeWidth={3}
                style={{
                    strokeDasharray: 50,
                    strokeDashoffset: visible ? 0 : 50,
                    transition: "stroke-dashoffset 0.5s ease-out",
                }}
            />
        </span>
    );
}

export function ScrollTagline() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const [ballCenter, setBallCenter] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const onScroll = () => {
            const rect = wrapper.getBoundingClientRect();
            const vh = window.innerHeight;

            // A distância total conta desde que o topo entra no fundo (vh)
            // até que o wrapper termine o seu percurso.
            const totalDistance = rect.height * 0.5;

            const startOffset = vh * 0.1;
            const traveled = vh - rect.top - startOffset;

            const raw = traveled / totalDistance;
            setProgress(Math.max(0, Math.min(2, raw)));

            // Rastrear centro da bola relativo à secção sticky
            const section = sectionRef.current;
            const video = videoRef.current;
            if (section && video) {
                const sRect = section.getBoundingClientRect();
                const vRect = video.getBoundingClientRect();
                setBallCenter({
                    x: vRect.left + vRect.width / 2 - sRect.left,
                    y: vRect.top + vRect.height / 2 - sRect.top,
                });
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Vídeo começa alinhado com a primeira linha e desce com o scroll
    const ballProgress = Math.max(0, (progress - 0.15) / 0.85);
    const videoTranslateY = ballProgress * 120;

    return (
        // Wrapper alto cria a pista de scroll; o conteúdo fica sticky dentro
        <div ref={wrapperRef} className="relative" style={{ height: "1000vh" }}>
            <section
                ref={sectionRef}
                className="sticky top-0 h-screen bg-white overflow-hidden flex items-center"
            >
                <div className="w-full max-w-[45vw] pl-8 sm:pl-12 md:pl-40">
                    {lines.map((line, i) => {
                        const t = getLineReveal(progress, i, lines.length);
                        const eased =
                            t < 0.5
                                ? 4 * t * t * t
                                : 1 - Math.pow(-2 * t + 2, 3) / 2;

                        const isLastLine = i === lines.length - 1;
                        const showCheck = !isLastLine && eased > 0.99;

                        return (
                            <div
                                key={i}
                                className={`flex items-center overflow-hidden gap-2 ${isLastLine ? "pt-[3rem]" : "pt-[1.5rem]"}`}
                            >
                                {!isLastLine && (
                                    <CheckDrawn visible={showCheck} />
                                )}
                                <p
                                    className="text-5xl md:text-5xl font-extrabold tracking-[0rem] leading-[1.01] text-slate-900 will-change-transform drop-shadow-[0_4px_24px_rgba(15,23,42,0.12)]"
                                    style={{
                                        opacity: eased,
                                        transform: `translateY(${100 * (1 - eased)}%)`,
                                        fontVariant: "small-caps",
                                    }}
                                >
                                    {line}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Degradê radial — segue o centro da bola */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        background: `radial-gradient(circle 700px at ${ballCenter.x}px ${ballCenter.y}px, rgba(255, 255, 255, 0.75) 99%, rgba(255,255,255,0) 100%)`,
                    }}
                />

                {/* Vídeo da bola em queda no lado direito */}
                <div
                    ref={videoRef}
                    className="absolute right-30 w-[100vw] max-w-[500px] aspect-square pointer-events-none will-change-transform z-20"
                    style={{
                        top: "-60%",
                        transform: `translateY(${videoTranslateY * 1.2}vh)`,
                    }}
                >
                    <video
                        src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-videos/bola-andebol-mov.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover mix-blend-mode multiply opacity-90"
                    />
                </div>
            </section>
        </div>
    );
}
