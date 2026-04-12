// Esqueleto de carregamento para secção staff (treinador).
export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Cabeçalho */}
            <div className="space-y-2">
                <div className="h-7 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-44 rounded bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-800 last:border-0"
                    >
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>
        </div>
    );
}
