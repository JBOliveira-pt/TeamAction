export default function Loading() {
    return (
        <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 p-6 flex flex-col gap-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Selector card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex gap-3">
                    <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>

            {/* Counter grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow border border-gray-200 dark:border-gray-700 text-center space-y-2"
                    >
                        <div className="h-3 w-14 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-10 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>

            {/* Events table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>
        </div>
    );
}
