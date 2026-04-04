import {
    getDashboardPathForAccountType,
    normalizeAccountType,
} from "@/app/lib/account-type";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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
    const accountType = normalizeAccountType(metadata.accountType);

    redirect(getDashboardPathForAccountType(accountType));
}
