import { fetchAtletaAtual } from '@/app/lib/data';

export const dynamic = 'force-dynamic';

const badgeColors: Record<string, string> = {
    green: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    orange: 'bg-amber-950 text-amber-400 border border-amber-800',
    blue: 'bg-cyan-950 text-cyan-400 border border-cyan-800',
    gray: 'bg-gray-800 text-gray-300 border border-gray-700',
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

function KpiCard({
    title,
    value,
    sub,
    color,
}: {
    title: string;
    value: string;
    sub: string;
    color?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {title}
            </span>
            <span
                className={`text-3xl font-bold font-mono ${color ?? 'text-gray-900 dark:text-white'}`}
            >
                {value}
            </span>
            <span className="text-xs text-gray-400">{sub}</span>
        </div>
    );
}

export default async function AtletaDashboard() {
    const dados = await fetchAtletaAtual();

    const nome = dados?.nome ?? '—';
    const primeiroNome = nome.split(' ')[0];
    const posicao = dados?.posicao ?? null;
    const numero = dados?.numero_camisola ?? null;
    const equipa = dados?.equipa_nome ?? null;
    const mao = dados?.mao_dominante ?? null;
    const estado = dados?.estado ?? null;

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

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            {/* Cabeçalho */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-3xl flex-shrink-0">
                    🏃
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Olá, {primeiroNome}!
                    </h2>
                    {(posicao || numero != null || equipa) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {[
                                posicao,
                                numero != null ? `Nº ${numero}` : null,
                                equipa,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {mao && <Badge label={mao} color="blue" />}
                        {estado && (
                            <Badge
                                label={estado}
                                color={estado === 'Ativo' ? 'green' : 'orange'}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Assiduidade"
                    value={assiduidade != null ? `${assiduidade}%` : '—'}
                    sub={
                        totalTreinos > 0
                            ? `${presencas}/${totalTreinos} treinos`
                            : 'Sem registos'
                    }
                    color="text-emerald-500"
                />
                <KpiCard
                    title="Golos Época"
                    value={totalGolos > 0 ? String(totalGolos) : '—'}
                    sub={mediaGolos ? `${mediaGolos} / jogo` : 'Sem registos'}
                />
                <KpiCard
                    title="Assistências"
                    value={
                        totalAssistencias > 0 ? String(totalAssistencias) : '—'
                    }
                    sub={
                        totalJogos > 0 ? `${totalJogos} jogos` : 'Sem registos'
                    }
                />
                <KpiCard
                    title="Min. Jogados"
                    value={totalMinutos > 0 ? String(totalMinutos) : '—'}
                    sub={
                        totalJogos > 0 ? `${totalJogos} jogos` : 'Sem registos'
                    }
                />
            </div>

            {/* Atalhos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="text-2xl">💪</span>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Condição Física
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Acede à secção{' '}
                        <span className="font-medium">Condição Física</span>{' '}
                        para ver os teus dados físicos.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="text-2xl">📅</span>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Calendário
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Acede ao <span className="font-medium">Calendário</span>{' '}
                        para ver os próximos treinos e jogos.
                    </p>
                </div>
            </div>
        </main>
    );
}
