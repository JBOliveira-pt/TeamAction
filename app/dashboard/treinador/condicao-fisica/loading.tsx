export default function Loading() {
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 p-6 flex flex-col gap-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-44 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-60 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700 space-y-2"
                    >
                        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-8 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>
        </div>
    );
}
