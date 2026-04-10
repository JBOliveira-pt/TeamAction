export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header */}
            <div className="space-y-2">
                <div className="h-7 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Report cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-900 rounded-xl p-5 flex items-start gap-4 border border-gray-200 dark:border-gray-800"
                    >
                        <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
