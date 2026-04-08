import { sql, getOrganizationId } from "./_shared";

// ============================================
// PRESIDENTE QUERIES
// ============================================

// ---------- EQUIPAS ----------

export async function fetchEquipas() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                escalao: string;
                estado: string;
                desporto: string;
                treinador_id: string | null;
                total_atletas: number;
                nome_treinador: string | null;
                staff_treinador_principal_nome: string | null;
                staff_treinador_principal_id: string | null;
                adjunto_user_id: string | null;
                staff_adjunto_id: string | null;
            }[]
        >`
            SELECT
                equipas.id,
                equipas.nome,
                equipas.escalao,
                equipas.estado,
                equipas.desporto,
                equipas.treinador_id,
                COUNT(atletas.id) AS total_atletas,
                users.name AS nome_treinador,
                (SELECT s.nome FROM staff s WHERE s.equipa_id = equipas.id AND s.funcao = 'Treinador Principal' AND s.organization_id = ${organizationId} LIMIT 1) AS staff_treinador_principal_nome,
                (SELECT s.id FROM staff s WHERE s.equipa_id = equipas.id AND s.funcao = 'Treinador Principal' AND s.organization_id = ${organizationId} LIMIT 1) AS staff_treinador_principal_id,
                (SELECT s.user_id FROM staff s WHERE s.equipa_id = equipas.id AND s.funcao = 'Treinador Adjunto' AND s.organization_id = ${organizationId} LIMIT 1) AS adjunto_user_id,
                (SELECT s.id FROM staff s WHERE s.equipa_id = equipas.id AND s.funcao = 'Treinador Adjunto' AND s.organization_id = ${organizationId} LIMIT 1) AS staff_adjunto_id
            FROM equipas
            LEFT JOIN atletas ON atletas.equipa_id = equipas.id
            LEFT JOIN users ON users.id = equipas.treinador_id
            WHERE equipas.organization_id = ${organizationId}
            GROUP BY equipas.id, equipas.nome, equipas.escalao, equipas.estado, equipas.desporto, equipas.treinador_id, users.name
            ORDER BY equipas.nome ASC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch equipas.");
    }
}

export async function fetchAtletasByEquipa(equipaId: string) {
    try {
        const organizationId = await getOrganizationId();
        return await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
            }[]
        >`
            SELECT id, nome, posicao, numero_camisola
            FROM atletas
            WHERE equipa_id = ${equipaId} AND organization_id = ${organizationId}
            ORDER BY nome ASC
        `;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}

export async function fetchEquipaById(id: string) {
    try {
        const organizationId = await getOrganizationId();

        const equipa = await sql<
            {
                id: string;
                nome: string;
                escalao: string;
                estado: string;
                desporto: string;
                treinador_id: string | null;
                treinador_nome: string | null;
            }[]
        >`
            SELECT e.id, e.nome, e.escalao, e.estado, e.desporto,
                   e.treinador_id, u.name AS treinador_nome
            FROM equipas e
            LEFT JOIN users u ON u.id = e.treinador_id
            WHERE e.id = ${id} AND e.organization_id = ${organizationId}
        `;

        const atletas = await sql<
            {
                id: string;
                nome: string;
                posicao: string | null;
                numero_camisola: number | null;
                estado: string;
                user_id: string | null;
            }[]
        >`
            SELECT id, nome, posicao, numero_camisola, estado, user_id
            FROM atletas
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY nome ASC
        `;

        const staff = await sql<
            {
                id: string;
                nome: string;
                funcao: string;
                user_id: string | null;
            }[]
        >`
            SELECT id, nome, funcao, user_id
            FROM staff
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY funcao ASC
        `;

        const jogos = await sql<
            {
                id: string;
                adversario: string;
                data: string;
                casa_fora: string;
                resultado_nos: number | null;
                resultado_adv: number | null;
                estado: string;
            }[]
        >`
            SELECT id, adversario, data, casa_fora, resultado_nos, resultado_adv, estado
            FROM jogos
            WHERE equipa_id = ${id} AND organization_id = ${organizationId}
            ORDER BY data DESC
            LIMIT 10
        `;

        return { equipa: equipa[0], atletas, staff, jogos };
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch equipa.");
    }
}
