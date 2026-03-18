'use client';

// ─── mock data (substitui por fetch real quando tiveres a API) ───────────────
const atleta = {
    nome: 'João Silva',
    posicao: 'Pivot',
    numero: 9,
    equipa: 'Seniores Masculinos',
    mao: 'Mão Direita',
    estado: 'Ativo',
    epoca: '24/25',
    proximoTreino: { hora: 'Terça 19h00', local: 'Pavilhão Municipal' },
};

const kpis = [
    {
        title: 'Assiduidade',
        value: '93%',
        sub: '28/30 treinos',
        color: 'text-emerald-500',
    },
    {
        title: 'Golos Época',
        value: '47',
        sub: '3.9 / jogo',
        color: 'text-gray-900 dark:text-white',
    },
    {
        title: 'Assistências',
        value: '18',
        sub: 'Top 3 equipa',
        color: 'text-gray-900 dark:text-white',
    },
    {
        title: 'Min. Jogados',
        value: '612',
        sub: '12 jogos',
        color: 'text-gray-900 dark:text-white',
    },
];

const condicaoFisica = [
    { label: 'Peso', valor: '88 kg', pct: 70, color: '#00d4ff' },
    { label: '% Gordura', valor: '11.2%', pct: 22, color: '#ef4444' },
    { label: 'Impulsão Vertical', valor: '55 cm', pct: 68, color: '#10b981' },
    { label: 'Velocidade (30m)', valor: '4.0s', pct: 80, color: '#f59e0b' },
];

const macros = [
    {
        label: 'Proteína',
        atual: '165g',
        meta: '180g',
        pct: 91,
        color: '#00d4ff',
    },
    {
        label: 'Hidratos',
        atual: '280g',
        meta: '320g',
        pct: 87,
        color: '#10b981',
    },
    { label: 'Gordura', atual: '62g', meta: '70g', pct: 88, color: '#f59e0b' },
];

const eventos = [
    {
        data: '4 Mar · 19h',
        tipo: 'Treino',
        tipoCor: 'purple',
        descricao: 'Sessão Tática + Físico',
        local: 'Pav. Municipal',
        estado: 'Confirmado',
        estadoCor: 'green',
    },
    {
        data: '7 Mar · 16h',
        tipo: 'Jogo',
        tipoCor: 'blue',
        descricao: 'vs Belenenses',
        local: 'Fora · Lisboa',
        estado: 'Pendente',
        estadoCor: 'orange',
    },
    {
        data: '8 Mar · 10h',
        tipo: 'Físico',
        tipoCor: 'orange',
        descricao: 'Avaliação Física Q1',
        local: 'Pav. Municipal',
        estado: 'Agendado',
        estadoCor: 'blue',
    },
];

const badgeColors: Record<string, string> = {
    green: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    red: 'bg-red-950 text-red-400 border border-red-800',
    orange: 'bg-amber-950 text-amber-400 border border-amber-800',
    blue: 'bg-cyan-950 text-cyan-400 border border-cyan-800',
    purple: 'bg-indigo-950 text-indigo-400 border border-indigo-800',
};

function Badge({ label, color }: { label: string; color: string }) {
    return (
        <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[color] ?? badgeColors.blue}`}
        >
            {label}
        </span>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AtletaDashboard() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            {/* ── Cabeçalho do atleta ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-3xl flex-shrink-0">
                    🏃
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {atleta.nome}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {atleta.posicao} · Nº {atleta.numero} · {atleta.equipa}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge label={atleta.mao} color="blue" />
                        <Badge label={atleta.estado} color="green" />
                        <Badge label={`Época ${atleta.epoca}`} color="purple" />
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Próximo treino
                    </p>
                    <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                        {atleta.proximoTreino.hora}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {atleta.proximoTreino.local}
                    </p>
                </div>
            </div>

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k) => (
                    <div
                        key={k.title}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2"
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {k.title}
                        </span>
                        <span
                            className={`text-3xl font-bold font-mono ${k.color}`}
                        >
                            {k.value}
                        </span>
                        <span className="text-xs text-gray-400">{k.sub}</span>
                    </div>
                ))}
            </div>

            {/* ── Condição Física + Plano Alimentar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Condição Física */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        💪 Condição Física
                    </span>
                    <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                        {condicaoFisica.map((s) => (
                            <div
                                key={s.label}
                                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                            >
                                <span className="text-sm text-gray-500 dark:text-gray-400 w-40 flex-shrink-0">
                                    {s.label}
                                </span>
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${s.pct}%`,
                                            background: s.color,
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-bold font-mono text-gray-900 dark:text-white w-14 text-right">
                                    {s.valor}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plano Alimentar */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        🥗 Plano Alimentar Hoje
                    </span>
                    <div className="flex flex-col gap-4">
                        {macros.map((m) => (
                            <div key={m.label}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                                        {m.label}
                                    </span>
                                    <span
                                        className="font-semibold"
                                        style={{ color: m.color }}
                                    >
                                        {m.atual} / {m.meta}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${m.pct}%`,
                                            background: m.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                        2.840 kcal consumidas de 3.200 kcal
                    </p>
                </div>
            </div>

            {/* ── Próximos Eventos ── */}
            <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    📅 Próximos Eventos
                    <span className="flex-1 border-t border-gray-200 dark:border-gray-800 ml-2" />
                </h3>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                {[
                                    'Data',
                                    'Tipo',
                                    'Descrição',
                                    'Local',
                                    'Estado',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {eventos.map((e) => (
                                <tr
                                    key={e.data}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {e.data}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            label={e.tipo}
                                            color={e.tipoCor}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {e.descricao}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {e.local}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            label={e.estado}
                                            color={e.estadoCor}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
