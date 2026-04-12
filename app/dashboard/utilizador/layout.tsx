// Layout da secção utilizador.
import { enforceDashboardAccountType } from "@/app/lib/dashboard-access";

export const dynamic = "force-dynamic";

export default async function UtilizadorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await enforceDashboardAccountType(["atleta"]);

    return children;
}
