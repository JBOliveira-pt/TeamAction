import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import CreateTreinadorProfileForm from "@/app/ui/treinador/create-profile-form";

export default function Page() {
    return (
        <main className="p-5">
            <Breadcrumbs
                breadcrumbs={[
                    { label: "Treinador", href: "/dashboard/treinador" },
                    {
                        label: "Criar Perfil",
                        href: "/dashboard/treinador/create",
                        active: true,
                    },
                ]}
            />
            <CreateTreinadorProfileForm />
        </main>
    );
}
