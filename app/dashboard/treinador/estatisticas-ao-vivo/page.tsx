import EstatisticasAoVivo from "./estatisticasaovivo";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchData() {
    const { userId } = await auth();
    if (!userId) return { jogos: [], atletas: [] };

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return { jogos: [], atletas: [] };

    const [jogos, atletas] = await Promise.all([
        sql<{
            id: string;
            adversario: string;
            data: string;
            equipa_nome: string | null;
            estado: string;
        }[]>`
            SELECT j.id, j.adversario, j.data::text, e.nome AS equipa_nome, j.estado
            FROM jogos j
            LEFT JOIN equipas e ON e.id = j.equipa_id
            WHERE j.organization_id = ${orgId}
            ORDER BY j.data DESC
            LIMIT 50
        `,
        sql<{
            id: string;
            nome: string;
            numero_camisola: number | null;
        }[]>`
            SELECT id, nome, numero_camisola
            FROM atletas
            WHERE organization_id = ${orgId}
            ORDER BY nome ASC
        `,
    ]);

    return { jogos, atletas };
}

export default async function Page() {
    const { jogos, atletas } = await fetchData().catch(() => ({ jogos: [], atletas: [] }));
    return <EstatisticasAoVivo jogos={jogos} atletas={atletas} />;
}
