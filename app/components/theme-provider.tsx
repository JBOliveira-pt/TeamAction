"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Inicializa lendo do localStorage ou padrão light
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("theme") as Theme | null;
            return savedTheme || "light";
        }
        return "light";
    });

    const setTheme = (newTheme: Theme) => {
        const root = document.documentElement;

        // Remove ambas as classes primeiro
        root.classList.remove("dark", "light");

        // Adiciona a classe apropriada
        if (newTheme === "dark") {
            root.classList.add("dark");
        }

        // Salva no localStorage
        localStorage.setItem("theme", newTheme);

        // Atualiza o estado
        setThemeState(newTheme);
    };

    useEffect(() => {
        // Aplica o tema inicial
        const root = document.documentElement;
        root.classList.remove("dark", "light");
        if (theme === "dark") {
            root.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
