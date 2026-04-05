import {
    fetchAdminConvitesClubeAll,
    fetchAdminConvitesEquipaAll,
    fetchAdminRelacoesPendentes,
} from "@/app/lib/admin-data";

export const dynamic = "force-dynamic";

type SearchParams = {
    tab?: string;
};

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    if (s === "pendente") {
        return (
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Pendente
            </span>
        );
    }
    if (s === "aceite" || s === "aceito" || s === "aprovado") {
        return (
            <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {status}
            </span>
        );
    }
    if (s === "recusado" || s === "rejeitado") {
        return (
            <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                {status}
            </span>
        );
    }
    return (
        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {status}
        </span>
    );
}

function TipoBadge({ tipo }: { tipo: string }) {
    const t = tipo?.toLowerCase();
    if (t === "treinador") {
        return (
            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Treinador
            </span>
        );
    }
    if (t === "atleta") {
        return (
            <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Atleta
            </span>
        );
    }
    if (t === "equipa") {
        return (
            <span className="inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                Equipa
            </span>
        );
    }
    return (
        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {tipo}
        </span>
    );
}

export default async function AdminConvitesPage({
    searchParams,
}: {
    searchParams?: Promise<SearchParams>;
}) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const tab = resolvedSearchParams?.tab || "clube";

    const [convitesClubeAll, convitesEquipaAll, relacoesPendentes] =
        await Promise.all([
            fetchAdminConvitesClubeAll(),
            fetchAdminConvitesEquipaAll(),
            fetchAdminRelacoesPendentes(),
        ]);

    const pendentesClube = convitesClubeAll.filter(
        (c) => c.estado?.toLowerCase() === "pendente",
    ).length;
    const pendentesEquipa = convitesEquipaAll.filter(
        (c) => c.estado?.toLowerCase() === "pendente",
    ).length;
    const pendentesRelacoes = relacoesPendentes.filter(
        (r) => r.status?.toLowerCase() === "pendente",
    ).length;

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Convites e Relações Pendentes
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Visão geral de todos os convites de clube, equipa e relações
                    pendentes de confirmação.
                </p>
            </header>

            {/* Tab navigation */}
            <div className="flex gap-2">
                {[
                    {
                        id: "clube",
                        label: "Convites de Clube",
                        count: pendentesClube,
                    },
                    {
                        id: "equipa",
                        label: "Convites de Equipa",
                        count: pendentesEquipa,
                    },
                    {
                        id: "relacoes",
                        label: "Relações Pendentes",
                        count: pendentesRelacoes,
                    },
                ].map((t) => (
                    <a
                        key={t.id}
                        href={`/admin/convites?tab=${t.id}`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            tab === t.id
                                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                                {t.count}
                            </span>
                        )}
                    </a>
                ))}
            </div>

            {/* Tab content */}
            {tab === "clube" && (
                <div className="space-y-3">
                    {convitesClubeAll.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                            Nenhum convite de clube registado.
                        </div>
                    ) : (
                        convitesClubeAll.map((c) => (
                            <article
                                key={c.id}
                                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {c.convidado_nome}{" "}
                                            <span className="text-gray-500 dark:text-gray-400">
                                                ({c.convidado_email})
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            {c.clube_nome && (
                                                <span>
                                                    Clube: {c.clube_nome}
                                                </span>
                                            )}
                                            {c.equipa_nome && (
                                                <span>
                                                    Equipa: {c.equipa_nome}
                                                </span>
                                            )}
                                        </div>
                                        {c.convidado_por_nome && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Convidado por:{" "}
                                                {c.convidado_por_nome}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(
                                                c.created_at,
                                            ).toLocaleString("pt-PT")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TipoBadge tipo={c.tipo_convite} />
                                        <StatusBadge status={c.estado} />
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            )}

            {tab === "equipa" && (
                <div className="space-y-3">
                    {convitesEquipaAll.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                            Nenhum convite de equipa registado.
                        </div>
                    ) : (
                        convitesEquipaAll.map((c) => (
                            <article
                                key={c.id}
                                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {c.convidado_nome}{" "}
                                            <span className="text-gray-500 dark:text-gray-400">
                                                ({c.convidado_email})
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            {c.clube_nome && (
                                                <span>
                                                    Clube: {c.clube_nome}
                                                </span>
                                            )}
                                            {c.equipa_nome && (
                                                <span>
                                                    Equipa: {c.equipa_nome}
                                                </span>
                                            )}
                                        </div>
                                        {c.convidado_por_nome && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Convidado por:{" "}
                                                {c.convidado_por_nome}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(
                                                c.created_at,
                                            ).toLocaleString("pt-PT")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TipoBadge tipo="equipa" />
                                        <StatusBadge status={c.estado} />
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            )}

            {tab === "relacoes" && (
                <div className="space-y-3">
                    {relacoesPendentes.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                            Nenhuma relação pendente registada.
                        </div>
                    ) : (
                        relacoesPendentes.map((r) => (
                            <article
                                key={r.id}
                                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {r.atleta_nome}{" "}
                                            <span className="text-gray-500 dark:text-gray-400">
                                                ({r.atleta_email})
                                            </span>
                                        </p>
                                        {r.alvo_clube_nome && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Clube destino:{" "}
                                                {r.alvo_clube_nome}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(
                                                r.created_at,
                                            ).toLocaleString("pt-PT")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TipoBadge tipo={r.tipo} />
                                        <StatusBadge status={r.status} />
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
