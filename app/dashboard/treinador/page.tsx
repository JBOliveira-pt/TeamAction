"use client";
import Link from "next/link";
import SidebarEquipas from "./components/SidebarEquipas";
import { atletasIniciais } from "./equipa-atletas/equipaatletas";
import { staffInicial } from "./equipa-tecnica/equipatecnica";

export default function TreinadorDashboard() {
    const userName = "Treinador João";
    const equipa = "Seniores Masculinos";
    const nAtletas = atletasIniciais.length;
    const atletas = atletasIniciais;
    const staff = staffInicial;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen p-6">
            {/* Layout com sidebar à esquerda */}
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar de equipas */}
                <SidebarEquipas atletas={atletas} staff={staff} />
                <div className="flex-1">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                Olá,{" "}
                                <span className="text-blue-600 dark:text-blue-400">
                                    {userName}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {equipa} · {nAtletas} atletas
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            <Link
                                href="/dashboard/treinador/sessoes"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition-all"
                            >
                                Nova Sessão
                            </Link>
                            <Link
                                href="/dashboard/treinador/assiduidade"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-all"
                            >
                                Registar Presença
                            </Link>
                            <Link
                                href="/dashboard/treinador/estatisticas-ao-vivo"
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold shadow hover:bg-gray-900 transition-all"
                            >
                                Ver Estatísticas
                            </Link>
                        </div>
                    </div>

                    {/* Notificações/avisos */}
                    <div className="mb-8">
                        <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 flex items-center gap-4 mb-2">
                            <span className="text-2xl">🔔</span>
                            <div>
                                <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    Aviso: Treino de amanhã alterado para 21:00!
                                </div>
                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                    13 Mar 2026
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-4">
                            <span className="text-2xl">📄</span>
                            <div>
                                <div className="font-semibold text-red-800 dark:text-red-200">
                                    Documento de inscrição pendente para 2
                                    atletas.
                                </div>
                                <div className="text-xs text-red-700 dark:text-red-300">
                                    Atenção: regularizar até 15 Mar
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secção visual diferente: cards em destaque */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 p-8 shadow-lg flex flex-col items-center text-center">
                            <span className="text-4xl mb-2">🏋️‍♂️</span>
                            <h3 className="font-bold text-lg mb-1 text-blue-700 dark:text-blue-300">
                                Próximo Treino
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                15 Mar, 20:00
                                <br />
                                Pavilhão Municipal
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 p-8 shadow-lg flex flex-col items-center text-center">
                            <span className="text-4xl mb-2">📈</span>
                            <h3 className="font-bold text-lg mb-1 text-green-700 dark:text-green-300">
                                Assiduidade
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                91% esta semana
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700 p-8 shadow-lg flex flex-col items-center text-center">
                            <span className="text-4xl mb-2">⭐</span>
                            <h3 className="font-bold text-lg mb-1 text-yellow-700 dark:text-yellow-300">
                                Atleta em Destaque
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                Bruno Dias
                                <br />
                                Assiduidade: 100%
                            </p>
                        </div>
                        {/* Estatísticas rápidas do plantel */}
                        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 p-8 shadow-lg flex flex-col items-center text-center">
                            <span className="text-4xl mb-2">📊</span>
                            <h3 className="font-bold text-lg mb-1 text-indigo-700 dark:text-indigo-300">
                                Plantel
                            </h3>
                            <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                                <li>18 atletas</li>
                                <li>Golos: 32</li>
                                <li>Cartões: 4 amarelos, 1 vermelho</li>
                                <li>Presenças médias: 16</li>
                            </ul>
                        </div>
                    </div>

                    {/* Destaque de atletas */}
                    <div className="mb-10">
                        <div className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                            Atletas em Destaque
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 min-w-[180px] flex flex-col items-center">
                                <span className="text-2xl">🥇</span>
                                <div className="font-semibold text-green-800 dark:text-green-200">
                                    Bruno Dias
                                </div>
                                <div className="text-xs text-green-700 dark:text-green-300">
                                    Assiduidade: 100%
                                </div>
                            </div>
                            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 min-w-[180px] flex flex-col items-center">
                                <span className="text-2xl">⚡</span>
                                <div className="font-semibold text-blue-800 dark:text-blue-200">
                                    João Silva
                                </div>
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                    Melhor desempenho físico
                                </div>
                            </div>
                            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 min-w-[180px] flex flex-col items-center">
                                <span className="text-2xl">🎯</span>
                                <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    Miguel Costa
                                </div>
                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                    Mais golos
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Próximos eventos */}
                    <div className="mb-10">
                        <div className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                            Próximos Eventos
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <li className="flex items-center justify-between p-4">
                                <span className="font-semibold">
                                    Treino Técnico
                                </span>
                                <span className="text-xs text-gray-500">
                                    15 Mar, 20:00
                                </span>
                            </li>
                            <li className="flex items-center justify-between p-4">
                                <span className="font-semibold">
                                    Jogo Amigável vs. Rivais
                                </span>
                                <span className="text-xs text-gray-500">
                                    18 Mar, 18:00
                                </span>
                            </li>
                            <li className="flex items-center justify-between p-4">
                                <span className="font-semibold">
                                    Reunião de equipa
                                </span>
                                <span className="text-xs text-gray-500">
                                    20 Mar, 21:00
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Secção de destaques recentes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col gap-2">
                            <div className="text-base font-bold text-gray-900 dark:text-white mb-2">
                                Últimas Sessões
                            </div>
                            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                <li>
                                    13 Mar - Treino Físico - 17 atletas
                                    presentes
                                </li>
                                <li>
                                    11 Mar - Treino Técnico - 16 atletas
                                    presentes
                                </li>
                                <li>8 Mar - Jogo Amigável - Vitória 3-2</li>
                            </ul>
                        </div>
                        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col gap-2">
                            <div className="text-base font-bold text-gray-900 dark:text-white mb-2">
                                Notas do Treinador
                            </div>
                            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                <li>⚡ Manter o foco nos treinos técnicos.</li>
                                <li>
                                    💡 Incentivar a assiduidade dos atletas.
                                </li>
                                <li>
                                    🔥 Preparar estratégia para o próximo jogo.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
