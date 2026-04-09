"use client";

export default function UtilizadorError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 gap-4">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Ocorreu um erro ao carregar o painel
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                {error.message || "Erro inesperado. Tente novamente."}
            </p>
            <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
                Tentar novamente
            </button>
        </div>
    );
}
