"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

const lines = [
    "Gerencia o teu clube",
    "coordena a tua equipa",
    "agende jogos e treinos",
    "analise o desempenho de teus atletas",
    "tudo em uma plataforma simples e intuitiva",
];

function getLineReveal(progress: number, lineIndex: number) {
    const stagger = 0.1;
    const offset = lineIndex * stagger;
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
                className="w-8 h-8 text-gray-800"
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
            const totalDistance = rect.height;

            const startOffset = vh * 0.1;
            const traveled = vh - rect.top - startOffset;

            const raw = traveled / totalDistance;
            setProgress(Math.max(0, Math.min(1, raw)));

            // Track ball center relative to the sticky section
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

    // Video starts aligned with the first line (top of content area)
    // and translates down as scroll progresses, exiting through the bottom
    // Ball appears later (starts at 15% progress) and moves slower
    const ballProgress = Math.max(0, (progress - 0.15) / 0.85);
    const videoTranslateY = ballProgress * 130; // percentage of viewport height

    return (
        // Tall wrapper creates the scroll runway; content sticks inside it
        <div ref={wrapperRef} className="relative" style={{ height: "400vh" }}>
            <section
                ref={sectionRef}
                className="sticky top-0 h-screen bg-white overflow-hidden flex items-center"
            >
                <div className="w-full max-w-[60vw] pl-8 sm:pl-12 md:pl-20">
                    {lines.map((line, i) => {
                        const t = getLineReveal(progress, i);
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
                                    className="text-5xl md:text-5xl font-extrabold uppercase tracking-[0.1rem] leading-[1.15] text-slate-900 will-change-transform"
                                    style={{
                                        opacity: eased,
                                        transform: `translateY(${100 * (1 - eased)}%)`,
                                    }}
                                >
                                    {line}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Radial fade overlay – follows ball center */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        background: `radial-gradient(circle 1000px at ${ballCenter.x}px ${ballCenter.y}px, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0) 70%)`,
                    }}
                />

                {/* Falling ball video on the right side */}
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
