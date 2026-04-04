export default function Loading() {
    return (
        <div className="p-6 space-y-6 max-w-screen-xl mx-auto animate-pulse">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="hidden sm:flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-9 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg"
                        />
                    ))}
                </div>
            </div>

            {/* Cards de métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3"
                    >
                        <div className="flex justify-between">
                            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded" />
                        </div>
                        <div className="h-10 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                ))}
            </div>

            {/* Jogos + Notificações */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4"
                        >
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                            {[1, 2, 3].map((j) => (
                                <div
                                    key={j}
                                    className="flex justify-between py-2"
                                >
                                    <div className="space-y-1">
                                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                                    </div>
                                    <div className="h-5 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg"
                        />
                    ))}
                </div>
            </div>

            {/* Equipas */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-6 py-3">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
