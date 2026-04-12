// Esqueleto de carregamento para loading.tsx.
export default function Loading() {
    return (
        <div className="p-6 space-y-6 max-w-screen-xl mx-auto animate-pulse">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3"
                    >
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
    );
}
