import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Trophy,
    Users,
    Calendar,
    Layout,
    Github,
    ChevronRight,
    CheckCircle2,
    PlayCircle,
    Dumbbell,
    TrendingUp,
    Bell,
    Building2,
    BarChart3,
    ShieldCheck,
} from "lucide-react";
import { ASSETS } from "@/app/lib/assets";
import { LandingNavbar } from "@/app/components/landing-navbar";
import { ScrollTagline } from "@/app/components/scroll-tagline";

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
            {/* --- TREINADOR --- */}
            <section id="treinador" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Tudo que um treinador moderno precisa
                        </h2>
                        <p className="text-slate-500 mt-4 italic text-lg font-light">
                            &quot;Baseado em fluxos de trabalho profissionais de
                            alto nível, mas com a simplicidade que você
                            merece.&quot;
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Planejador de Treinos
                            </h3>
                            <p className="text-slate-600">
                                Crie sessões de treino complexas em minutos.
                                Organize exercícios por categorias, tempo e
                                intensidade.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Gestão de Elenco
                            </h3>
                            <p className="text-slate-600">
                                Acompanhe a presença, o status de saúde e a
                                evolução técnica de cada atleta individualmente.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <Layout className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Quadro Tático Digital
                            </h3>
                            <p className="text-slate-600">
                                Visualize jogadas ensaiadas e posicionamentos
                                defensivos com nossa ferramenta de desenho
                                integrada.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ATLETA --- */}
            <section id="atleta" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            O Atleta no centro do jogo
                        </h2>
                        <p className="text-slate-500 mt-4 italic text-lg font-light">
                            &quot;Acompanhe sua evolução, receba feedbacks e
                            esteja sempre pronto para o próximo desafio.&quot;
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 - Atleta */}
                        <div className="p-8 rounded-2xl border border-white bg-white shadow-sm hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Evolução de Performance
                            </h3>
                            <p className="text-slate-600">
                                Visualize seu progresso técnico e físico através
                                de gráficos claros e metas personalizadas pela
                                comissão técnica.
                            </p>
                        </div>

                        {/* Feature 2 - Atleta */}
                        <div className="p-8 rounded-2xl border border-white bg-white shadow-sm hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <Bell className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Agenda & Convocações
                            </h3>
                            <p className="text-slate-600">
                                Receba notificações em tempo real sobre horários
                                de treinos, jogos e mudanças na programação do
                                time.
                            </p>
                        </div>

                        {/* Feature 3 - Atleta */}
                        <div className="p-8 rounded-2xl border border-white bg-white shadow-sm hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <Dumbbell className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Auto-Avaliação & Saúde
                            </h3>
                            <p className="text-slate-600">
                                Relate seu nível de cansaço, dores ou lesões
                                diretamente pelo app, permitindo um cuidado
                                preventivo da equipe.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CLUBE / PRESIDENTE --- */}
            <section id="clube" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Gestão Institucional de Elite
                        </h2>
                        <p className="text-slate-500 mt-4 italic text-lg font-light">
                            &quot;Visão macro do seu clube: finanças, categorias
                            de base e infraestrutura em um só lugar.&quot;
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 - Clube */}
                        <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Múltiplas Categorias
                            </h3>
                            <p className="text-slate-600">
                                Gerencie desde o Sub-11 até o Profissional.
                                Centralize todos os departamentos do clube sob
                                uma única bandeira.
                            </p>
                        </div>

                        {/* Feature 2 - Clube */}
                        <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Dashboard Financeiro
                            </h3>
                            <p className="text-slate-600">
                                Controle mensalidades, patrocínios e custos
                                operacionais com relatórios exportáveis para sua
                                contabilidade.
                            </p>
                        </div>

                        {/* Feature 3 - Clube */}
                        <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition group">
                            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Base de Dados de Talentos
                            </h3>
                            <p className="text-slate-600">
                                Mantenha um histórico vitalício de atletas que
                                passaram pelo clube, protegendo seu patrimônio e
                                histórico esportivo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

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
