"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SignInButton } from "@clerk/nextjs";

const LoginContent = ({ setView }: { setView: (v: "register") => void }) => {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    return (
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
                    <div className="flex items-center justify-center mx-auto mb-4">
                        <Image
                            src="https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/primeflow-whiteroundlogo-nobg.png"
                            width={70}
                            height={50}
                            alt="PrimeFlow Logo"
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Login
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Entre na sua conta corporativa Prime
                        <span className="font-bold">Flow</span>
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-slate-400 text-sm text-center">
                        Autenticação via Clerk
                    </p>
                    <SignInButton mode="modal" forceRedirectUrl={callbackUrl}>
                        <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-lg">
                            Entrar
                        </button>
                    </SignInButton>
                </div>

                <p className="text-center text-sm text-slate-500">
                    Não tem conta?{" "}
                    <Link
                        href="/signup"
                        className="text-indigo-400 hover:underline"
                    >
                        Registre-se gratuitamente
                    </Link>
                </p>
            </div>
        </div>
    );
};

const LoginView = (props: { setView: (v: "register") => void }) => {
    return (
        <Suspense
            fallback={
                <div className="text-white text-center p-4">Carregando...</div>
            }
        >
            <LoginContent {...props} />
        </Suspense>
    );
};

export default LoginView;
