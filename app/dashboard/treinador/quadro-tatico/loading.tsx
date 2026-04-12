// Esqueleto de carregamento para secção quadro tatico (treinador).
export default function Loading() {
    return (
        <div className="w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6 flex flex-col lg:flex-row gap-4 animate-pulse">
            {/* Área principal */}
            <div className="flex-1 flex flex-col gap-3">
                <div className="h-6 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="h-8 w-14 rounded-lg bg-gray-200 dark:bg-gray-800"
                        />
                    ))}
                    <div className="flex-1" />
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-800"
                        />
                    ))}
                </div>

                {/* Placeholder do campo */}
                <div className="flex-1 min-h-[300px] rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />

                {/* Botões de ação */}
                <div className="flex gap-2">
                    <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>

            {/* Painel lateral */}
            <div className="lg:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-12 rounded-lg bg-gray-200 dark:bg-gray-700"
                    />
                ))}
            </div>
        </div>
    );
}
