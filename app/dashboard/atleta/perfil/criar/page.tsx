import CreateAtletaProfileForm from '@/app/ui/atleta/create-profile-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';

export default function CriarPerfilAtletaPage() {
    return (
        <main className="p-5 max-w-3xl mx-auto">
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Atleta', href: '/dashboard/atleta/perfil' },
                    {
                        label: 'Criar Perfil',
                        href: '/dashboard/atleta/perfil/criar',
                        active: true,
                    },
                ]}
            />
            <CreateAtletaProfileForm />
        </main>
    );
}
