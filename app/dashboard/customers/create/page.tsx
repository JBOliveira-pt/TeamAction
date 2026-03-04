// app/dashboard/customers/create/page.tsx
import Form from '@/app/ui/customers/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';

export default async function Page() {
    return (
        <main className='p-5'>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Clientes', href: '/dashboard/customers' },
                    {
                        label: 'Criar Cliente',
                        href: '/dashboard/customers/create',
                        active: true,
                    },
                ]}
            />
            <Form />
        </main>
    );
}