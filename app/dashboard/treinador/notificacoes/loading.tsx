// Esqueleto de carregamento para secção notificacoes (treinador).
export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-44 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Cards de notificação */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-900 rounded-xl p-5 flex items-start gap-4 border border-gray-200 dark:border-gray-800"
                    >
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                        <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
