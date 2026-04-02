import { auth } from '@clerk/nextjs/server';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId)
            return Response.json(
                { error: 'Not authenticated' },
                { status: 401 },
            );

        const [user] = await sql<
            { id: string; name: string; Encarregado_Edu: string | null }[]
        >`
            SELECT id, name, "Encarregado_Edu" FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user)
            return Response.json({ error: 'User not found' }, { status: 404 });

        const [atleta] = await sql`
            SELECT * FROM atletas WHERE user_id = ${user.id} LIMIT 1
        `;

        const equipa = atleta?.equipa_id
            ? await sql`SELECT * FROM equipas WHERE id = ${atleta.equipa_id} LIMIT 1`
            : [];

        return Response.json({
            user: {
                id: user.id,
                name: user.name,
                encarregado_edu: user['Encarregado_Edu'],
            },
            atleta: atleta ?? null,
            equipa: equipa[0] ?? null,
        });
    } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
    }
}
