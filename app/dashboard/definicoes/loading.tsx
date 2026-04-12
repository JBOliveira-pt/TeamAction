// Esqueleto de carregamento para loading.tsx.
export default function Loading() {
    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto animate-pulse">
            {/* Cabeçalho */}
            <div>
                <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                <div className="h-4 w-56 bg-gray-200 dark:bg-gray-800 rounded mt-1" />
            </div>

            {/* Placeholder do banner info */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 flex items-start gap-3">
                <div className="h-5 w-5 rounded bg-blue-200 dark:bg-blue-800 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-full rounded bg-blue-200 dark:bg-blue-800" />
                    <div className="h-3 w-3/4 rounded bg-blue-200 dark:bg-blue-800" />
                </div>
            </div>

            {/* PlanoSelector placeholder */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-5">
                <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3"
                        >
                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                            <div className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
                            <div className="h-9 w-full rounded-lg bg-gray-200 dark:bg-gray-800 mt-2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
