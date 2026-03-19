import CreateAtletaProfileForm from "@/app/ui/atleta/create-profile-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";

export default async function CriarPerfilUtilizadorPage() {
    return (
        <main className="p-5 max-w-3xl mx-auto">
            <Breadcrumbs
                breadcrumbs={[
                    {
                        label: "Perfil do Usuário",
                        href: "/dashboard/utilizador/perfil",
                    },
                    {
                        label: "Criar Perfil",
                        href: "/dashboard/utilizador/perfil/criar",
                        active: true,
                    },
                ]}
            />
            <CreateAtletaProfileForm cancelHref="/dashboard/utilizador/perfil" />
        </main>
    );
}
