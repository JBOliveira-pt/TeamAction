import CompleteAccountTypeForm from "@/app/ui/signup/complete-account-type-form";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

function normalizeAccountType(value: unknown): AccountType | null {
    if (typeof value !== "string") return null;

    const normalized = value.toLowerCase();
    if (
        normalized === "presidente" ||
        normalized === "treinador" ||
        normalized === "atleta" ||
        normalized === "responsavel"
    ) {
        return normalized;
    }

    return null;
}

export default async function CompleteAccountTypePage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const accountType = normalizeAccountType(
        user.unsafeMetadata?.accountType ?? user.publicMetadata?.accountType,
    );

    if (accountType) {
        redirect("/dashboard");
    }

    return (
        <main
            className="min-h-screen p-6 flex items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage:
                    "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
            }}
        >
            <CompleteAccountTypeForm />
        </main>
    );
}
