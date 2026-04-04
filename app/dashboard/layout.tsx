import SideNav from "@/app/ui/dashboard/sidenav";
import { LoginAvisoPopup } from "@/app/components/login-aviso-popup";
import { UserInteractionTracker } from "@/app/components/user-interaction-tracker";
import {
    AccountType,
    getDashboardPathForAccountType,
    normalizeAccountType,
} from "@/app/lib/account-type";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    max: 2,
    idle_timeout: 20,
    connect_timeout: 15,
});

export const metadata: Metadata = {
    title: {
        template: "%s | TeamAction Dashboard",
        default: "TeamAction Dashboard",
    },
    description: "The official Next.js Learn Dashboard built with App Router.",
    metadataBase: new URL("https://next-learn-dashboard.vercel.sh"),
};

export const dynamic = "force-dynamic";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    if (!accountType) {
        redirect("/signup");
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <SideNav accountType={accountType as AccountType} />
            <main className="flex-1 overflow-y-auto lg:ml-64 mt-20">
                <UserInteractionTracker />
                <LoginAvisoPopup />
                {children}
            </main>
        </div>
    );
}
