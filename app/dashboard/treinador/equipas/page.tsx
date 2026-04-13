// Página de equipas do treinador.
import { fetchEscaloes, fetchDesportoOrg } from "@/app/lib/data";
import NovaEquipaModal from "./_components/NovaEquipaModal.client";
import EditarEquipaModal from "./_components/EditarEquipaModal.client";
import EliminarEquipaModal from "./_components/EliminarEquipaModal.client";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const estadoStyle: Record<string, string> = {
    ativa: "bg-emerald-500/10 text-emerald-400",
    periodo_off: "bg-amber-500/10 text-amber-400",
    inativa: "bg-red-500/10 text-red-400",
};

const estadoLabel: Record<string, string> = {
    ativa: "Ativa",
    periodo_off: "Período Off",
    inativa: "Inativa",
};

async function fetchEquipasTreinador() {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const orgId = user[0]?.organization_id;
    const internalUserId = user[0]?.id;
    if (!orgId || !internalUserId) return [];

    return sql<
        {
            id: string;
            nome: string;
            escalao: string;
            estado: string;
            desporto: string;
            total_atletas: number;
            is_club_team: boolean;
        }[]
    >`
        SELECT e.id, e.nome, e.escalao, e.estado, e.desporto,
               COUNT(a.id) AS total_atletas,
               EXISTS (
                   SELECT 1 FROM staff s
                   WHERE s.equipa_id = e.id
                     AND s.organization_id = ${orgId}
                     AND s.funcao IN ('Treinador Principal', 'Treinador Adjunto')
               ) AS is_club_team
        FROM equipas e
        LEFT JOIN atletas a ON a.equipa_id = e.id
        WHERE e.organization_id = ${orgId} AND e.treinador_id = ${internalUserId}
        GROUP BY e.id, e.nome, e.escalao, e.estado, e.desporto
        ORDER BY e.nome ASC
    `;
}

async function fetchDesportoTreinador(): Promise<string> {
    // Tenta obter o desporto do clube (se existir)
    try {
        const desporto = await fetchDesportoOrg();
        if (desporto) return desporto;
    } catch {}

    // Fallback: obter do desporto das equipas existentes do treinador
    const { userId } = await auth();
    if (!userId) return "";

    const result = await sql<{ desporto: string }[]>`
        SELECT e.desporto FROM equipas e
        INNER JOIN users u ON u.id = e.treinador_id
        WHERE u.clerk_user_id = ${userId} AND e.desporto IS NOT NULL AND e.desporto <> '' AND e.desporto <> 'Não definido'
        LIMIT 1
    `;
    return result[0]?.desporto ?? "";
}

export default async function EquipasTreinadorPage({
    searchParams,
}: {
    searchParams?: Promise<{ new?: string }>;
}) {
    const params = await searchParams;

    const [equipas, escaloes, desporto] = await Promise.all([
        fetchEquipasTreinador(),
        fetchEscaloes(),
        fetchDesportoTreinador(),
    ]);

    const abrirModal = params?.new === "true";
    const totalAtletas = equipas.reduce(
        (acc, e) => acc + Number(e.total_atletas),
        0,
    );
    const equipasAtivas = equipas.filter((e) => e.estado === "ativa").length;

    return (
        <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                        <span>⚽</span> Equipas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {desporto && (
                            <span className="font-medium text-violet-400">
                                {desporto} ·{" "}
                            </span>
                        )}
                        {equipas.length} equipas registadas
                    </p>
                </div>
                <NovaEquipaModal
                    escaloes={escaloes}
                    desporto={desporto}
                    defaultOpen={abrirModal}
                />
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Total de Equipas
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {equipas.length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Equipas Ativas
                    </p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">
                        {equipasAtivas}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Total de Atletas
                    </p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">
                        {totalAtletas}
                    </p>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {equipas.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
                        Nenhuma equipa registada ainda. Cria a tua primeira
                        equipa!
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4">Escalão</th>
                                <th className="text-left px-6 py-4">Atletas</th>
                                <th className="text-left px-6 py-4">Estado</th>
                                <th className="text-left px-6 py-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipas.map((e) => (
                                <tr
                                    key={e.id}
                                    className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                        {e.nome}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {e.escalao}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {Number(e.total_atletas)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[e.estado] ?? "bg-slate-500/10 text-slate-400"}`}
                                        >
                                            {estadoLabel[e.estado] ?? e.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {!e.is_club_team ? (
                                            <div className="flex items-center gap-1">
                                                <EditarEquipaModal
                                                    equipa={{
                                                        id: e.id,
                                                        nome: e.nome,
                                                        escalao: e.escalao,
                                                        estado: e.estado,
                                                    }}
                                                />
                                                <EliminarEquipaModal
                                                    equipaId={e.id}
                                                    equipaNome={e.nome}
                                                    totalAtletas={Number(
                                                        e.total_atletas,
                                                    )}
                                                />
                                            </div>
                                        ) : (
                                            <span
                                                className="text-xs text-gray-400 dark:text-gray-500"
                                                title="Equipa atribuída pelo clube — só o presidente pode editar"
                                            >
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
