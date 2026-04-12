// Página de nutricao do treinador.
import Nutricao from "./nutricao.client";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchData() {
    const { userId } = await auth();
    if (!userId) return { planos: [] };

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return { planos: [] };

    const planos = await sql<
        {
            id: string;
            nome: string;
            descricao: string | null;
            objetivo: string | null;
            observacoes: string | null;
            created_at: string;
        }[]
    >`
        SELECT id, nome, descricao, objetivo, observacoes, created_at::text
        FROM planos_nutricao
        WHERE organization_id = ${orgId}
        ORDER BY created_at DESC
    `.catch(() => []);

    return { planos };
}

export default async function Page() {
    const { planos } = await fetchData().catch(() => ({ planos: [] }));
    return <Nutricao planos={planos} />;
}
