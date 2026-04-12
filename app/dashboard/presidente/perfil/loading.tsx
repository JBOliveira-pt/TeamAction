// Esqueleto de carregamento para secção perfil (presidente).
export default function Loading() {
    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-pulse">
            {/* Header card: avatar + info */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                            <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
                            <div className="h-5 w-28 rounded-full bg-gray-200 dark:bg-gray-800" />
                        </div>
                        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                </div>
            </div>

            {/* Secção edição inline */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                            <div className="h-9 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
