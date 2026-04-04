import Link from "next/link";
import {
    fetchEquipas,
    fetchEscaloes,
    fetchDesportoOrg,
    fetchTreinadoresOrg,
    fetchAtletasByEquipa,
} from "@/app/lib/data";
import NovaEquipaModal from "./_components/NovaEquipaModal.client";
import EditarEquipaModal from "./_components/EditarEquipaModal.client";
import EliminarEquipaModal from "./_components/EliminarEquipaModal.client";

export const dynamic = "force-dynamic";

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

export default async function EquipasPage() {
    const [equipas, escaloes, desporto, treinadores] = await Promise.all([
        fetchEquipas(),
        fetchEscaloes(),
        fetchDesportoOrg(),
        fetchTreinadoresOrg(),
    ]);

    // Buscar atletas de todas as equipas em paralelo
    const atletasPorEquipa = Object.fromEntries(
        await Promise.all(
            equipas.map(
                async (e) => [e.id, await fetchAtletasByEquipa(e.id)] as const,
            ),
        ),
    );

    const totalAtletas = equipas.reduce(
        (acc, e) => acc + Number(e.total_atletas),
        0,
    );
    const equipasAtivas = equipas.filter((e) => e.estado === "ativa").length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Equipas
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
                    treinadores={treinadores}
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
                        Nenhuma equipa registada ainda.
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4">Escalão</th>
                                <th className="text-left px-6 py-4">
                                    Treinador
                                </th>
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
                                        {e.nome_treinador ?? "—"}
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
                                        <div className="flex items-center gap-1">
                                            <Link
                                                href={`/dashboard/presidente/equipas/${e.id}`}
                                                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors mr-2"
                                            >
                                                Ver →
                                            </Link>
                                            <EditarEquipaModal
                                                equipa={{
                                                    id: e.id,
                                                    nome: e.nome,
                                                    escalao: e.escalao,
                                                    estado: e.estado,
                                                    treinador_id:
                                                        e.treinador_id,
                                                }}
                                                escaloes={escaloes}
                                                treinadores={treinadores}
                                                atletasIniciais={
                                                    atletasPorEquipa[e.id] ?? []
                                                }
                                            />
                                            <EliminarEquipaModal
                                                equipaId={e.id}
                                                equipaNome={e.nome}
                                                totalAtletas={Number(
                                                    e.total_atletas,
                                                )}
                                            />
                                        </div>
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
