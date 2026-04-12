// Componente login form.
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";
import { useAuth, useClerk } from "@clerk/nextjs";

const LoginContent = ({ setView }: { setView: (v: "register") => void }) => {
    const searchParams = useSearchParams();
    const { isSignedIn } = useAuth();
    const { openSignIn, signOut } = useClerk();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    const handleOpenSignIn = async () => {
        if (isSignedIn) {
            await signOut();
        }

        await openSignIn({
            withSignUp: false,
            forceRedirectUrl: callbackUrl,
            fallbackRedirectUrl: callbackUrl,
            appearance: {
                elements: {
                    footerAction: {
                        display: "none",
                    },
                    footerActionText: {
                        display: "none",
                    },
                    footerActionLink: {
                        display: "none",
                    },
                },
            },
        });
    };

    return (
        <div className="w-full max-w-md">
            <Link
                href="/"
                className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <ArrowLeft
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                />
                Voltar para o início
            </Link>

            <div className="w-full rounded-3xl border border-blue-200/20 bg-slate-950/60 p-8 shadow-[0_24px_64px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl backdrop-saturate-150">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-blue-200/30 bg-slate-950/70 shadow-[0_10px_30px_rgba(15,23,42,0.65)]">
                        <Image
                            src={ASSETS.logoWhite}
                            width={80}
                            height={80}
                            alt="TeamAction Logo"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Login
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Entre na sua conta corporativa Team
                        <span className="font-bold">Action</span>
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-slate-400 text-sm text-center">
                        Autenticação via Clerk
                    </p>

                    {isSignedIn ? (
                        <>
                            <p className="text-center text-xs text-amber-300">
                                Sessão ativa detectada.
                            </p>
                            <Link
                                href={callbackUrl}
                                className="block w-full rounded-xl bg-blue-600 py-3.5 text-center text-lg font-bold text-white shadow-lg shadow-blue-700/40 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
                            >
                                Retornar à Sessão
                            </Link>
                            <button
                                type="button"
                                onClick={handleOpenSignIn}
                                className="w-full rounded-xl border border-amber-500/60 bg-transparent py-3.5 text-lg font-bold text-amber-400 transition-all hover:-translate-y-0.5 hover:bg-amber-500/10"
                            >
                                Trocar de Conta
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleOpenSignIn}
                            className="w-full rounded-xl bg-blue-600 py-3.5 text-lg font-bold text-white shadow-lg shadow-blue-700/40 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
                        >
                            Entrar
                        </button>
                    )}
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
