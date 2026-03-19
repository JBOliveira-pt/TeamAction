import { enforceDashboardAccountType } from "@/app/lib/dashboard-access";

export const dynamic = "force-dynamic";

export default async function InvoicesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await enforceDashboardAccountType(["presidente"]);

    return children;
}
