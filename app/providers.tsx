// Providers globais: ClerkProvider (exceto admin) e ThemeProvider.
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const pathname = usePathname();

    // Admin usa autenticação própria — não carregar Clerk SDK no browser.
    if (pathname?.startsWith("/admin")) {
        return <>{children}</>;
    }

    return (
        <ClerkProvider
            signInUrl="/login"
            signUpUrl="/signup"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
        >
            {children}
        </ClerkProvider>
    );
}
