// Esqueleto de carregamento para secção equipa atletas (treinador).
export default function Loading() {
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col animate-pulse">
            {/* Cabeçalho */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-52 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>

            {/* Pesquisa + separadores de filtro */}
            <div className="mb-4 h-10 w-full md:w-72 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="flex gap-2 mb-6">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-800"
                    />
                ))}
            </div>

            {/* Grelha de cards dos atletas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="space-y-1 flex-1">
                                <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
