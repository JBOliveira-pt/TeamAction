// Esqueleto de carregamento para secção notas (treinador).
export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Notas agrupadas por data */}
            {[1, 2].map((group) => (
                <div key={group} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
                        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-start gap-4 border border-gray-200 dark:border-gray-800"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <div className="h-7 w-7 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="h-7 w-7 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
