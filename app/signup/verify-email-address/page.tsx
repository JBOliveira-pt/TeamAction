"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function VerifyEmailPage() {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();

    useEffect(() => {
        if (isLoaded) {
            // Redireciona para dashboard se estiver logado, senão para signup
            const destination = isSignedIn ? "/dashboard" : "/signup";
            router.push(destination);
        }
    }, [isLoaded, isSignedIn, router]);

    return (
        <main
            className="flex min-h-screen items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage:
                    "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
            }}
        >
            <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Verificando email...</p>
                <p className="text-sm text-gray-400 mt-2">Redirecionando...</p>
            </div>
        </main>
    );
}
