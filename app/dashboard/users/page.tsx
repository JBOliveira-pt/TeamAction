import { fetchFilteredUsers } from "@/app/lib/data";
import { AddUserButton } from "@/app/ui/users/buttons";
import UsersTable from "@/app/ui/users/table";
import Search from "@/app/ui/search";
import { Suspense } from "react";
import { UsersTableSkeleton } from "@/app/ui/skeletons";
import { Users } from "lucide-react";

// Forçar renderização dinâmica
export const dynamic = "force-dynamic";

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
    }>;
}) {
    const resolvedSearchParams = await searchParams;
    const query = resolvedSearchParams?.query || "";
    const users = await fetchFilteredUsers(query);

    return (
        <div className="bg-gray-50 dark:bg-gray-950 w-full min-h-screen p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col w-full justify-between">
                    <h1 className="text-xl text-center lg:text-start md:text-3xl font-bold text-gray-900 dark:text-white">
                        Utilizadores
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-start">
                        Gerencie os utilizadores do sistema
                    </p>
                </div>
            </div>

            {/* Search and Add - Envolver Search em Suspense */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <Suspense fallback={<SearchSkeleton />}>
                    <Search placeholder="Buscar utilizadores..." />
                </Suspense>
                <AddUserButton />
            </div>

            {/* Table */}
            <Suspense fallback={<UsersTableSkeleton />}>
                <UsersTable users={users} />
            </Suspense>
        </div>
    );
}

// Skeleton para o Search
function SearchSkeleton() {
    return (
        <div className="relative flex flex-1 max-w-md">
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
    );
}
