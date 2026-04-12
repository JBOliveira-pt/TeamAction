// Página principal do dashboard: redirecionamento por tipo de conta.
import {
    getDashboardPathForAccountType,
    normalizeAccountType,
} from "@/app/lib/account-type";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    max: 2,
    idle_timeout: 20,
    connect_timeout: 15,
});

// Forçar renderização dinâmica (requerida para Next.js Production)
export const dynamic = "force-dynamic";

export default async function Page() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const metadata = (sessionClaims?.metadata || {}) as {
        accountType?: unknown;
    };
    let accountType = normalizeAccountType(metadata.accountType);

    // Fallback: JWT pode estar desatualizado após signup, verificar BD
    if (!accountType) {
        const rows = await sql<{ account_type: string | null }[]>`
            SELECT account_type FROM users WHERE clerk_user_id = ${userId} LIMIT 1
        `;
        accountType = normalizeAccountType(rows[0]?.account_type);
    }

    redirect(getDashboardPathForAccountType(accountType));
}
