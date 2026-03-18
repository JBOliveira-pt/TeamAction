import type { Sql } from "postgres";

let ensureRecipientUserIdColumnPromise: Promise<void> | null = null;

export function ensureRecipientUserIdColumn(sql: Sql) {
    if (!ensureRecipientUserIdColumnPromise) {
        ensureRecipientUserIdColumnPromise = (async () => {
            const existingColumn = await sql<{ exists: boolean }[]>`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'notificacoes'
                      AND column_name = 'recipient_user_id'
                ) AS exists
            `;

            if (!existingColumn[0]?.exists) {
                await sql`
                    ALTER TABLE notificacoes
                    ADD COLUMN recipient_user_id UUID NULL
                `;
            }
        })().catch((error) => {
            ensureRecipientUserIdColumnPromise = null;
            throw error;
        });
    }

    return ensureRecipientUserIdColumnPromise;
}
