import CreateAtletaProfileForm from "@/app/ui/atleta/create-profile-form";
import { getCurrentUser } from "@/app/lib/auth-helpers";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";

export default async function CriarPerfilUtilizadorPage() {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";

    return (
        <main className="p-5 max-w-3xl mx-auto">
            <Breadcrumbs
                breadcrumbs={[
                    {
                        label: "Perfil Utilizador",
                        href: "/dashboard/utilizador/perfil",
                    },
                    {
                        label: "Criar Perfil",
                        href: "/dashboard/utilizador/perfil/criar",
                        active: true,
                    },
                ]}
            />
            <CreateAtletaProfileForm
                isAdmin={isAdmin}
                cancelHref={
                    isAdmin ? "/dashboard" : "/dashboard/utilizador/perfil"
                }
            />
        </main>
    );
}
