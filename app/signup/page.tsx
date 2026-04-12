// Página de registo de conta.
import CustomSignUpForm from "@/app/ui/signup/custom-signup-form";
import CompleteAccountTypeForm from "@/app/ui/signup/complete-account-type-form";
import {
    getDashboardPathForAccountType,
    normalizeAccountType,
} from "@/app/lib/account-type";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ASSETS } from "@/app/lib/assets";
import { verifyInviteToken } from "@/app/lib/invite-token";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

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

    const { userId, sessionClaims } = await auth();

    if (userId) {
        const metadata = (sessionClaims?.metadata || {}) as {
            accountType?: unknown;
        };
        let accountType = normalizeAccountType(metadata.accountType);

        // Fallback: verificar BD quando o JWT ainda não foi atualizado
        if (!accountType) {
            const atRows = await sql<{ account_type: string | null }[]>`
                SELECT account_type FROM users WHERE clerk_user_id = ${userId} LIMIT 1
            `;
            accountType = normalizeAccountType(atRows[0]?.account_type);
        }

        if (accountType) {
            redirect(getDashboardPathForAccountType(accountType));
        }

        // Buscar nome/email da BD local em vez de chamar a API do Clerk
        const rows = await sql<{ name: string; email: string }[]>`
            SELECT name, email FROM users WHERE clerk_user_id = ${userId} LIMIT 1
        `;
        const dbUser = rows[0];
        const nameParts = (dbUser?.name || "").split(" ");
        const initialFirstName = nameParts[0] || "";
        const initialLastName = nameParts.slice(1).join(" ") || "";
        const initialEmail = dbUser?.email || "";

        return (
            <main className="relative min-h-screen overflow-hidden">
                <div
                    className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('${ASSETS.loginBackground}')`,
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
                    backgroundImage: `url('${ASSETS.loginBackground}')`,
                }}
            />

            <div className="relative z-10 min-h-screen p-6 flex items-center justify-center">
                <CustomSignUpForm invite={invite} />
            </div>
        </main>
    );
}
