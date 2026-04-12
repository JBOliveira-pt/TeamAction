// Componente cliente de  components.
"use client";

import { solicitarTrocaPlano } from "@/app/lib/actions/planos";
import { Check, Clock, Crown, Rocket, Shield, Star, X } from "lucide-react";
import { useActionState, useState } from "react";

type State = { error?: string; success?: boolean } | null;

const planos = [
    {
        id: "rookie",
        nome: "Rookie",
        preco: "Grátis",
        descricao:
            "Ideal para quem está a começar. Acede às funcionalidades essenciais da plataforma para gerir a tua equipa.",
        features: [
            "Gestão básica de equipas",
            "Calendário de jogos",
            "Perfis de atletas",
            "Comunicados simples",
        ],
        icon: Rocket,
        cor: "gray",
    },
    {
        id: "team",
        nome: "Team",
        preco: "Pago",
        descricao:
            "Para equipas que querem ir mais longe. Ferramentas avançadas de gestão e acompanhamento dos atletas.",
        features: [
            "Tudo do plano Rookie",
            "Estatísticas avançadas",
            "Relatórios de desempenho",
            "Gestão de mensalidades",
            "Notificações prioritárias",
        ],
        icon: Shield,
        cor: "blue",
    },
    {
        id: "club_pro",
        nome: "Club Pro",
        preco: "Pago",
        descricao:
            "A solução completa para clubes profissionais. Controlo total sobre todas as operações do clube.",
        features: [
            "Tudo do plano Team",
            "Multi-equipas ilimitadas",
            "Planos nutricionais",
            "Avaliações físicas",
            "Jogadas táticas",
            "Suporte prioritário",
        ],
        icon: Star,
        cor: "violet",
    },
    {
        id: "legend",
        nome: "Legend",
        preco: "Pago",
        descricao:
            "O plano definitivo. Acesso ilimitado a todas as funcionalidades presentes e futuras da plataforma.",
        features: [
            "Tudo do plano Club Pro",
            "API de integração",
            "Relatórios personalizados",
            "Funcionalidades beta exclusivas",
            "Gestor de conta dedicado",
            "Armazenamento ilimitado",
        ],
        icon: Crown,
        cor: "amber",
    },
];

const corMap: Record<
    string,
    { card: string; badge: string; icon: string; button: string }
> = {
    gray: {
        card: "border-gray-200 dark:border-gray-800",
        badge: "bg-gray-500/10 text-gray-500",
        icon: "text-gray-400",
        button: "bg-gray-500 hover:bg-gray-600",
    },
    blue: {
        card: "border-blue-200 dark:border-blue-900/50",
        badge: "bg-blue-500/10 text-blue-500",
        icon: "text-blue-500",
        button: "bg-blue-600 hover:bg-blue-700",
    },
    violet: {
        card: "border-violet-200 dark:border-violet-900/50",
        badge: "bg-violet-500/10 text-violet-500",
        icon: "text-violet-500",
        button: "bg-violet-600 hover:bg-violet-700",
    },
    amber: {
        card: "border-amber-200 dark:border-amber-900/50",
        badge: "bg-amber-500/10 text-amber-500",
        icon: "text-amber-500",
        button: "bg-amber-600 hover:bg-amber-700",
    },
};

function normalizePlano(plano: string): string {
    const map: Record<string, string> = {
        free: "rookie",
        pro: "club_pro",
        premium: "legend",
    };
    return map[plano] ?? plano;
}

export default function PlanoSelector({
    planoAtual,
    pedidoPendente,
}: {
    planoAtual: string;
    pedidoPendente: { plano: string; criadoEm: string } | null;
}) {
    const [confirmPlano, setConfirmPlano] = useState<string | null>(null);
    const [state, action, isPending] = useActionState<State, FormData>(
        solicitarTrocaPlano,
        null,
    );

    const planoNorm = normalizePlano(planoAtual);

    const planoSelecionado = planos.find((p) => p.id === confirmPlano);
    const cores = planoSelecionado ? corMap[planoSelecionado.cor] : null;

    return (
        <>
            {/* Aviso de pedido pendente */}
            {pedidoPendente && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <Clock
                        size={20}
                        className="text-amber-500 mt-0.5 shrink-0"
                    />
                    <div>
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            Pedido em análise
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                            Solicitaste a alteração para o plano{" "}
                            <strong>
                                {planos.find(
                                    (p) =>
                                        p.id ===
                                        normalizePlano(pedidoPendente.plano),
                                )?.nome ?? pedidoPendente.plano}
                            </strong>
                            . O administrador está a analisar o teu pedido.
                        </p>
                    </div>
                </div>
            )}

            {/* Feedback de sucesso/erro após ação */}
            {state?.success && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400">
                    Pedido enviado com sucesso! O administrador irá analisá-lo.
                </div>
            )}
            {state?.error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                    {state.error}
                </div>
            )}

            {/* Grid de planos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {planos.map((plano) => {
                    const cores = corMap[plano.cor];
                    const isAtual = planoNorm === plano.id;
                    const isPago = plano.preco === "Pago";
                    const isPedidoPendente =
                        pedidoPendente &&
                        normalizePlano(pedidoPendente.plano) === plano.id;

                    return (
                        <div
                            key={plano.id}
                            className={`relative bg-white dark:bg-gray-900 border rounded-xl p-5 space-y-4 transition-all ${
                                isAtual
                                    ? `${cores.card} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 ${
                                          plano.cor === "gray"
                                              ? "ring-gray-400"
                                              : plano.cor === "blue"
                                                ? "ring-blue-500"
                                                : plano.cor === "violet"
                                                  ? "ring-violet-500"
                                                  : "ring-amber-500"
                                      }`
                                    : `${cores.card} hover:shadow-md`
                            }`}
                        >
                            {isAtual && (
                                <div className="absolute -top-2.5 left-4">
                                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-full">
                                        Plano Atual
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <plano.icon
                                        size={22}
                                        className={cores.icon}
                                    />
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                            {plano.nome}
                                        </h3>
                                        <span
                                            className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${cores.badge}`}
                                        >
                                            {plano.preco}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                {plano.descricao}
                            </p>

                            <ul className="space-y-1.5">
                                {plano.features.map((f) => (
                                    <li
                                        key={f}
                                        className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"
                                    >
                                        <Check
                                            size={14}
                                            className={cores.icon}
                                        />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {!isAtual && isPago && (
                                <button
                                    type="button"
                                    disabled={!!isPedidoPendente}
                                    onClick={() => setConfirmPlano(plano.id)}
                                    className={`w-full py-2 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${cores.button}`}
                                >
                                    {isPedidoPendente
                                        ? "Pedido em análise..."
                                        : "Solicitar este plano"}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal de confirmação */}
            {confirmPlano && planoSelecionado && cores && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <planoSelecionado.icon
                                    size={22}
                                    className={cores.icon}
                                />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Confirmar pedido
                                </h2>
                            </div>
                            <button
                                onClick={() => setConfirmPlano(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Tens a certeza que queres solicitar a alteração para
                            o plano{" "}
                            <strong className="text-gray-900 dark:text-white">
                                {planoSelecionado.nome}
                            </strong>
                            ?
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            O teu pedido será enviado ao administrador da
                            plataforma para análise. Serás notificado quando
                            houver uma atualização.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmPlano(null)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <form action={action} className="flex-1">
                                <input
                                    type="hidden"
                                    name="plano"
                                    value={confirmPlano}
                                />
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    onClick={() => setConfirmPlano(null)}
                                    className={`w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${cores.button}`}
                                >
                                    {isPending
                                        ? "A enviar..."
                                        : "Confirmar pedido"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
