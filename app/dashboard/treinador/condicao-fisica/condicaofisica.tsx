"use client";
import React, { useState } from "react";

const statsData = [
    { label: "Velocidade (30m)", value: "4.2s", percent: 78, color: "#00d4ff" },
    {
        label: "Impulsão Vertical",
        value: "52cm",
        percent: 65,
        color: "#10b981",
    },
    { label: "VO2max (média)", value: "54.3", percent: 72, color: "#f59e0b" },
    { label: "Força (kg Press)", value: "98kg", percent: 83, color: "#8b5cf6" },
];

export default function PhysicalCondition() {
    const [showModal, setShowModal] = useState(false);
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col p-6">
            {/* Cabeçalho */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-400 flex items-center gap-3">
                        <span>💪</span> Condição Física
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Métricas e avaliações físicas do plantel
                    </p>
                </div>
                <button className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2">
                    <span>＋</span> Nova Avaliação
                </button>
            </div>

            {/* 1. Dashboard de Métricas */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span> Dashboard de Métricas
                </h3>
                {/* Gráficos de evolução e indicadores rápidos (placeholder) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                    {statsData.map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl p-6 shadow-md flex flex-col justify-between"
                        >
                            <span
                                className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1"
                                style={{ minWidth: "140px" }}
                            >
                                {stat.label}
                            </span>
                            <span className="text-3xl font-bold text-green-600">
                                {stat.value}
                            </span>
                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mt-2">
                                <div
                                    className="h-3 rounded-lg transition-all"
                                    style={{
                                        width: `${stat.percent}%`,
                                        background: stat.color,
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Indicadores rápidos (placeholder) */}
                <div className="flex gap-4 mt-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-6 py-3 font-bold text-lg shadow">
                        Última avaliação: 12 Mar 2026
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-6 py-3 font-bold text-lg shadow">
                        Melhor marca: 3.9s (30m)
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-6 py-3 font-bold text-lg shadow">
                        Média equipa: 4.3s
                    </div>
                </div>
            </section>

            {/* 2. Histórico de Avaliações */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📅</span> Histórico de Avaliações
                </h3>
                {/* Tabela de avaliações (placeholder) */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow">
                        <thead>
                            <tr className="text-left">
                                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Atleta</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Data</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Velocidade</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">VO2max</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Força</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-3">Bruno Dias</td>
                                <td className="p-3">12 Mar 2026</td>
                                <td className="p-3">4.1s</td>
                                <td className="p-3">56.2</td>
                                <td className="p-3">102kg</td>
                                <td className="p-3">Ótima evolução</td>
                            </tr>
                            <tr>
                                <td className="p-3">João Silva</td>
                                <td className="p-3">12 Mar 2026</td>
                                <td className="p-3">4.3s</td>
                                <td className="p-3">53.8</td>
                                <td className="p-3">95kg</td>
                                <td className="p-3">Precisa melhorar força</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Perfil Individual */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">👤</span> Perfil Individual do
                    Atleta
                </h3>
                {/* Placeholder para seleção de atleta e evolução individual */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-32 h-32 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-5xl font-bold text-green-700 dark:text-green-300">
                        BD
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-lg mb-2">Bruno Dias</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            Posição: Central
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            Meta:{" "}
                            <span className="font-semibold">
                                Atingir 3.9s nos 30m
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            Pontos fortes: Velocidade, Força
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            A melhorar: VO2max
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Alertas e Recomendações */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span> Alertas & Recomendações
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow flex flex-col gap-3">
                    <ul className="list-disc pl-6 space-y-1">
                        <li className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                            Queda de performance detetada nos últimos 2 testes.
                        </li>
                        <li className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                            Risco de lesão: atenção à fadiga muscular.
                        </li>
                        <li className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                            Recomenda-se reavaliação em 2 semanas.
                        </li>
                        <li className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                            Sugestão: aumentar treino de força e recuperação.
                        </li>
                    </ul>
                </div>
            </section>

            {/* 5. Comparação e Rankings */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏆</span> Comparação & Rankings
                </h3>
                {/* Placeholder para rankings e comparação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
                        <div className="font-bold mb-2">Top 3 Velocidade</div>
                        <ol className="list-decimal pl-6">
                            <li>Bruno Dias - 4.1s</li>
                            <li>João Silva - 4.3s</li>
                            <li>Miguel Costa - 4.4s</li>
                        </ol>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
                        <div className="font-bold mb-2">Top 3 Força</div>
                        <ol className="list-decimal pl-6">
                            <li>Bruno Dias - 102kg</li>
                            <li>João Silva - 95kg</li>
                            <li>Pedro Almeida - 93kg</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* 6. Integração com Treinos */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🔗</span> Integração com Treinos
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Resultados físicos relacionados com presenças, cargas de
                        treino e fadiga.
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        Sugestão: adaptar treinos para recuperação ativa após
                        testes exigentes.
                    </div>
                </div>
            </section>

            {/* 7. Upload/Download de Relatórios */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">⬆️⬇️</span> Upload/Download de
                    Relatórios
                </h3>
                <div className="flex gap-4">
                    <button className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow transition-all">
                        Exportar PDF
                    </button>
                    <button className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        Importar Resultados
                    </button>
                </div>
            </section>

            {/* 8. Notas e Observações do Treinador */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📝</span> Notas do Treinador
                </h3>
                <textarea
                    className="w-full min-h-[80px] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder="Notas rápidas sobre atletas, testes ou recomendações..."
                ></textarea>
            </section>

            {/* 9. Alertas Visuais */}
            <section className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎨</span> Alertas Visuais
                </h3>
                <div className="flex gap-4">
                    <div className="bg-red-100 text-red-800 font-bold px-4 py-2 rounded-xl">
                        Risco de lesão
                    </div>
                    <div className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-xl">
                        Meta atingida
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 font-bold px-4 py-2 rounded-xl">
                        Evolução negativa
                    </div>
                </div>
            </section>

            {/* 10. Mobile Friendly: já garantido pelo uso de Tailwind e grid flex responsivos */}
        </div>
    );
}
