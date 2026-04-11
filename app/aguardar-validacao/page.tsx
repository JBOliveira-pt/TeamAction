import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeAccountType } from "@/app/lib/account-type";
import postgres from "postgres";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";
import { AguardarValidacaoClient } from "./client";

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    max: 2,
    idle_timeout: 20,
    connect_timeout: 15,
});

export const dynamic = "force-dynamic";

export default async function AguardarValidacaoPage() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const metadata = (sessionClaims?.metadata || {}) as {
        accountType?: unknown;
    };
    let accountType = normalizeAccountType(metadata.accountType);

    if (!accountType) {
        const rows = await sql<{ account_type: string | null }[]>`
            SELECT account_type FROM users WHERE clerk_user_id = ${userId} LIMIT 1
        `;
        accountType = normalizeAccountType(rows[0]?.account_type);
    }

    if (!accountType) {
        redirect("/signup");
    }

    if (accountType !== "responsavel") {
        redirect("/dashboard");
    }

    // Check if responsável has an accepted relation
    const userRows = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const dbUserId = userRows[0]?.id;

    if (dbUserId) {
        const acceptedRows = await sql<{ id: string }[]>`
            SELECT id FROM atleta_relacoes_pendentes
            WHERE alvo_responsavel_user_id = ${dbUserId}
              AND relation_kind = 'responsavel'
              AND status = 'aceite'
            LIMIT 1
        `;

        if (acceptedRows.length > 0) {
            redirect("/dashboard/responsavel");
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div
                className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        `url('${ASSETS.loginBackground}')`,
                }}
            />

            <div className="relative z-10 min-h-screen p-6 flex items-center justify-center">
                <div className="w-full max-w-md space-y-8 rounded-3xl border border-blue-200/20 bg-slate-950/60 p-6 backdrop-blur-xl backdrop-saturate-150 md:p-8 text-center">
                    <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-blue-200/30 bg-slate-950/70 shadow-[0_10px_30px_rgba(15,23,42,0.65)]">
                            <Image
                                src={ASSETS.logoWhite}
                                width={64}
                                height={64}
                                alt="TeamAction"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-xl font-bold text-white">
                            Aguardando Validação do Atleta
                        </h1>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Sua conta será concluída assim que o atleta valide
                            sua relação.
                        </p>
                        <p className="text-xs text-slate-400">
                            O atleta recebeu uma notificação para aceitar ou
                            recusar o pedido de vinculação. Assim que o atleta
                            aceitar, poderá aceder à plataforma normalmente.
                        </p>
                    </div>

                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                        <p className="text-sm text-amber-300 font-medium">
                            ⏳ Vinculação pendente
                        </p>
                    </div>

                    <AguardarValidacaoClient />
                </div>
            </div>
        </main>
    );
}
