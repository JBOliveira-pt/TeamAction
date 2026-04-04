import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type CourseRow = {
    modality_id: number;
    modality_name: string;
    level_id: number;
    level_code: string;
    level_name: string;
    level_description: string;
};

type SelectOption = {
    value: string;
    label: string;
};

export async function GET() {
    try {
        const rows = await sql<CourseRow[]>`
            SELECT
                m.id AS modality_id,
                m.name AS modality_name,
                g.id AS level_id,
                g.code AS level_code,
                g.name AS level_name,
                g.description AS level_description
            FROM cursos c
            INNER JOIN modalidades m ON m.id = c.modality_id
            INNER JOIN graus_tecnicos g ON g.id = c.level_id
            ORDER BY m.name ASC, g.id ASC
        `;

        const courseModalityOptionsMap = new Map<string, SelectOption>();
        const technicalLevelOptionsByModality: Record<string, SelectOption[]> =
            {};

        for (const row of rows) {
            const modalityId = String(row.modality_id);

            if (!courseModalityOptionsMap.has(modalityId)) {
                courseModalityOptionsMap.set(modalityId, {
                    value: modalityId,
                    label: row.modality_name,
                });
            }

            if (!technicalLevelOptionsByModality[modalityId]) {
                technicalLevelOptionsByModality[modalityId] = [];
            }

            technicalLevelOptionsByModality[modalityId].push({
                value: String(row.level_id),
                label: `${row.level_name} - ${row.level_description}`,
            });
        }

        return Response.json(
            {
                courseModalityOptions: Array.from(
                    courseModalityOptionsMap.values(),
                ),
                technicalLevelOptionsByModality,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "[TRAINER_PROFILE_OPTIONS] Failed to load options:",
            error,
        );
        return Response.json(
            { error: "Não foi possível carregar opções de Treinador." },
            { status: 500 },
        );
    }
}
