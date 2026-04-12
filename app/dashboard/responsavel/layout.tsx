// Layout da secção responsável.
import { enforceDashboardAccountType } from "@/app/lib/dashboard-access";

export const dynamic = "force-dynamic";

export default async function PaiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await enforceDashboardAccountType(["responsavel"]);

    return children;
}
