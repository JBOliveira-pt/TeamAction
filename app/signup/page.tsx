import CustomSignUpForm from "@/app/ui/signup/custom-signup-form";
import CompleteAccountTypeForm from "@/app/ui/signup/complete-account-type-form";
import {
    getDashboardPathForAccountType,
    normalizeAccountType,
} from "@/app/lib/account-type";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { verifyInviteToken } from "@/app/lib/invite-token";

interface SignUpPageProps {
    searchParams: Promise<{ invite?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
    const params = await searchParams;
    const inviteToken =
        typeof params.invite === "string" ? params.invite : null;

    let invite: {
        token: string;
        athleteName: string;
        responsibleEmail: string;
    } | null = null;

    if (inviteToken) {
        const payload = verifyInviteToken(inviteToken);
        if (payload) {
            invite = {
                token: inviteToken,
                athleteName: payload.athleteName,
                responsibleEmail: payload.responsibleEmail,
            };
        }
    }

    const { userId } = await auth();

    if (userId) {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const accountType = normalizeAccountType(
            user.unsafeMetadata?.accountType ??
                user.publicMetadata?.accountType,
        );

        if (accountType) {
            redirect(getDashboardPathForAccountType(accountType));
        }

        const initialFirstName = user.firstName || "";
        const initialLastName = user.lastName || "";
        const initialEmail = user.emailAddresses[0]?.emailAddress || "";

        return (
            <main className="relative min-h-screen overflow-hidden">
                <div
                    className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
                    }}
                />

                <div className="relative z-10 min-h-screen p-6 flex items-center justify-center">
                    <CompleteAccountTypeForm
                        initialFirstName={initialFirstName}
                        initialLastName={initialLastName}
                        initialEmail={initialEmail}
                        invite={invite}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div
                className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
                }}
            />

            <div className="relative z-10 min-h-screen p-6 flex items-center justify-center">
                <CustomSignUpForm invite={invite} />
            </div>
        </main>
    );
}
