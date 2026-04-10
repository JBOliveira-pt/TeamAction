const shimmer =
    "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-black/5 dark:before:via-white/5 before:to-transparent";

function HighlightCard({ color }: { color: string }) {
    return (
        <div
            className={`${shimmer} relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border ${color} p-6 flex flex-col gap-2`}
        >
            <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
    );
}

function ListCard() {
    return (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3 py-2">
                    <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                </div>
            ))}
        </div>
    );
}

export default function Loading() {
    return (
        <div className="flex w-full min-h-screen">
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-6 flex flex-col gap-8 animate-pulse">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
                        <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    </div>
                </div>

                {/* Cards de destaque */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    <HighlightCard color="border-blue-200 dark:border-blue-800" />
                    <HighlightCard color="border-amber-200 dark:border-amber-800" />
                    <HighlightCard color="border-green-200 dark:border-green-800" />
                    <HighlightCard color="border-yellow-200 dark:border-yellow-800" />
                </div>

                {/* Listas: Sessões, Eventos, Plantel */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <ListCard />
                    <ListCard />
                    <ListCard />
                </div>
            </div>

            {/* StaffPanel placeholder */}
            <div className="hidden xl:block w-56 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 space-y-4">
                <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-1">
                            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-2 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
