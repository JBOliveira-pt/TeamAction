import {
    ShieldCheck,
    Users,
    Building2,
    CreditCard,
    FileEdit,
} from "lucide-react";
import { fetchAprovacoesPendentes } from "@/app/lib/data/responsavel";
import AprovacaoCard from "./aprovacao-card.client";

export default async function PaiAutorizacoesPage() {
    const aprovacoes = await fetchAprovacoesPendentes();

    const iconMap: Record<string, React.ReactNode> = {
        convite_equipa: <Users size={16} className="text-blue-500" />,
        convite_clube: <Building2 size={16} className="text-purple-500" />,
        pedido_plano: <CreditCard size={16} className="text-amber-500" />,
        alteracao_dados: <FileEdit size={16} className="text-orange-500" />,
    };

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Autorizações
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Aprovações pendentes para o seu educando.
                </p>
            </div>

            <div className="space-y-3">
                {aprovacoes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                            <ShieldCheck
                                size={28}
                                className="text-emerald-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Sem autorizações pendentes
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Quando houver ações que necessitem da sua
                                aprovação, aparecerão aqui.
                            </p>
                        </div>
                    </div>
                ) : (
                    aprovacoes.map((a) => (
                        <AprovacaoCard
                            key={a.id}
                            id={a.id}
                            tipo={a.tipo}
                            titulo={a.titulo}
                            descricao={a.descricao}
                            createdAt={a.created_at}
                            icon={iconMap[a.tipo]}
                        />
                    ))
                )}
            </div>
        </main>
    );
}
