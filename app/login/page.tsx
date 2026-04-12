// Página de login.
"use client";

import LoginView from "./_components/login-form";
import RegisterView from "./_components/submit-form";
import { useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ASSETS } from "@/app/lib/assets";

function LoginPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { isLoaded } = useAuth();

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

    // Sincroniza com mudanças na URL (sem useEffect)
    const [prevSearchStr, setPrevSearchStr] = useState(searchParams.toString());
    const currentSearchStr = searchParams.toString();
    if (currentSearchStr !== prevSearchStr) {
        setPrevSearchStr(currentSearchStr);
        const view = searchParams.get("view");
        if (view === "register" && currentView !== "register") {
            setCurrentView("register");
        } else if ((view === "login" || !view) && currentView !== "login") {
            setCurrentView("login");
        }
    }

    // Mostrar loading enquanto verifica autenticação
    if (!isLoaded) {
        return (
            <main
                className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('${ASSETS.loginBackground}')`,
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
                backgroundImage: `url('${ASSETS.loginBackground}')`,
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
                        backgroundImage: `url('${ASSETS.loginBackground}')`,
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
