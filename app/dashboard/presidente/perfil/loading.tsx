export default function Loading() {
    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <div className="h-7 w-24 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 w-48 rounded bg-gray-200 dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-slate-800" />
                    <div className="h-5 w-32 rounded bg-gray-200 dark:bg-slate-800" />
                    <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-slate-800" />
                    <div className="w-full h-9 rounded-lg bg-gray-200 dark:bg-slate-800 mt-2" />
                </div>
                <div className="lg:col-span-2 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 space-y-3"
                        >
                            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-800" />
                            <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
                            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
