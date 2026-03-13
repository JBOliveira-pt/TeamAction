'use client';

import { Trophy } from 'lucide-react';

const jogosMock: {
    data: string;
    adversario: string;
    resultado: string;
    estado: 'V' | 'D' | 'E';
    local: string;
}[] = [];

const estadoStyle: Record<string, string> = {
    V: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    D: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    E: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function PaiJogosPage() {
    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Jogos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Resultados e participação do teu filho nos jogos.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {jogosMock.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                            <Trophy size={28} className="text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Nenhum jogo registado
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Os jogos desta época aparecerão aqui.
                            </p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Adversário
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Resultado
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Local
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {jogosMock.map((j, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                        {j.data}
                                    </td>
                                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                                        {j.adversario}
                                    </td>
                                    <td className="px-5 py-4 text-gray-700 dark:text-gray-200">
                                        {j.resultado}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                        {j.local}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoStyle[j.estado]}`}
                                        >
                                            {j.estado === 'V'
                                                ? 'Vitória'
                                                : j.estado === 'D'
                                                  ? 'Derrota'
                                                  : 'Empate'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
