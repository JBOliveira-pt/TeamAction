import SideNav from '@/app/ui/dashboard/sidenav';
import { auth } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Pages within the dashboard that don't require a completed atleta profile
const EXEMPT_PATHS = [
    '/dashboard/utilizador/perfil/criar',
    '/dashboard/utilizador/perfil/editar',
];

export const metadata: Metadata = {
    title: {
        template: '%s | TeamAction Dashboard',
        default: 'TeamAction Dashboard',
    },
    description: 'The official Next.js Learn Dashboard built with App Router.',
    metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
};

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') ?? '';

    // Only enforce the check for actual dashboard navigation (not the exempt pages)
    const isExempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));

    if (!isExempt) {
        const { userId } = await auth();

        // Not authenticated at all → send to login
        if (!userId) {
            redirect('/login');
        }

        // Authenticated but no atleta profile → send to create profile
        const userRows = await sql<{ email: string }[]>`
            SELECT email FROM users WHERE clerk_user_id = ${userId}
        `;

        if (userRows.length > 0) {
            const atletaRows = await sql<{ id: string }[]>`
                SELECT id FROM utilizador WHERE email = ${userRows[0].email} LIMIT 1
            `;

            if (atletaRows.length === 0) {
                redirect('/dashboard/utilizador/perfil/criar');
            }
        }
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <SideNav />
            <main className="flex-1 overflow-y-auto lg:ml-64 mt-20">
                {children}
            </main>
        </div>
    );
}
