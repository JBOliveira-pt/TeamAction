"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ClerkProvider
            signInUrl="/login"
            signUpUrl="/signup"
            signInFallbackRedirectUrl="/signup"
            signUpFallbackRedirectUrl="/dashboard"
        >
            {children}
        </ClerkProvider>
    );
}
