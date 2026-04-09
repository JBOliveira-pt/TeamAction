import { sql, getOrganizationId } from "./_shared";

export async function fetchRelatoriosMetadata() {
    try {
        const organizationId = await getOrganizationId();

        const [epocas, staffCount, treinosCount, atletasCount] = await Promise.all([
            sql<{ id: string; nome: string; ativa: boolean }[]>`
                SELECT id, nome, ativa FROM epocas
                WHERE organization_id = ${organizationId}
                ORDER BY ativa DESC, nome DESC
            `,
            sql<{ count: string }[]>`
                SELECT COUNT(*) FROM staff WHERE organization_id = ${organizationId}
            `,
            sql<{ count: string }[]>`
                SELECT COUNT(*) FROM sessoes WHERE organization_id = ${organizationId}
            `,
            sql<{ count: string }[]>`
                SELECT COUNT(*) FROM atletas WHERE organization_id = ${organizationId}
            `,
        ]);

        return {
            epocas,
            staffCount: Number(staffCount[0].count),
            treinosCount: Number(treinosCount[0].count),
            atletasCount: Number(atletasCount[0].count),
        };
    } catch (error) {
        console.error("Database Error:", error);
        return { epocas: [], staffCount: 0, treinosCount: 0, atletasCount: 0 };
    }
}