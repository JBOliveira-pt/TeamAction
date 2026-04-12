// Página de recibos do presidente.
import { Metadata } from "next";
import { fetchReciboDetail } from "@/app/lib/receipts-data";
import ReciboDetailForm from "@/app/ui/receipts/edit-form";
import Breadcrumbs from "@/app/ui/components/breadcrumbs";
import { getCurrentUser } from "@/app/lib/auth-helpers";

export const metadata: Metadata = {
    title: "Recibo | TeamAction Dashboard",
};

export const dynamic = "force-dynamic";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const recibo = await fetchReciboDetail(id);
    const currentUser = await getCurrentUser();
    const canSend =
        !!currentUser &&
        (currentUser.account_type === "presidente" ||
            currentUser.id === recibo.recibo_created_by);

    return (
        <main className="p-5">
            <Breadcrumbs
                breadcrumbs={[
                    { label: "Recibos", href: "/dashboard/presidente/recibos" },
                    {
                        label: "Visualizacao",
                        href: `/dashboard/presidente/recibos/${id}`,
                        active: true,
                    },
                ]}
            />
            <ReciboDetailForm recibo={recibo} canSend={canSend} />
        </main>
    );
}
