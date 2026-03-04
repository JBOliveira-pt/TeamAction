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
        <main className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
            <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Verificando email...</p>
                <p className="text-sm text-gray-400 mt-2">Redirecionando...</p>
            </div>
        </main>
    );
}
