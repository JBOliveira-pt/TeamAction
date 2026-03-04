import SideNav from "@/app/ui/dashboard/sidenav";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: {
        template: "%s | PrimeFlow Dashboard",
        default: "PrimeFlow Dashboard",
    },
    description: "The official Next.js Learn Dashboard built with App Router.",
    metadataBase: new URL("https://next-learn-dashboard.vercel.sh"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <SideNav />
            <main className="flex-1 overflow-y-auto lg:ml-64 mt-20">
                {children}
            </main>
        </div>
    );
}
