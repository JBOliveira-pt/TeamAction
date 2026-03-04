export default function Loading() {
    return (
        <main className="p-6">
            <div className="h-5 w-56 rounded bg-gray-800 animate-pulse mb-6" />
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
                    <div className="h-14 w-14 rounded-full bg-gray-800 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 w-40 rounded bg-gray-800 animate-pulse mb-2" />
                        <div className="h-3 w-56 rounded bg-gray-800 animate-pulse" />
                    </div>
                    <div className="h-6 w-20 rounded bg-gray-800 animate-pulse" />
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <div className="space-y-2">
                        <div className="h-3 w-28 rounded bg-gray-800 animate-pulse" />
                        <div className="h-11 w-full rounded bg-gray-800 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-28 rounded bg-gray-800 animate-pulse" />
                        <div className="h-11 w-full rounded bg-gray-800 animate-pulse" />
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="h-3 w-20 rounded bg-gray-800 animate-pulse" />
                    <div className="h-11 w-full rounded bg-gray-800 animate-pulse" />
                </div>

                <div className="space-y-3">
                    <div className="h-3 w-32 rounded bg-gray-800 animate-pulse" />
                    <div className="flex items-start gap-4">
                        <div className="h-20 w-20 rounded-lg bg-gray-800 animate-pulse" />
                        <div className="flex-1 h-20 rounded-lg bg-gray-800 animate-pulse" />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <div className="h-10 w-28 rounded bg-gray-800 animate-pulse" />
                    <div className="h-10 w-28 rounded bg-gray-800 animate-pulse" />
                </div>
            </div>
        </main>
    );
}
