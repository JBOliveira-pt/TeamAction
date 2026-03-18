import { ReactNode } from "react";
import { requireAdminSession } from "@/app/lib/admin-auth";
import { AdminSideNav } from "@/app/ui/admin/sidenav";
import { AdminHeader } from "@/app/ui/admin/admin-header";
import { UserInteractionTracker } from "@/app/components/user-interaction-tracker";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireAdminSession();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <AdminSideNav />
            <div className="flex flex-1 flex-col lg:ml-64">
                <AdminHeader />

                <main className="mt-20 flex-1 overflow-y-auto p-4 md:p-6">
                    <UserInteractionTracker />
                    {children}
                </main>
            </div>
        </div>
    );
}
