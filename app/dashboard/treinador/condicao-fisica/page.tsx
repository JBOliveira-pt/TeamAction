// Página de condicao fisica do treinador.
import CondicaoFisica from "./condicao-fisica.client";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchData() {
    const { userId } = await auth();
    if (!userId) return { avaliacoes: [], atletas: [] };

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return { avaliacoes: [], atletas: [] };

    const [avaliacoes, atletas] = await Promise.all([
        sql<
            {
                id: string;
                atleta_id: string;
                atleta_nome: string;
                data: string;
                velocidade_30m: number | null;
                impulsao_vertical: number | null;
                vo2max: number | null;
                forca_kg: number | null;
                observacoes: string | null;
            }[]
        >`
            SELECT af.id, af.atleta_id, a.nome AS atleta_nome,
                   af.data::text, af.velocidade_30m, af.impulsao_vertical,
                   af.vo2max, af.forca_kg, af.observacoes
            FROM avaliacoes_fisicas af
            JOIN atletas a ON a.id = af.atleta_id
            WHERE af.organization_id = ${orgId}
            ORDER BY af.data DESC, a.nome ASC
        `.catch(() => []),
        sql<{ id: string; nome: string }[]>`
            SELECT id, nome FROM atletas WHERE organization_id = ${orgId} ORDER BY nome ASC
        `,
    ]);

    return { avaliacoes, atletas };
}

export default async function Page() {
    const { avaliacoes, atletas } = await fetchData().catch(() => ({
        avaliacoes: [],
        atletas: [],
    }));
    return <CondicaoFisica avaliacoes={avaliacoes} atletas={atletas} />;
}
