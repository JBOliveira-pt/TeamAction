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
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
        >
            {children}
        </ClerkProvider>
    );
}
