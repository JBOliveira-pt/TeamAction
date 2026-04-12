// Layout da secção atleta.
import { enforceDashboardAccountType } from "@/app/lib/dashboard-access";

export const dynamic = "force-dynamic";

export default async function AtletaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await enforceDashboardAccountType(["atleta"]);

    return children;
}
