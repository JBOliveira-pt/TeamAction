import Link from "next/link";
import { fetchEquipas } from "@/app/lib/data";
import NovaEquipaModal from "./_components/NovaEquipaModal.client";

export const dynamic = 'force-dynamic';

const estadoStyle: Record<string, string> = {
    "ativa":        "bg-emerald-500/10 text-emerald-400",
    "periodo_off":  "bg-amber-500/10 text-amber-400",
    "inativa":      "bg-red-500/10 text-red-400",
};

export default async function EquipasPage() {
    const equipas = await fetchEquipas();

    const totalAtletas = equipas.reduce((acc, e) => acc + Number(e.total_atletas), 0);
    const equipasAtivas = equipas.filter(e => e.estado === "ativa").length;

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Época 2024/2025 · {equipas.length} escalões</p>
                </div>
                <NovaEquipaModal />
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Equipas</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{equipas.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Equipas Ativas</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{equipasAtivas}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Atletas</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{totalAtletas}</p>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {equipas.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhuma equipa registada ainda.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4">Escalão</th>
                                <th className="text-left px-6 py-4">Treinador</th>
                                <th className="text-left px-6 py-4">Atletas</th>
                                <th className="text-left px-6 py-4">Estado</th>
                                <th className="text-left px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipas.map((e) => (
                                <tr key={e.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{e.nome}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{e.escalao}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{e.nome_treinador ?? "—"}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{Number(e.total_atletas)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[e.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                                            {e.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/dashboard/presidente/equipas/${e.id}`} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                            Ver equipa →
                                        </Link>
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


