import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "..", "migrations");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function runMigrations() {
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
        throw new Error("POSTGRES_URL não está definido no ambiente.");
    }

    const sql = postgres(connectionString, { ssl: "require", max: 1 });

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id BIGSERIAL PRIMARY KEY,
                filename TEXT NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `;

        const files = (await readdir(migrationsDir))
            .filter((file) => file.endsWith(".sql"))
            .sort();

        for (const file of files) {
            const [{ exists } = { exists: false }] = await sql`
                SELECT EXISTS (
                    SELECT 1
                    FROM schema_migrations
                    WHERE filename = ${file}
                ) AS exists
            `;

            if (exists) {
                console.log(`- skip ${file}`);
                continue;
            }

            const fullPath = path.join(migrationsDir, file);
            const migrationSql = await readFile(fullPath, "utf8");

            await sql.begin(async (tx) => {
                await tx.unsafe(migrationSql);
                await tx`
                    INSERT INTO schema_migrations (filename)
                    VALUES (${file})
                `;
            });

            console.log(`+ applied ${file}`);
        }

        console.log("Migrations finalizadas.");
    } finally {
        await sql.end({ timeout: 5 });
    }
}

runMigrations().catch((error) => {
    console.error("Erro ao executar migrations:", error);
    process.exit(1);
});
