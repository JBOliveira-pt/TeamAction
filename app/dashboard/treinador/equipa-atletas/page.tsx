import EquipaAtletas from "./equipaatletas";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchData() {
    const { userId } = await auth();
    if (!userId) return { atletas: [], equipas: [] };

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return { atletas: [], equipas: [] };

    const [atletas, equipas] = await Promise.all([
        sql<{
            id: string;
            nome: string;
            posicao: string | null;
            numero_camisola: number | null;
            estado: string;
            equipa_id: string | null;
            equipa_nome: string | null;
        }[]>`
            SELECT a.id, a.nome, a.posicao, a.numero_camisola, a.estado,
                   a.equipa_id, e.nome AS equipa_nome
            FROM atletas a
            LEFT JOIN equipas e ON e.id = a.equipa_id
            WHERE a.organization_id = ${orgId}
            ORDER BY a.nome ASC
        `,
        sql<{ id: string; nome: string }[]>`
            SELECT id, nome FROM equipas WHERE organization_id = ${orgId} ORDER BY nome ASC
        `,
    ]);

    return { atletas, equipas };
}

export default async function Page() {
    const { atletas, equipas } = await fetchData().catch(() => ({ atletas: [], equipas: [] }));
    return <EquipaAtletas atletas={atletas} equipas={equipas} />;
}
