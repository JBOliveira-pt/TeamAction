export default function Loading() {
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-6 animate-pulse">
            {/* Month header */}
            <div className="flex items-center justify-center gap-4">
                <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-7 w-44 rounded-lg bg-gray-200 dark:bg-gray-800" />
                <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Época card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center gap-4">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1">
                {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                    <div
                        key={i}
                        className="h-6 rounded bg-gray-200 dark:bg-gray-800 text-center"
                    />
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-20 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    />
                ))}
            </div>
        </div>
    );
}
