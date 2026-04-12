// Layout da secção.
import { enforceDashboardAccountType } from "@/app/lib/dashboard-access";

export const dynamic = "force-dynamic";

export default async function DefinicoesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await enforceDashboardAccountType([
        "atleta",
        "treinador",
        "presidente",
        "responsavel",
    ]);
    return children;
}
