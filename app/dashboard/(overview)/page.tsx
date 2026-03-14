import {
    getDashboardPathForAccountType,
    normalizeAccountType,
} from "@/app/lib/account-type";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Forçar renderização dinâmica (requerida para Next.js Production)
export const dynamic = "force-dynamic";

export default async function Page() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const accountType = normalizeAccountType(
        user.unsafeMetadata?.accountType ?? user.publicMetadata?.accountType,
    );

    redirect(getDashboardPathForAccountType(accountType));
}
