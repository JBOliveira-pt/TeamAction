// Rastreador de interações do utilizador (page views e cliques).
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

async function logInteraction(path: string, interactionType: string) {
    try {
        await fetch("/api/user-actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interactionType, path }),
        });
    } catch {
        // Ignorar erros de rastreamento
    }
}

export function UserInteractionTracker() {
    const pathname = usePathname();

    useEffect(() => {
        const key = `interaction_logged:${pathname}`;
        const hasLogged = sessionStorage.getItem(key);
        if (hasLogged) return;

        sessionStorage.setItem(key, "1");
        logInteraction(pathname, "page_view");
    }, [pathname]);

    return null;
}
