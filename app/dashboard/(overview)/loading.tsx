const shimmer =
    "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-white/10 before:to-transparent";

export default function Loading() {
    return (
        <div className="bg-gray-50 dark:bg-gray-950 w-full min-h-screen p-6">
            <div className="mb-8">
                <div
                    className={`${shimmer} relative h-8 w-36 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800 mb-2`}
                />
                <div
                    className={`${shimmer} relative h-5 w-48 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800`}
                />
            </div>
        </div>
    );
}
