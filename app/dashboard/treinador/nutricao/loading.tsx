export default function Loading() {
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 p-6 flex flex-col gap-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center space-y-2"
                    >
                        <div className="h-3 w-16 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-10 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>
                        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>
        </div>
    );
}
