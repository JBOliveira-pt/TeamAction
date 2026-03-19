import { enforceDashboardAccountType } from "@/app/lib/dashboard-access";

export const dynamic = "force-dynamic";

export default async function TreinadorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await enforceDashboardAccountType(["treinador"]);

    return children;
}
