import type { Atleta } from '@/app/lib/definitions';
import EditAtletaProfileForm from '@/app/ui/atleta/edit-profile-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function getAtletaByClerkUser(
    clerkUserId: string,
): Promise<Atleta | null> {
    const users = await sql<{ email: string }[]>`
        SELECT email FROM users WHERE clerk_user_id = ${clerkUserId}
    `;
    if (!users.length) return null;

    const atletas = await sql<Atleta[]>`
        SELECT * FROM atletas WHERE email = ${users[0].email}
    `;
    return atletas[0] ?? null;
}

export default async function EditarPerfilAtletaPage() {
    const { userId } = await auth();
    if (!userId) redirect('/login');

    const atleta = await getAtletaByClerkUser(userId);
    if (!atleta) redirect('/dashboard/atleta/perfil/criar');

    return (
        <main className="p-5 max-w-3xl mx-auto">
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Atleta', href: '/dashboard/atleta/perfil' },
                    {
                        label: 'Editar Perfil',
                        href: '/dashboard/atleta/perfil/editar',
                        active: true,
                    },
                ]}
            />
            <EditAtletaProfileForm atleta={atleta} />
        </main>
    );
}
