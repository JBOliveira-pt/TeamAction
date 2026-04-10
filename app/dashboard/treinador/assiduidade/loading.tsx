export default function Loading() {
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 animate-pulse">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-2"
                    >
                        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700"
                    />
                ))}
            </div>
        </div>
    );
}
