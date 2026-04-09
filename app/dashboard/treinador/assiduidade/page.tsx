import Assiduidade from "./assiduidade.client";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchSessoesDisponiveis() {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return [];

    return sql<
        { id: string; data: string; tipo: string; duracao_min: number }[]
    >`
        SELECT id, data, tipo, duracao_min
        FROM sessoes
        WHERE organization_id = ${orgId}
        ORDER BY data DESC
        LIMIT 50
    `;
}

async function fetchAtletasAtivos() {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return [];

    return sql<
        {
            id: string;
            nome: string;
            posicao: string | null;
            numero_camisola: number | null;
        }[]
    >`
        SELECT id, nome, posicao, numero_camisola
        FROM atletas
        WHERE organization_id = ${orgId} AND estado = 'Ativo'
        ORDER BY nome ASC
    `;
}

export default async function AssiduidadePage() {
    const [sessoes, atletas] = await Promise.all([
        fetchSessoesDisponiveis().catch(() => []),
        fetchAtletasAtivos().catch(() => []),
    ]);

    return <Assiduidade sessoes={sessoes} atletas={atletas} />;
}
