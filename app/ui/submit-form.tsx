import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const RegisterView = ({ setView }: { setView: (v: "login") => void }) => (
    <div className="w-full max-w-md">
        <Link
            href="https://primeflow-landing.vercel.app"
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
            <ArrowLeft
                size={20}
                className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar para o início
        </Link>

        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
                <div className="w-18 h-18 flex items-center justify-center mx-auto">
                    <Image
                        src="https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/primeflow-whiteroundlogo-nobg.png"
                        width={80}
                        height={80}
                        alt="PrimeFlow Logo"
                    />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                    Crie sua conta
                </h3>
                <p className="text-slate-400 text-sm">Texto</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Nome Completo
                    </label>
                    <div className="relative">
                        <User
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Seu Nome"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        E-mail Corporativo
                    </label>
                    <div className="relative">
                        <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            size={18}
                        />
                        <input
                            type="email"
                            placeholder="nome@empresa.com"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Senha
                    </label>
                    <div className="relative">
                        <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            size={18}
                        />
                        <input
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                    <input
                        type="checkbox"
                        required
                        className="mt-1 rounded border-slate-700 bg-slate-800 text-indigo-600"
                    />
                    <label className="text-xs text-slate-500">
                        Concordo com os{" "}
                        <a href="#" className="text-indigo-400">
                            Termos
                        </a>{" "}
                        e a{" "}
                        <a href="#" className="text-indigo-400">
                            Política de Privacidade
                        </a>
                        .
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-lg"
                >
                    Criar Conta
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
                Já tem conta?{" "}
                <button
                    onClick={() => setView("login")}
                    className="text-indigo-400 font-bold hover:underline"
                >
                    Faça Login
                </button>
            </p>
        </div>
    </div>
);

export default RegisterView;
