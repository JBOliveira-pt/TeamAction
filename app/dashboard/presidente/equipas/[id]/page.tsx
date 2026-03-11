import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { fetchEquipaById } from "@/app/lib/data";
import { notFound } from "next/navigation";

const estadoEquipaStyle: Record<string, string> = {
    "ativa": "bg-emerald-500/10 text-emerald-400",
    "periodo_off": "bg-amber-500/10 text-amber-400",
    "inativa": "bg-red-500/10 text-red-400",
};

const atletaEstadoStyle: Record<string, string> = {
    "ativo": "bg-emerald-500/10 text-emerald-400",
    "suspenso": "bg-amber-500/10 text-amber-400",
    "inativo": "bg-red-500/10 text-red-400",
};

export default async function EquipaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { equipa, atletas, staff, jogos } = await fetchEquipaById(id);

    if (!equipa) return notFound();

    // Calcular stats a partir dos jogos reais
    const jogosRealizados = jogos.filter(j => j.estado === "realizado");
    const vitorias = jogosRealizados.filter(j => j.resultado_nos != null && j.resultado_adv != null && j.resultado_nos > j.resultado_adv).length;
    const derrotas = jogosRealizados.filter(j => j.resultado_nos != null && j.resultado_adv != null && j.resultado_nos < j.resultado_adv).length;
    const empates = jogosRealizados.filter(j => j.resultado_nos != null && j.resultado_adv != null && j.resultado_nos === j.resultado_adv).length;
    const golosMarcados = jogosRealizados.reduce((acc, j) => acc + (j.resultado_nos ?? 0), 0);
    const golosSofridos = jogosRealizados.reduce((acc, j) => acc + (j.resultado_adv ?? 0), 0);
    const pontosPerc = jogosRealizados.length > 0 ? Math.round((vitorias / jogosRealizados.length) * 100) : 0;

    const treinador = staff.find(s => s.funcao === "treinador");

    return (
        <div className="p-6 space-y-6">

            {/* Voltar + Cabeçalho */}
            <div>
                <Link
                    href="/dashboard/presidente/equipas"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Voltar às Equipas
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{equipa.nome}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{equipa.escalao} · {equipa.desporto}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${estadoEquipaStyle[equipa.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                        {equipa.estado}
                    </span>
                </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vitórias</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{vitorias}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Empates</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{empates}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Derrotas</p>
                    <p className="text-3xl font-bold text-red-400 mt-2">{derrotas}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">% Vitórias</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{pontosPerc}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna esquerda — Info + Jogos */}
                <div className="space-y-4">

                    {/* Info da equipa */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Informações</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Treinador</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{treinador?.nome ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Staff Técnico</p>
                                {staff.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">—</p>
                                ) : (
                                    staff.map(s => (
                                        <p key={s.id} className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                                            {s.nome} <span className="text-gray-400 dark:text-gray-500 text-xs">({s.funcao})</span>
                                        </p>
                                    ))
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Golos Marcados / Sofridos</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                                    {golosMarcados} <span className="text-gray-400 dark:text-gray-500">/</span> {golosSofridos}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Jogos */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Jogos</h2>
                        {jogos.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum jogo registado.</p>
                        ) : (
                            jogos.map((jogo) => (
                                <div key={jogo.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{jogo.adversario}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(jogo.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })} · {jogo.casa_fora}
                                        </p>
                                    </div>
                                    {jogo.resultado_nos != null ? (
                                        <span className="text-sm font-bold text-cyan-400">{jogo.resultado_nos}-{jogo.resultado_adv}</span>
                                    ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Agendado</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Coluna direita — Atletas */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Atletas ({atletas.length})</h2>
                            <button className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                + Adicionar Atleta
                            </button>
                        </div>
                        {atletas.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhum atleta nesta equipa.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                        <th className="text-left px-6 py-3">Nome</th>
                                        <th className="text-left px-6 py-3">Nº</th>
                                        <th className="text-left px-6 py-3">Posição</th>
                                        <th className="text-left px-6 py-3">Estado</th>
                                        <th className="text-left px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atletas.map((atleta) => (
                                        <tr key={atleta.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{atleta.nome}</td>
                                            <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                                                {atleta.numero_camisola != null ? `#${atleta.numero_camisola}` : "—"}
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{atleta.posicao ?? "—"}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${atletaEstadoStyle[atleta.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                                                    {atleta.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <Link href={`/dashboard/presidente/atletas/${atleta.id}`} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
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
            </div>
        </div>
    );
}

