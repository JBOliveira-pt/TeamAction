import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import VinculacaoCard from "./vinculacao-card";
import { UserCheck } from "lucide-react";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export const dynamic = "force-dynamic";

async function fetchVinculacoesPendentes() {
    const { userId } = await auth();
    if (!userId) return [];

    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!user) return [];

    return sql<
        {
            id: string;
            alvo_email: string;
            alvo_nome: string | null;
            status: string;
            created_at: string;
        }[]
    >`
        SELECT
            arp.id,
            arp.alvo_email,
            u.name AS alvo_nome,
            arp.status,
            arp.created_at::text
        FROM atleta_relacoes_pendentes arp
        LEFT JOIN users u ON u.id = arp.alvo_responsavel_user_id
        WHERE arp.atleta_user_id = ${user.id}
          AND arp.relation_kind = 'responsavel'
          AND arp.status = 'pendente'
        ORDER BY arp.created_at DESC
    `;
}

export default async function VinculacoesPage() {
    const vinculacoes = await fetchVinculacoesPendentes();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Vinculações de Responsável
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pedidos pendentes de encarregados de educação que pretendem
                    vincular-se ao seu perfil.
                </p>
            </div>

            <div className="space-y-3">
                {vinculacoes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-12 text-center">
                        <UserCheck
                            size={32}
                            className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                        />
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            Nenhum pedido de vinculação pendente.
                        </p>
                    </div>
                ) : (
                    vinculacoes.map((v) => <VinculacaoCard key={v.id} v={v} />)
                )}
            </div>
        </div>
    );
}
