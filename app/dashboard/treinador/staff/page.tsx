// Página de staff do treinador.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import Staff, { type StaffMembro } from "./staff.client";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchStaffData(): Promise<{
    hasClub: boolean;
    staff: StaffMembro[];
} | null> {
    const { userId } = await auth();
    if (!userId) return null;

    const userRows = await sql<{ organization_id: string | null }[]>`
        SELECT organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = userRows[0];
    if (!me) return null;

    if (!me.organization_id) return { hasClub: false, staff: [] };

    const staff = await sql<StaffMembro[]>`
        SELECT
            s.id, s.nome, s.funcao,
            s.equipa_id, e.nome AS equipa_nome, e.escalao AS equipa_escalao,
            s.user_id,
            u.email AS user_email,
            s.created_at::text
        FROM staff s
        LEFT JOIN equipas e ON s.equipa_id = e.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.organization_id = ${me.organization_id}
        ORDER BY s.nome ASC
    `;

    return { hasClub: true, staff };
}

export default async function StaffPage() {
    const data = await fetchStaffData();

    if (!data) {
        return (
            <div className="p-6">
                <p className="text-sm text-gray-400">Erro ao carregar dados.</p>
            </div>
        );
    }

    return <Staff hasClub={data.hasClub} staff={data.staff} />;
}
