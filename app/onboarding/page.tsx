import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import OnboardingForm from "@/app/components/onboarding-form";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export default async function OnboardingPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/login");
    }

    // Check if user already has an organization
    const user = await sql`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId}
    `;

    if (user.length > 0 && user[0].organization_id) {
        // User already has organization, redirect to dashboard
        redirect("/dashboard");
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-6 bg-gray-950">
            <div className="w-full max-w-md">
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-8">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Bem-vindo à PrimeFlow
                    </h1>
                    <p className="text-gray-400 mb-6">
                        Crie uma organização para começar
                    </p>

                    <OnboardingForm />
                </div>
            </div>
        </main>
    );
}
