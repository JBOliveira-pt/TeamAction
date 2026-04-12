// Secção mosaico: zoom scroll-driven sobre grelha de fotos com vídeo central.
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";

export function MosaicoSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const gradientTopRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const video = videoRef.current;
        const content = contentRef.current;
        const gradientTop = gradientTopRef.current;
        const logo = logoRef.current;
        if (!section || !video || !content) return;

        let rafId: number;
        let isPlaying = false;

        const update = () => {
            const rect = section.getBoundingClientRect();
            const scrollableDistance =
                section.offsetHeight - window.innerHeight;
            if (scrollableDistance <= 0) return;

            const scrolled = Math.max(0, -rect.top);
            const progress = Math.min(1, scrolled / scrollableDistance);

            /* ── Fases ──────────────────────────────────────────────
             *  0.00 → 0.05  Mosaico estático (breve pausa)
             *  0.05 → 0.80  Vídeo toca, zoom cresce (easeInOut)
             *  0.80 → 1.00  Zoom completo, vídeo continua (hold)
             * ───────────────────────────────────────────────────── */
            const ZOOM_START = 0.05;
            const ZOOM_END = 0.6;
            const zoomT = Math.max(
                0,
                Math.min(1, (progress - ZOOM_START) / (ZOOM_END - ZOOM_START)),
            );

            // easeInOutCubic para um zoom suave
            const eased =
                zoomT < 0.5
                    ? 4 * zoomT * zoomT * zoomT
                    : 1 - Math.pow(-2 * zoomT + 2, 3) / 2;

            const MAX_SCALE = 2;
            const scale = 1 + eased * (MAX_SCALE - 1);

            content.style.transform = `scale(${scale})`;

            // Desaparecer o degradê conforme o zoom avança
            if (gradientTop) {
                gradientTop.style.opacity = `${1 - zoomT}`;
            }

            // Logo aparece suavemente no final (progress 0.75 → 0.92)
            if (logo) {
                const LOGO_START = 0.75;
                const LOGO_END = 0.92;
                const logoT = Math.max(
                    0,
                    Math.min(
                        1,
                        (progress - LOGO_START) / (LOGO_END - LOGO_START),
                    ),
                );
                logo.style.opacity = `${logoT}`;
            }

            // Iniciar / pausar vídeo
            if (zoomT > 0.02 && !isPlaying) {
                video.play().catch(() => {});
                isPlaying = true;
            } else if (zoomT <= 0 && isPlaying) {
                video.pause();
                video.currentTime = 0;
                isPlaying = false;
            }
        };

        const handleScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(update);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        update(); // posição inicial

        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative z-10"
            style={{ height: "800vh" }}
        >
            <div className="sticky top-0 z-10 h-screen w-full overflow-hidden flex items-center justify-center bg-slate-900">
                {/* Degradê topo: branco → transparente */}
                <div
                    ref={gradientTopRef}
                    className="absolute top-0 left-0 right-0 h-32 z-20 pointer-events-none bg-gradient-to-b from-slate-50/100 via-slate-50/70 via-slate-50/40 via-slate-50/10 to-transparent"
                    style={{ transition: "opacity 0.1s ease-out" }}
                />

                <div
                    ref={contentRef}
                    className="relative w-full h-full"
                    style={{
                        transformOrigin: "47% 80%",
                        willChange: "transform",
                    }}
                >
                    {/* Imagem do mosaico */}
                    <Image
                        src={ASSETS.mosaicoFotos}
                        alt="Mosaico TeamAction"
                        fill
                        className="object-cover select-none"
                        draggable={false}
                        unoptimized
                    />

                    {/* Vídeo sobreposto no tile central (linha 2, coluna 2) */}
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        loop
                        className="absolute object-cover"
                        style={{
                            /* ── Posição do tile central (linha 2, coluna 2) ── */
                            left: "50%",
                            top: "50%",
                            width: "50%",
                            height: "62%",
                            transform: "translate(-53%, -32%)",
                            borderRadius: "8px",
                        }}
                    >
                        <source src={ASSETS.mosaicoVideo} type="video/mp4" />
                    </video>
                </div>

                {/* Logo surge no centro sobre o vídeo */}
                <Image
                    ref={logoRef}
                    src={ASSETS.logoFullWhiteNoBgShadow}
                    alt="TeamAction"
                    width={320}
                    height={77}
                    className="absolute z-30 pointer-events-none select-none"
                    style={{
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        maxWidth: "500px",
                        width: "40%",
                        opacity: 0,
                    }}
                    draggable={false}
                />
            </div>
        </section>
    );
}
