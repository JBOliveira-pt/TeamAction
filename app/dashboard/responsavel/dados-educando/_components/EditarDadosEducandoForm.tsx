"use client";

import { useActionState, useEffect, useState } from "react";
import {
    editarDadosCadastraisEducando,
    solicitarTrocaPlanoEducando,
} from "@/app/lib/actions/responsavel";
import type { DadosEducando } from "@/app/lib/data/responsavel";
import {
    User,
    CreditCard,
    Check,
    AlertTriangle,
    Clock,
    Loader2,
} from "lucide-react";

type State = { error?: string; success?: boolean } | null;

const planosDisponiveis = [
    {
        id: "rookie",
        nome: "Rookie",
        descricao: "Plano gratuito com funcionalidades essenciais",
    },
    { id: "team", nome: "Team", descricao: "Ferramentas avançadas de gestão" },
    {
        id: "club_pro",
        nome: "Club Pro",
        descricao: "Solução completa para clubes",
    },
    {
        id: "legend",
        nome: "Legend",
        descricao: "Máxima personalização e suporte",
    },
];

export default function EditarDadosEducandoForm({
    dados,
}: {
    dados: DadosEducando;
}) {
    /* ─── Dados Cadastrais ─── */
    const [dadosState, dadosAction, isDadosPending] = useActionState<
        State,
        FormData
    >(editarDadosCadastraisEducando, null);

    const [dismissedDadosState, setDismissedDadosState] = useState<State>(null);
    const dadosSuccess =
        !!dadosState?.success && dadosState !== dismissedDadosState;

    useEffect(() => {
        if (dadosState?.success) {
            const t = setTimeout(
                () => setDismissedDadosState(dadosState),
                3000,
            );
            return () => clearTimeout(t);
        }
    }, [dadosState]);

    /* ─── Plano ─── */
    const [planoState, planoAction, isPlanoPending] = useActionState<
        State,
        FormData
    >(solicitarTrocaPlanoEducando, null);

    const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(
        null,
    );
    const [dismissedPlanoState, setDismissedPlanoState] = useState<State>(null);
    const planoSuccess =
        !!planoState?.success && planoState !== dismissedPlanoState;

    useEffect(() => {
        if (planoState?.success) {
            const t = setTimeout(() => {
                setDismissedPlanoState(planoState);
                setPlanoSelecionado(null);
            }, 3000);
            return () => clearTimeout(t);
        }
    }, [planoState]);

    const planoLabel: Record<string, string> = {
        rookie: "Rookie",
        team: "Team",
        club_pro: "Club Pro",
        legend: "Legend",
    };

    return (
        <div className="space-y-8">
            {/* ━━━━ DADOS CADASTRAIS ━━━━ */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <User size={20} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Dados Cadastrais
                    </h2>
                </div>

                {dadosState?.error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                        {dadosState.error}
                    </div>
                )}
                {dadosSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Check size={16} /> Dados atualizados com sucesso.
                    </div>
                )}

                <form action={dadosAction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Nome"
                            name="firstName"
                            defaultValue={dados.firstName}
                            required
                        />
                        <Field
                            label="Apelido"
                            name="lastName"
                            defaultValue={dados.lastName}
                            required
                        />
                        <Field
                            label="Telefone"
                            name="telefone"
                            defaultValue={dados.telefone ?? ""}
                        />
                        <Field
                            label="NIF"
                            name="nif"
                            defaultValue={dados.nif ?? ""}
                        />
                        <Field
                            label="Morada"
                            name="morada"
                            defaultValue={dados.morada ?? ""}
                        />
                        <Field
                            label="Cidade"
                            name="cidade"
                            defaultValue={dados.cidade ?? ""}
                        />
                        <Field
                            label="Código Postal"
                            name="codigo_postal"
                            defaultValue={dados.codigoPostal ?? ""}
                        />
                        <Field
                            label="País"
                            name="pais"
                            defaultValue={dados.pais ?? ""}
                        />
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500">
                        Email: {dados.email} · Data de nascimento:{" "}
                        {dados.dataNascimento
                            ? new Date(dados.dataNascimento).toLocaleDateString(
                                  "pt-PT",
                              )
                            : "—"}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isDadosPending}
                            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDadosPending && (
                                <Loader2 size={14} className="animate-spin" />
                            )}
                            Guardar alterações
                        </button>
                    </div>
                </form>
            </section>

            {/* ━━━━ PLANO ━━━━ */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={20} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Plano do Educando
                    </h2>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Plano atual:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {planoLabel[dados.planoAtual] ?? dados.planoAtual}
                    </span>
                </p>

                {dados.pedidoPlanoPendente && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                        <Clock size={16} /> Já existe um pedido de alteração de
                        plano em análise.
                    </div>
                )}

                {planoState?.error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                        {planoState.error}
                    </div>
                )}
                {planoSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Check size={16} /> Pedido de alteração de plano enviado
                        com sucesso.
                    </div>
                )}

                {!dados.pedidoPlanoPendente && (
                    <div className="space-y-3">
                        {planosDisponiveis
                            .filter((p) => p.id !== dados.planoAtual)
                            .map((p) => (
                                <label
                                    key={p.id}
                                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                                        planoSelecionado === p.id
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="planoSelect"
                                            value={p.id}
                                            checked={planoSelecionado === p.id}
                                            onChange={() =>
                                                setPlanoSelecionado(p.id)
                                            }
                                            className="accent-blue-600"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {p.nome}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {p.descricao}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            ))}

                        {planoSelecionado && (
                            <form action={planoAction}>
                                <input
                                    type="hidden"
                                    name="plano"
                                    value={planoSelecionado}
                                />
                                <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 mt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <AlertTriangle
                                            size={16}
                                            className="text-blue-500"
                                        />
                                        <span className="text-blue-700 dark:text-blue-400">
                                            Alterar para{" "}
                                            <strong>
                                                {
                                                    planosDisponiveis.find(
                                                        (p) =>
                                                            p.id ===
                                                            planoSelecionado,
                                                    )?.nome
                                                }
                                            </strong>
                                            ? O pedido será analisado pelo
                                            administrador.
                                        </span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isPlanoPending}
                                        className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isPlanoPending && (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        )}
                                        Confirmar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

function Field({
    label,
    name,
    defaultValue,
    required,
}: {
    label: string;
    name: string;
    defaultValue: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="text"
                name={name}
                defaultValue={defaultValue}
                required={required}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
    );
}
