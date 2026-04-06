import { fetchAtletaDoResponsavel } from "@/app/lib/data";

export const dynamic = "force-dynamic";

export default async function ResponsavelEstatisticasPage() {
    const dados = await fetchAtletaDoResponsavel();

    const totalJogos = Number(dados?.estatisticas?.total_jogos ?? 0);
    const totalGolos = Number(dados?.estatisticas?.total_golos ?? 0);
    const totalAssistencias = Number(dados?.estatisticas?.total_assistencias ?? 0);
    const totalMinutos = Number(dados?.estatisticas?.total_minutos ?? 0);
    const totalTreinos = Number(dados?.assiduidade?.total_treinos ?? 0);
    const presencas = Number(dados?.assiduidade?.presencas ?? 0);
    const assiduidade = totalTreinos > 0 ? Math.round((presencas / totalTreinos) * 100) : null;
    const mediaGolos = totalJogos > 0 ? (totalGolos / totalJogos).toFixed(1) : null;

    const nomeEducando = dados?.atleta?.nome ?? "educando";

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Estatísticas
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Desempenho e presença de {nomeEducando} nos treinos e jogos.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Assiduidade", valor: assiduidade != null ? `${assiduidade}%` : "—", detalhe: totalTreinos > 0 ? `${presencas}/${totalTreinos} treinos` : "Sem registos", cor: "text-emerald-400", borda: "border-emerald-500/30", bg: "bg-emerald-500/5" },
                    { label: "Golos", valor: totalGolos > 0 ? String(totalGolos) : "—", detalhe: mediaGolos ? `${mediaGolos} / jogo` : "Sem registos", cor: "text-cyan-400", borda: "border-cyan-500/30", bg: "bg-cyan-500/5" },
                    { label: "Assistências", valor: totalAssistencias > 0 ? String(totalAssistencias) : "—", detalhe: totalJogos > 0 ? `${totalJogos} jogos` : "Sem registos", cor: "text-blue-400", borda: "border-blue-500/30", bg: "bg-blue-500/5" },
                    { label: "Min. Jogados", valor: totalMinutos > 0 ? String(totalMinutos) : "—", detalhe: totalJogos > 0 ? `${totalJogos} jogos` : "Sem registos", cor: "text-amber-400", borda: "border-amber-500/30", bg: "bg-amber-500/5" },
                ].map((m) => (
                    <div key={m.label} className={`${m.bg} border ${m.borda} rounded-xl p-5 space-y-2`}>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{m.label}</p>
                        <p className={`text-4xl font-bold ${m.cor}`}>{m.valor}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{m.detalhe}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
