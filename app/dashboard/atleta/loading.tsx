const shimmer =
    "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-black/5 dark:before:via-white/5 before:to-transparent";

function InfoCard() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 space-y-3">
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between py-1">
                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
            ))}
        </div>
    );
}

function KpiCard({ color }: { color: string }) {
    return (
        <div
            className={`${shimmer} relative overflow-hidden rounded-xl p-5 space-y-2 border ${color}`}
        >
            <div className="flex items-center justify-between">
                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-10 w-14 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
    );
}

export default function Loading() {
    return (
        <div className="p-6 space-y-6 max-w-screen-xl mx-auto animate-pulse">
            {/* Cabeçalho */}
            <div>
                <div className="h-7 w-52 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded mt-1" />
            </div>

            {/* Infos + Condição Física + Calendário */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <InfoCard />
                <InfoCard />
                <InfoCard />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard color="bg-emerald-500/5 border-emerald-500/30" />
                <KpiCard color="bg-cyan-500/5 border-cyan-500/30" />
                <KpiCard color="bg-blue-500/5 border-blue-500/30" />
                <KpiCard color="bg-amber-500/5 border-amber-500/30" />
            </div>
        </div>
    );
}
