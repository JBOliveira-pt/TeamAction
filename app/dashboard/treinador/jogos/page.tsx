// Página de jogos do treinador.
import Jogos from "./jogos.client";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchEquipas() {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await sql<{ organization_id: string }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    if (!orgId) return [];

    return sql<{ id: string; nome: string }[]>`
        SELECT id, nome FROM equipas
        WHERE organization_id = ${orgId}
        ORDER BY nome ASC
    `;
}

export default async function JogosPage({
    searchParams,
}: {
    searchParams: Promise<{ novo?: string }>;
}) {
    const equipas = await fetchEquipas().catch(() => []);
    const params = await searchParams;
    const autoOpenModal = params.novo === "1";
    return <Jogos equipas={equipas} autoOpenModal={autoOpenModal} />;
}
