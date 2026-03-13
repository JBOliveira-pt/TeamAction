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

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* --- NAV BAR --- */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <Image
                                src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-logofull-white.png"
                                alt="TeamAction"
                                width={190}
                                height={46}
                                className="dark:hidden h-auto w-auto max-w-[190px]"
                                priority
                            />
                        </div>
                        <div className="hidden md:flex space-x-8 font-medium">
                            <a
                                href="#recursos"
                                className="hover:text-blue-600 transition"
                            >
                                Recursos
                            </a>
                            <a
                                href="#sobre"
                                className="hover:text-blue-600 transition"
                            >
                                Sobre
                            </a>
                            <a
                                href="https://github.com/JBOliveira-pt/TeamAction"
                                target="_blank"
                                className="flex items-center gap-1 hover:text-blue-600 transition"
                            >
                                <Github className="h-4 w-4" /> GitHub
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="px-5 py-2 rounded-full font-semibold hover:text-blue-700 transition"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="mt-8 text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
                        A gestão esportiva <br />
                        <span className="text-blue-600 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                            levada a sério
                        </span>
                    </h1>
                    <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Planeje treinos, gerencie sua equipa e analise o
                        desempenho dos seus atletas em uma única plataforma,
                        simples e intuitiva. Tenha hoje mesmo o futuro da gestão
                        desportiva na palma de sua mão.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://github.com/JBOliveira-pt/TeamAction"
                            target="_blank"
                            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition"
                        >
                            Ver no GitHub <Github className="h-5 w-5" />
                        </a>
                        <button className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 px-8 py-4 rounded-xl font-bold hover:border-blue-400 transition">
                            Demo em breve <PlayCircle className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mockup Preview */}
                    <div className="mt-16 relative mx-auto max-w-5xl">
                        <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-400 rounded-2xl shadow-2xl border-8 border-white overflow-hidden flex items-center justify-center">
                            <Layout className="h-20 w-20 text-white/50" />
                            <p className="absolute bottom-4 right-4 text-white font-mono text-sm bg-black/20 px-3 py-1 rounded">
                                Visualização do Dashboard (WIP)
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES --- */}
            {/* --- TREINADOR --- */}
            <section id="recursos" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Tudo que um treinador moderno precisa
                        </h2>
                        <p className="text-slate-500 mt-4 italic text-lg font-light">
                            "Baseado em fluxos de trabalho profissionais de alto
                            nível, mas com a simplicidade que você merece."
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
                            "Acompanhe sua evolução, receba feedbacks e esteja
                            sempre pronto para o próximo desafio."
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
                            "Visão macro do seu clube: finanças, categorias de
                            base e infraestrutura em um só lugar."
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

            {/* --- ROADMAP SECTION --- */}
            <section id="sobre" className="py-24 bg-slate-900 text-white">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        Status do Desenvolvimento
                    </h2>
                    <div className="space-y-6">
                        {[
                            {
                                task: "Arquitetura Next.js 14 & Tailwind Setup",
                                done: true,
                            },
                            { task: "Sistema de Autenticação", done: true },
                            {
                                task: "Módulo de Gerenciamento de Atletas",
                                done: false,
                            },
                            {
                                task: "Biblioteca de Exercícios (CRUD)",
                                done: false,
                            },
                            { task: "Dashboard de Performance", done: false },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700"
                            >
                                {item.done ? (
                                    <CheckCircle2 className="text-green-400 h-6 w-6 shrink-0" />
                                ) : (
                                    <div className="h-6 w-6 border-2 border-slate-500 rounded-full shrink-0" />
                                )}
                                <span
                                    className={
                                        item.done
                                            ? "text-slate-300 line-through"
                                            : "text-white"
                                    }
                                >
                                    {item.task}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <p className="text-slate-400 mb-6">
                            Quer contribuir com o código?
                        </p>
                        <a
                            href="https://github.com/JBOliveira-pt/TeamAction"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold"
                        >
                            Fork no GitHub <ChevronRight className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-blue-600" />
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
