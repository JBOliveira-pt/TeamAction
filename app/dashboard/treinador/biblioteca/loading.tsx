export default function Loading() {
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col animate-pulse">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-60 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Filters: search + category buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="h-10 flex-1 min-w-[180px] rounded-lg bg-gray-200 dark:bg-gray-800" />
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="h-9 w-24 rounded-full bg-gray-200 dark:bg-gray-800"
                    />
                ))}
            </div>

            {/* Plays grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <div className="h-44 bg-gray-200 dark:bg-gray-700" />
                        <div className="p-4 space-y-2">
                            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="flex gap-2">
                                <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="flex gap-2 pt-2">
                                <div className="h-8 w-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                <div className="h-8 w-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
