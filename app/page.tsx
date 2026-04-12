import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";
import { ASSETS } from "@/app/lib/assets";
import { LandingNavbar } from "@/app/components/landing-navbar";
import { ScrollTagline } from "@/app/components/scroll-tagline";
import { PresidenteSection } from "@/app/components/presidente-section";
import { TreinadorSection } from "@/app/components/treinador-section";
import { AtletaSection } from "@/app/components/atleta-section";
import { ResponsavelSection } from "@/app/components/responsavel-section";
import { PlanosSection } from "@/app/components/planos-section";
import { MosaicoSection } from "@/app/components/mosaico-section";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans scroll-smooth">
            {/* --- NAV BAR --- */}
            <LandingNavbar />

            {/* --- HERO SECTION --- */}
            <section className="relative h-screen w-full overflow-hidden">
                {/* Video background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                >
                    <source src={ASSETS.heroVideo} type="video/mp4" />
                </video>

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/10" />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                    <Image
                        src={ASSETS.logoFullWhiteNoBgShadow}
                        alt="TeamAction"
                        width={340}
                        height={82}
                        className="mb-8 h-auto w-auto max-w-[280px] md:max-w-[340px] drop-shadow-lg"
                        priority
                    />
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                        A gestão esportiva <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#27365D] to-blue-700">
                            levada a sério
                        </span>
                    </h1>
                    <p className="mt-6 text-xl text-white/85 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
                        Tenha hoje mesmo o futuro da gestão <br />
                        desportiva na palma de sua mão
                    </p>
                </div>
            </section>

            {/* --- TAGLINE SCROLL --- */}
            <ScrollTagline />

            {/* --- ROADMAP SECTION --- */}
            <section
                id="sobre"
                className="relative py-100 text-white"
                style={{
                    backgroundImage: `url('${ASSETS.loginBackground}')`,
                    backgroundAttachment: "fixed",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            ></section>

            {/* --- FEATURES --- */}

            {/* --- CLUBE / PRESIDENTE --- */}
            <PresidenteSection />

            {/* --- TREINADOR --- */}
            <TreinadorSection />

            {/* --- ATLETA --- */}
            <AtletaSection />

            {/* --- RESPONSÁVEL --- */}
            <ResponsavelSection />

            {/* --- MOSAICO --- */}
            <MosaicoSection />

            {/* --- PLANOS --- */}
            <PlanosSection />

            {/* --- FOOTER --- */}
            <footer className="py-12 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">TeamAction</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} TeamAction. Todos os
                        direitos reservados.
                    </p>
                    <div className="flex gap-6">
                        <a
                            href="https://github.com/JBOliveira-pt/TeamAction"
                            className="text-slate-400 hover:text-slate-900 transition"
                        >
                            <Github className="h-6 w-6" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
