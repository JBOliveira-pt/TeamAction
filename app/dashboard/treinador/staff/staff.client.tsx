// Componente cliente de staff (treinador).
"use client";

export type StaffMembro = {
    id: string;
    nome: string;
    funcao: string;
    equipa_id: string | null;
    equipa_nome: string | null;
    equipa_escalao: string | null;
    user_id: string | null;
    user_email: string | null;
    created_at: string;
};

const funcaoColors: Record<string, string> = {
    "Treinador Principal":
        "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    "Treinador Adjunto":
        "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Fisioterapeuta:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "Preparador Físico":
        "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    "Team Manager": "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    Médico: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    Nutricionista: "bg-lime-500/10 text-lime-400 border border-lime-500/20",
    Delegado: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
};

function getFuncaoColor(funcao: string) {
    return (
        funcaoColors[funcao] ??
        "bg-slate-500/10 text-slate-400 border border-slate-500/20"
    );
}

type Props = {
    hasClub: boolean;
    staff: StaffMembro[];
};

function PageHeader({ subtitle }: { subtitle: string }) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <span>🧑‍💼</span>
                Staff
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
            </p>
        </div>
    );
}

export default function Staff({ hasClub, staff }: Props) {
    if (!hasClub) {
        return (
            <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 space-y-6">
                <PageHeader subtitle="Equipa técnica do clube" />
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center space-y-3">
                    <div className="text-4xl">🏛️</div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                        Sem clube atribuído
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                        O staff é atribuído pelo presidente quando fores
                        vinculado a um clube. Quando isso acontecer, o staff
                        aparecerá aqui.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 space-y-6">
            <PageHeader
                subtitle={`${staff.length} ${staff.length === 1 ? "membro" : "membros"} na equipa técnica`}
            />

            {staff.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center space-y-3">
                    <div className="text-4xl">👥</div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                        Sem staff registado
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        O presidente ainda não adicionou membros de staff ao
                        clube.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">Nome</th>
                                <th className="text-left px-6 py-4">Função</th>
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4">Desde</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s) => (
                                <tr
                                    key={s.id}
                                    className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-amber-500">
                                                    {s.nome
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {s.nome}
                                                    {!s.user_id && (
                                                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                            🤖 Fictício
                                                        </span>
                                                    )}
                                                </p>
                                                {s.user_email && (
                                                    <p className="text-xs text-gray-400">
                                                        {s.user_email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getFuncaoColor(s.funcao)}`}
                                        >
                                            {s.funcao}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.equipa_nome ? (
                                            <div>
                                                <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                    {s.equipa_nome}
                                                </p>
                                                {s.equipa_escalao && (
                                                    <p className="text-xs text-gray-400">
                                                        {s.equipa_escalao}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-gray-400">
                                                Sem equipa
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                                        {s.created_at
                                            ? new Date(
                                                  s.created_at,
                                              ).toLocaleDateString("pt-PT")
                                            : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
