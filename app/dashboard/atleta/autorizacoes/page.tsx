import { fetchAutorizacoesAtleta } from "@/app/lib/data";
import { ShieldCheck, Users, Building2 } from "lucide-react";
import AutorizacaoAtletaCard from "./autorizacao-card.client";

export const dynamic = "force-dynamic";

export default async function AtletaAutorizacoesPage() {
    const autorizacoes = await fetchAutorizacoesAtleta();

    const iconMap: Record<string, React.ReactNode> = {
        convite_equipa: <Users size={16} className="text-blue-500" />,
        convite_clube: <Building2 size={16} className="text-purple-500" />,
    };

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Autorizações
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Pedidos de associação a clubes e equipas pendentes.
                </p>
            </div>

            <div className="space-y-3">
                {autorizacoes.length === 0 ? (
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
                                Quando houver convites de clubes ou equipas,
                                aparecerão aqui.
                            </p>
                        </div>
                    </div>
                ) : (
                    autorizacoes.map((a) => (
                        <AutorizacaoAtletaCard
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
