import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { fetchAtletaById, fetchEquipas } from "@/app/lib/data";
import { notFound } from "next/navigation";
import RegistarPagamentoModal from "./_components/RegistarPagamentoModal.client";
import EditarAtletaModal from "../_components/EditarAtletaModal.client";

export const dynamic = 'force-dynamic';

const estadoStyle: Record<string, string> = {
    "ativo":    "bg-emerald-500/10 text-emerald-400",
    "suspenso": "bg-red-500/10 text-red-400",
    "inativo":  "bg-slate-500/10 text-slate-400",
};

const mensalidadeStyle: Record<string, string> = {
    "pago":      "bg-emerald-500/10 text-emerald-400",
    "em_atraso": "bg-red-500/10 text-red-400",
    "pendente":  "bg-amber-500/10 text-amber-400",
};

const mensalidadeLabel: Record<string, string> = {
    "pago":      "Pago",
    "em_atraso": "Em Atraso",
    "pendente":  "Pendente",
};

const mesesNomes: Record<number, string> = {
    1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr",
    5: "Mai", 6: "Jun", 7: "Jul", 8: "Ago",
    9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
};

export default async function AtletaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [{ atleta, mensalidades, estatisticas, assiduidade }, equipas] = await Promise.all([
        fetchAtletaById(id),
        fetchEquipas(),
    ]);

    if (!atleta) return notFound();

    const totalTreinos    = Number(assiduidade?.total_treinos ?? 0);
    const presencas       = Number(assiduidade?.presencas ?? 0);
    const percAssiduidade = totalTreinos > 0 ? Math.round((presencas / totalTreinos) * 100) : 0;
    const mensalidadeAtual = mensalidades[0];

    const estatisticasCards = [
        { label: "Jogos",           valor: Number(estatisticas?.total_jogos ?? 0) },
        { label: "Golos",           valor: Number(estatisticas?.total_golos ?? 0) },
        { label: "Assistências",    valor: Number(estatisticas?.total_assistencias ?? 0) },
        { label: "Cart. Amarelos",  valor: Number(estatisticas?.total_cartoes_amarelos ?? 0) },
        { label: "Cart. Vermelhos", valor: Number(estatisticas?.total_cartoes_vermelhos ?? 0) },
        { label: "Minutos",         valor: Number(estatisticas?.total_minutos ?? 0) },
    ];

    return (
        <div className="p-6 space-y-6">

            {/* Voltar + Cabeçalho */}
            <div>
                <Link
                    href="/dashboard/presidente/atletas"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Voltar aos Atletas
                </Link>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full bg-violet-600/20 border-2 border-violet-500/30 flex items-center justify-center">
                            <span className="text-2xl font-bold text-violet-400">
                                {atleta.numero_camisola != null ? `#${atleta.numero_camisola}` : "—"}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{atleta.nome}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {atleta.posicao ?? "—"} · {atleta.equipa_nome ?? "Sem equipa"}
                            </p>
                        </div>
                    </div>

                    {/* Badges + botão editar */}
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${estadoStyle[atleta.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                            {atleta.estado}
                        </span>
                        {mensalidadeAtual && (
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mensalidadeStyle[mensalidadeAtual.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                                {mensalidadeLabel[mensalidadeAtual.estado] ?? mensalidadeAtual.estado}
                            </span>
                        )}
                        <EditarAtletaModal
                            atleta={{
                                id:              atleta.id,
                                nome:            atleta.nome,
                                posicao:         atleta.posicao,
                                numero_camisola: atleta.numero_camisola,
                                equipa_id:       atleta.equipa_id,
                                estado:          atleta.estado,
                                federado:        atleta.federado,
                                numero_federado: atleta.numero_federado,
                                mao_dominante:   atleta.mao_dominante,
                            }}
                            equipas={equipas.map(e => ({ id: e.id, nome: e.nome }))}
                        />
                    </div>
                </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {estatisticasCards.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight">{stat.label}</p>
                        <p className="text-2xl font-bold text-cyan-400 mt-2">{stat.valor}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna esquerda */}
                <div className="space-y-4">

                    {/* Dados pessoais */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Dados Pessoais</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Data de Nascimento</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                                    {atleta.user_data_nascimento
                                        ? new Date(atleta.user_data_nascimento).toLocaleDateString("pt-PT")
                                        : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Federado</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                                    {atleta.federado ? `Sim — ${atleta.numero_federado ?? "s/n"}` : "Não"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Mão Dominante</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 capitalize">
                                    {atleta.mao_dominante ?? "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Contacto</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{atleta.user_email ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Telemóvel</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{atleta.user_telefone ?? "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Informações desportivas */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Informações Desportivas</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Equipa</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{atleta.equipa_nome ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Posição</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{atleta.posicao ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Número</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                                    {atleta.numero_camisola != null ? `#${atleta.numero_camisola}` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Estado</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-0.5 ${estadoStyle[atleta.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                                    {atleta.estado}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna direita */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Assiduidade */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Assiduidade</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-400 rounded-full transition-all"
                                    style={{ width: `${percAssiduidade}%` }}
                                />
                            </div>
                            <span className="text-lg font-bold text-cyan-400 w-14 text-right">{percAssiduidade}%</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {presencas} presenças em {totalTreinos} treinos ·{" "}
                            {percAssiduidade >= 90 ? "✅ Excelente assiduidade" : percAssiduidade >= 75 ? "⚠️ Assiduidade razoável" : "🔴 Assiduidade baixa"}
                        </p>
                    </div>

                    {/* Mensalidades */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Mensalidades</h2>
                            <RegistarPagamentoModal atletaId={atleta.id} />
                        </div>
                        {mensalidades.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma mensalidade registada.</p>
                        ) : (
                            <div className="space-y-2">
                                {mensalidades.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {mesesNomes[m.mes]} {m.ano}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {m.valor != null ? `€${Number(m.valor).toFixed(2)}` : "—"}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${mensalidadeStyle[m.estado] ?? "bg-slate-500/10 text-slate-400"}`}>
                                                {mensalidadeLabel[m.estado] ?? m.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

