'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const MESES = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
];
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getDiasNoMes(ano: number, mes: number) {
    return new Date(ano, mes + 1, 0).getDate();
}

function getPrimeiroDiaSemana(ano: number, mes: number) {
    // 0=Dom → converter para Seg=0
    return (new Date(ano, mes, 1).getDay() + 6) % 7;
}

// mock eventos
const eventos: { data: string; titulo: string; tipo: 'treino' | 'jogo' }[] = [];

export default function PaiCalendarioPage() {
    const hoje = new Date();
    const [ano, setAno] = useState(hoje.getFullYear());
    const [mes, setMes] = useState(hoje.getMonth());

    const totalDias = getDiasNoMes(ano, mes);
    const offset = getPrimeiroDiaSemana(ano, mes);
    const cells = Array.from({ length: offset + totalDias }, (_, i) =>
        i < offset ? null : i - offset + 1,
    );

    const eventosDeste = eventos.filter((e) => {
        const d = new Date(e.data);
        return d.getFullYear() === ano && d.getMonth() === mes;
    });

    function prevMes() {
        if (mes === 0) {
            setMes(11);
            setAno((a) => a - 1);
        } else setMes((m) => m - 1);
    }
    function nextMes() {
        if (mes === 11) {
            setMes(0);
            setAno((a) => a + 1);
        } else setMes((m) => m + 1);
    }

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Calendário
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Treinos e jogos do teu filho.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
                {/* nav */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={prevMes}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronLeft
                            size={18}
                            className="text-gray-600 dark:text-gray-300"
                        />
                    </button>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {MESES[mes]} {ano}
                    </span>
                    <button
                        onClick={nextMes}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronRight
                            size={18}
                            className="text-gray-600 dark:text-gray-300"
                        />
                    </button>
                </div>

                {/* header */}
                <div className="grid grid-cols-7 text-center">
                    {DIAS_SEMANA.map((d) => (
                        <div
                            key={d}
                            className="text-xs font-semibold text-gray-400 py-2"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* days */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {cells.map((dia, i) => {
                        if (!dia) return <div key={i} />;
                        const dateStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                        const ev = eventosDeste.filter(
                            (e) => e.data === dateStr,
                        );
                        const isHoje =
                            dia === hoje.getDate() &&
                            mes === hoje.getMonth() &&
                            ano === hoje.getFullYear();
                        return (
                            <div
                                key={i}
                                className={`relative flex flex-col items-center py-2 rounded-xl text-sm transition-colors
                                    ${isHoje ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                {dia}
                                {ev.length > 0 && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {ev.map((e, j) => (
                                            <span
                                                key={j}
                                                className={`w-1.5 h-1.5 rounded-full ${e.tipo === 'treino' ? 'bg-blue-400' : 'bg-amber-400'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* legend */}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                        <span className="text-xs text-gray-500">Treino</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                        <span className="text-xs text-gray-500">Jogo</span>
                    </div>
                </div>
            </div>

            {/* lista eventos */}
            {eventosDeste.length === 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                        <Calendar size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Sem eventos este mês
                    </p>
                    <p className="text-xs text-gray-400">
                        Os treinos e jogos agendados aparecerão aqui.
                    </p>
                </div>
            )}
        </main>
    );
}
