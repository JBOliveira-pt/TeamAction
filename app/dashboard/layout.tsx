import SideNav from "@/app/ui/dashboard/sidenav";
import { LoginAvisoPopup } from "@/app/components/login-aviso-popup";
import { UserInteractionTracker } from "@/app/components/user-interaction-tracker";
import { normalizeAccountType } from "@/app/lib/account-type";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

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
    const { userId } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const accountType = normalizeAccountType(
        user.unsafeMetadata?.accountType ?? user.publicMetadata?.accountType,
    );

    if (!accountType) {
        redirect("/signup/complete-account-type");
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <SideNav />
            <main className="flex-1 overflow-y-auto lg:ml-64 mt-20">
                <UserInteractionTracker />
                <LoginAvisoPopup />
                {children}
            </main>
        </div>
    );
}
