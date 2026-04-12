// Esqueleto de carregamento para secção jogos (treinador).
export default function Loading() {
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-6 animate-pulse">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-52 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    "border-orange-200 dark:border-orange-800",
                    "border-green-200 dark:border-green-800",
                    "border-blue-200 dark:border-blue-800",
                ].map((border, i) => (
                    <div
                        key={i}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-5 border ${border} space-y-2`}
                    >
                        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>

            {/* Título da secção */}
            <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800" />

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex gap-2 ml-auto">
                            <div className="h-7 w-7 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-7 w-7 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
