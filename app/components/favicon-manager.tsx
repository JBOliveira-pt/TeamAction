"use client";

import { useEffect } from "react";

export function FaviconManager() {
    useEffect(() => {
        // Previne erros durante SSR
        if (typeof window === "undefined") return;

        // Função para atualizar o favicon baseado nas preferências do sistema
        const updateFavicon = (isDark: boolean) => {
            const faviconUrl = isDark
                ? "https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/favicon-white.ico"
                : "https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/favicon-black.ico";

            // Remove todos os links de favicon existentes
            const existingLinks =
                document.querySelectorAll("link[rel*='icon']");
            existingLinks.forEach((link) => link.remove());

            // Cria um novo link com timestamp para evitar cache
            const link = document.createElement("link");
            link.type = "image/x-icon";
            link.rel = "shortcut icon";
            link.href = `${faviconUrl}?v=${Date.now()}`;
            document.head.appendChild(link);

            console.log(
                `Favicon atualizado para: ${isDark ? "white" : "black"}`,
            );
        };

        // Detecta a preferência de cor do sistema
        const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

        // Aplica o favicon inicial baseado nas preferências do sistema
        updateFavicon(darkModeQuery.matches);

        // Listener para mudanças nas preferências do sistema
        const handleChange = (e: MediaQueryListEvent) => {
            updateFavicon(e.matches);
        };

        // Adiciona o listener (compatível com navegadores antigos e novos)
        if (darkModeQuery.addEventListener) {
            darkModeQuery.addEventListener("change", handleChange);
        } else {
            // Fallback para navegadores antigos
            darkModeQuery.addListener(handleChange);
        }

        // Cleanup
        return () => {
            if (darkModeQuery.removeEventListener) {
                darkModeQuery.removeEventListener("change", handleChange);
            } else {
                darkModeQuery.removeListener(handleChange);
            }
        };
    }, []); // Executa apenas uma vez no mount

    return null; // Componente não renderiza nada
}
