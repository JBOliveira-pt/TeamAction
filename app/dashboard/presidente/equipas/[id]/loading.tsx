// Esqueleto de carregamento para secção equipas (presidente).
const shimmerDark =
    "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-black/5 dark:before:via-white/5 before:to-transparent";

function StatCardSkeleton() {
    return (
        <div
            className={`${shimmerDark} relative overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5`}
        >
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-slate-800 mb-3" />
            <div className="h-8 w-16 rounded bg-gray-200 dark:bg-slate-800" />
        </div>
    );
}

function TableRowSkeleton() {
    return (
        <tr className="border-b border-gray-200 dark:border-slate-800/50 last:border-0">
            <td className="px-6 py-4">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-800" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 rounded bg-gray-200 dark:bg-slate-800" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-12 rounded bg-gray-200 dark:bg-slate-800" />
            </td>
            <td className="px-6 py-4">
                <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-slate-800" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-16 rounded bg-gray-200 dark:bg-slate-800" />
            </td>
        </tr>
    );
}

export default function Loading() {
    return (
        <div className="p-6 space-y-6">
            <div className="space-y-4">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-800" />
                        <div className="space-y-2">
                            <div className="h-6 w-40 rounded bg-gray-200 dark:bg-slate-800" />
                            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-700" />
                        </div>
                    </div>
                    <div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-slate-800" />
                </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                        >
                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800" />
                            <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-800" />
                            <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
                            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-800" />
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800" />
                        <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
                        <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-slate-700" />
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-800" />
                        </div>
                        <table className="w-full">
                            <tbody>
                                <TableRowSkeleton />
                                <TableRowSkeleton />
                                <TableRowSkeleton />
                                <TableRowSkeleton />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
