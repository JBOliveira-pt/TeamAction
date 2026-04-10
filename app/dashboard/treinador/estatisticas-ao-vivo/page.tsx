import EstatisticasAoVivo from "./estatisticas-ao-vivo.client";
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
        sql<
            {
                id: string;
                adversario: string;
                data: string;
                hora_inicio: string | null;
                equipa_nome: string | null;
                estado: string;
                is_mine: boolean;
            }[]
        >`
            SELECT j.id, j.adversario, j.data::text, j.hora_inicio::text,
                   e.nome AS equipa_nome, j.estado,
                   (j.organization_id = ${orgId}) AS is_mine
            FROM jogos j
            LEFT JOIN equipas e ON e.id = j.equipa_id
            WHERE j.organization_id = ${orgId}
               OR j.mirror_game_id IN (SELECT id FROM jogos WHERE organization_id = ${orgId})
            ORDER BY j.data DESC
            LIMIT 50
        `,
        sql<
            {
                id: string;
                nome: string;
                numero_camisola: number | null;
            }[]
        >`
            SELECT id, nome, numero_camisola
            FROM atletas
            WHERE organization_id = ${orgId}
            ORDER BY nome ASC
        `,
    ]);

    return { jogos, atletas };
}

export default async function Page() {
    const { jogos, atletas } = await fetchData().catch(() => ({
        jogos: [],
        atletas: [],
    }));
    return <EstatisticasAoVivo jogos={jogos} atletas={atletas} />;
}
