"use client";

import LoginView from "../ui/login-form";
import RegisterView from "../ui/submit-form";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

function LoginPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { isSignedIn, isLoaded } = useAuth();

    const initialView =
        searchParams.get("view") === "register" ? "register" : "login";
    const [currentView, setCurrentView] = useState<"login" | "register">(
        initialView,
    );

    // Função que atualiza o estado E a URL
    const handleSetView = useCallback(
        (view: "login" | "register") => {
            setCurrentView(view);
            // Atualiza a URL sem recarregar a página
            const params = new URLSearchParams(searchParams.toString());
            params.set("view", view);
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            });
        },
        [searchParams, router, pathname],
    );

    // Sincroniza com mudanças na URL
    useEffect(() => {
        const view = searchParams.get("view");
        if (view === "register" && currentView !== "register") {
            setCurrentView("register");
        } else if ((view === "login" || !view) && currentView !== "login") {
            setCurrentView("login");
        }
    }, [searchParams, currentView]);

    // Mostrar loading enquanto verifica autenticação
    if (!isLoaded) {
        return (
            <main
                className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
                }}
            >
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Carregando...</p>
                </div>
            </main>
        );
    }

    return (
        <main
            className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage:
                    "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
            }}
        >
            {currentView === "login" && <LoginView setView={handleSetView} />}
            {currentView === "register" && (
                <RegisterView setView={handleSetView} />
            )}
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <main
                    className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
                    }}
                >
                    <div className="text-white">Carregando...</div>
                </main>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}
