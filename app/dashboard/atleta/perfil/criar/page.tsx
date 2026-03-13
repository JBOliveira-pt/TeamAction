import CreateAtletaProfileForm from "@/app/ui/atleta/create-profile-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { getCurrentUser } from "@/app/lib/auth-helpers";

export default async function CriarPerfilAtletaPage() {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";

    return (
        <main className="p-5 max-w-3xl mx-auto">
            <Breadcrumbs
                breadcrumbs={[
                    { label: "Atleta", href: "/dashboard/atleta/perfil" },
                    {
                        label: "Criar Perfil",
                        href: "/dashboard/atleta/perfil/criar",
                        active: true,
                    },
                ]}
            />
            <CreateAtletaProfileForm
                isAdmin={isAdmin}
                cancelHref={isAdmin ? "/dashboard" : "/dashboard/atleta/perfil"}
            />
        </main>
    );
}
