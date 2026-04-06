import {
    fetchAtletaAtual,
    fetchCondicaoFisica,
    fetchJogosAtleta,
    fetchSessoesAtleta,
} from "@/app/lib/data";

export const dynamic = "force-dynamic";

const badgeColors: Record<string, string> = {
    green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    orange: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    blue: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    gray: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
};

function Badge({ label, color }: { label: string; color: string }) {
    return (
        <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[color] ?? badgeColors.gray}`}
        >
            {label}
        </span>
    );
}

function InfoRow({
    label,
    value,
    badgeColor,
}: {
    label: string;
    value: string;
    badgeColor: string;
}) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <Badge label={value} color={badgeColor} />
        </div>
    );
}

function resolveClube(dados: {
    clube_nome: string | null;
    clube_pendente: string | null;
}): { value: string; color: string } {
    if (dados.clube_nome)
        return { value: `${dados.clube_nome}`, color: "green" };
    if (dados.clube_pendente)
        return { value: `Pendente — ${dados.clube_pendente}`, color: "orange" };
    return { value: "Sem clube", color: "gray" };
}

function resolveEquipa(equipa_nome: string | null): {
    value: string;
    color: string;
} {
    if (equipa_nome)
        return { value: `Associado — ${equipa_nome}`, color: "green" };
    return { value: "Sem equipa", color: "gray" };
}

function resolveTreinador(treinador_nome: string | null): {
    value: string;
    color: string;
} {
    if (treinador_nome)
        return { value: `Associado — ${treinador_nome}`, color: "green" };
    return { value: "Sem treinador", color: "gray" };
}

function resolveResponsavel(dados: {
    responsavel_associado: boolean;
    encarregado: string | null;
    responsavel_pendente: boolean;
}): { value: string; color: string } {
    if (dados.responsavel_associado)
        return { value: "Associado", color: "green" };
    if (dados.encarregado)
        return { value: `${dados.encarregado} (pendente)`, color: "orange" };
    if (dados.responsavel_pendente)
        return { value: "Pendente", color: "orange" };
    return { value: "Sem responsável", color: "gray" };
}

export default async function AtletaDashboard() {
    const [dados, jogos, sessoes, condicaoFisica] = await Promise.all([
        fetchAtletaAtual(),
        fetchJogosAtleta(),
        fetchSessoesAtleta(),
        fetchCondicaoFisica(),
    ]);

    const ultimaMedida =
        condicaoFisica.length > 0
            ? condicaoFisica[condicaoFisica.length - 1]
            : null;
    const cfAltura = ultimaMedida?.altura ?? null;
    const cfPeso = ultimaMedida?.peso ?? null;
    const cfIMC =
        cfAltura && cfPeso && cfAltura > 0
            ? (cfPeso / (cfAltura / 100) ** 2).toFixed(1)
            : null;
    const cfDataRegisto = ultimaMedida?.data_registo
        ? new Date(ultimaMedida.data_registo).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : null;

    const now = new Date();
    const proximosJogos = jogos
        .filter((j) => {
            const data = new Date(j.data);
            return (
                Number.isFinite(data.getTime()) &&
                data.getTime() >= now.getTime() &&
                j.estado === "agendado"
            );
        })
        .sort(
            (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
        );

    const proximosTreinos = sessoes
        .filter((s) => {
            const data = new Date(s.data);
            return (
                Number.isFinite(data.getTime()) &&
                data.getTime() >= now.getTime()
            );
        })
        .sort(
            (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
        );

    const proximoEventoData =
        [proximosTreinos[0]?.data ?? null, proximosJogos[0]?.data ?? null]
            .filter((d): d is string => !!d)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ??
        null;

    const proximoEventoTexto = proximoEventoData
        ? new Date(proximoEventoData).toLocaleDateString("pt-PT", {
              weekday: "short",
              day: "2-digit",
              month: "short",
          })
        : null;

    const nome = dados?.nome ?? "—";
    const primeiroNome = nome.split(" ")[0];

    const totalJogos = Number(dados?.estatisticas?.total_jogos ?? 0);
    const totalGolos = Number(dados?.estatisticas?.total_golos ?? 0);
    const totalAssistencias = Number(
        dados?.estatisticas?.total_assistencias ?? 0,
    );
    const totalMinutos = Number(dados?.estatisticas?.total_minutos ?? 0);
    const totalTreinos = Number(dados?.assiduidade?.total_treinos ?? 0);
    const presencas = Number(dados?.assiduidade?.presencas ?? 0);
    const assiduidade =
        totalTreinos > 0 ? Math.round((presencas / totalTreinos) * 100) : null;
    const mediaGolos =
        totalJogos > 0 ? (totalGolos / totalJogos).toFixed(1) : null;

    const clube = resolveClube({
        clube_nome: dados?.clube_nome ?? null,
        clube_pendente: dados?.clube_pendente ?? null,
    });
    const equipa = resolveEquipa(dados?.equipa_nome ?? null);
    const treinador = resolveTreinador(dados?.treinador_nome ?? null);
    const responsavel = resolveResponsavel({
        responsavel_associado: dados?.responsavel_associado ?? false,
        encarregado: dados?.encarregado ?? null,
        responsavel_pendente: dados?.responsavel_pendente ?? false,
    });

    return (
        <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
            {/* Cabeçalho */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Bem-vindo, {primeiroNome} 👋
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date().toLocaleDateString("pt-PT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                    })}
                </p>
            </div>

            {/* Primeira linha: Infos do Atleta + Condição Física + Calendário */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Infos do Atleta */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        📋 Infos do Atleta
                    </h2>
                    <div className="flex flex-col">
                        <InfoRow
                            label="Clube"
                            value={clube.value}
                            badgeColor={clube.color}
                        />
                        <InfoRow
                            label="Equipa"
                            value={equipa.value}
                            badgeColor={equipa.color}
                        />
                        <InfoRow
                            label="Treinador"
                            value={treinador.value}
                            badgeColor={treinador.color}
                        />
                        {dados?.menor_idade && (
                            <InfoRow
                                label="Responsável"
                                value={responsavel.value}
                                badgeColor={responsavel.color}
                            />
                        )}
                    </div>
                </div>

                {/* Condição Física */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                    {ultimaMedida ? (
                        <>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                💪 Condição Física
                            </h2>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Altura
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {cfAltura} cm
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Peso
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {cfPeso} kg
                                    </span>
                                </div>
                                {cfIMC && (
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            IMC
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {cfIMC}
                                        </span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Último registo: {cfDataRegisto}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
                            <span className="text-2xl">💪</span>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Condição Física
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Sem registos de condição física.
                            </p>
                        </div>
                    )}
                </div>

                {/* Calendário */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                    {proximosTreinos.length + proximosJogos.length > 0 ? (
                        <>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                📅 Calendário
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {`${proximosTreinos.length} treino(s) e ${proximosJogos.length} jogo(s) por realizar${proximoEventoTexto ? ` · próximo: ${proximoEventoTexto}` : ""}`}
                            </p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
                            <span className="text-2xl">📅</span>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Calendário
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Sem treinos ou jogos agendados no momento.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Assiduidade",
                        valor: assiduidade != null ? `${assiduidade}%` : "—",
                        detalhe:
                            totalTreinos > 0
                                ? `${presencas}/${totalTreinos} treinos`
                                : "Sem registos",
                        cor: "text-emerald-400",
                        borda: "border-emerald-500/30",
                        bg: "bg-emerald-500/5",
                        icon: "✅",
                    },
                    {
                        label: "Golos Época",
                        valor: totalGolos > 0 ? String(totalGolos) : "—",
                        detalhe: mediaGolos
                            ? `${mediaGolos} / jogo`
                            : "Sem registos",
                        cor: "text-cyan-400",
                        borda: "border-cyan-500/30",
                        bg: "bg-cyan-500/5",
                        icon: "⚽",
                    },
                    {
                        label: "Assistências",
                        valor:
                            totalAssistencias > 0
                                ? String(totalAssistencias)
                                : "—",
                        detalhe:
                            totalJogos > 0
                                ? `${totalJogos} jogos`
                                : "Sem registos",
                        cor: "text-blue-400",
                        borda: "border-blue-500/30",
                        bg: "bg-blue-500/5",
                        icon: "🤝",
                    },
                    {
                        label: "Min. Jogados",
                        valor: totalMinutos > 0 ? String(totalMinutos) : "—",
                        detalhe:
                            totalJogos > 0
                                ? `${totalJogos} jogos`
                                : "Sem registos",
                        cor: "text-amber-400",
                        borda: "border-amber-500/30",
                        bg: "bg-amber-500/5",
                        icon: "⏱️",
                    },
                ].map((m) => (
                    <div
                        key={m.label}
                        className={`${m.bg} border ${m.borda} rounded-xl p-5 space-y-2`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-snug">
                                {m.label}
                            </p>
                            <span className="text-lg">{m.icon}</span>
                        </div>
                        <p className={`text-4xl font-bold ${m.cor}`}>
                            {m.valor}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {m.detalhe}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
