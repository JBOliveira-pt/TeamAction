import Link from "next/link";
import { fetchAtletas, fetchEquipas } from "@/app/lib/data";
import AdicionarAtletaModal from "./_components/AdicionarAtletaModal.client";

export const dynamic = 'force-dynamic';

const estadoStyle: Record<string, string> = {
    "ativo": "bg-emerald-500/10 text-emerald-400",
    "suspenso": "bg-red-500/10 text-red-400",
    "inativo": "bg-slate-500/10 text-slate-400",
};

const mensalidadeStyle: Record<string, string> = {
    "pago": "text-emerald-400",
    "em_atraso": "text-red-400",
    "pendente": "text-amber-400",
};

const mensalidadeLabel: Record<string, string> = {
    "pago": "Pago",
    "em_atraso": "Em Atraso",
    "pendente": "Pendente",
};

export default async function AtletasPage() {
    const [atletas, equipas] = await Promise.all([
        fetchAtletas(),
        fetchEquipas(),
    ]);

    const ativos = atletas.filter(a => a.estado === "ativo").length;
    const suspensos = atletas.filter(a => a.estado === "suspenso").length;
    const emAtraso = atletas.filter(a => a.mensalidade_estado === "em_atraso").length;

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atletas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{atletas.length} atletas registados</p>
                </div>
                <AdicionarAtletaModal equipas={equipas.map(e => ({ id: e.id, nome: e.nome }))} />
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{atletas.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ativos</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{ativos}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Suspensos</p>
                    <p className="text-3xl font-bold text-red-400 mt-2">{suspensos}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-amber-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Mensalidades em Atraso</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{emAtraso}</p>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {atletas.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
                        Nenhum atleta registado ainda.
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">Atleta</th>
                                <th className="text-left px-6 py-4">Nº</th>
                                <th className="text-left px-6 py-4">Posição</th>
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4">Mensalidade</th>
                                <th className="text-left px-6 py-4">Estado</th>
                                <th className="text-left px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {atletas.map((a) => (
                                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{a.nome}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {a.numero_camisola != null ? `#${a.numero_camisola}` : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{a.posicao ?? "—"}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{a.equipa_nome ?? "—"}</td>
                                    <td className={`px-6 py-4 font-medium ${mensalidadeStyle[a.mensalidade_estado ?? ""] ?? "text-gray-400"}`}>
                                        {mensalidadeLabel[a.mensalidade_estado ?? ""] ?? "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyle[a.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                                            {a.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/dashboard/presidente/atletas/${a.id}`} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                            Ver perfil →
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


