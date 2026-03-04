"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const organizationName = formData.get("organizationName") as string;

        try {
            const response = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ organizationName }),
            });

            const data = await response.json();

            if (response.ok && data.redirect) {
                router.push(data.redirect);
            } else {
                setError(data.error || "Erro ao criar organização");
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erro ao criar organização"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome da Organização
                </label>
                <input
                    type="text"
                    name="organizationName"
                    required
                    disabled={isLoading}
                    placeholder="Ex: Minha Empresa"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                />
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Criando..." : "Criar Organização"}
            </button>

            <p className="text-xs text-gray-500 text-center">
                Você poderá convidar outros usuários após criar sua organização
            </p>
        </form>
    );
}
