import React from "react";

type PresStatus = "P" | "F" | "J";
type Athlete = {
    name: string;
    number: number;
    pos: string;
    pres: PresStatus[];
    percent: number;
};

const summary = {
    percent: 91,
    presentes: "16/18",
    faltasSemJust: 3,
    atletaAssiduo: { name: "Bruno D.", percent: 100 },
};

const sessions = ["25 FEV", "27 FEV", "1 MAR", "3 MAR", "SEG", "QUA", "PROX"];

const athletes: Athlete[] = [
    {
        name: "João Silva",
        number: 8,
        pos: "Pivot",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Miguel Costa",
        number: 7,
        pos: "Ala Esq.",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Rui Santos",
        number: 3,
        pos: "Central",
        pres: ["P", "P", "P", "F", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "André Ferreira",
        number: 11,
        pos: "Pivot",
        pres: ["P", "J", "P", "P", "P", "P", "P"],
        percent: 80,
    },
    {
        name: "Pedro Alves",
        number: 14,
        pos: "Ala Dir.",
        pres: ["F", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Tiago Mendes",
        number: 5,
        pos: "Central",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 93,
    },
    {
        name: "Carlos Lima",
        number: 1,
        pos: "GR",
        pres: ["P", "P", "F", "F", "P", "P", "P"],
        percent: 79,
    },
    {
        name: "Bruno Dias",
        number: 17,
        pos: "Ala Esq.",
        pres: ["P", "P", "P", "P", "P", "P", "P"],
        percent: 100,
    },
];

const statusColor: Record<PresStatus, string> = {
    P: "text-green-600",
    F: "text-red-600",
    J: "text-yellow-600",
};
const statusBg: Record<PresStatus, string> = {
    P: "bg-green-100",
    F: "bg-red-100",
    J: "bg-yellow-100",
};

export default function Assiduidade() {
    return (
        <div className="w-full px-4 py-6 bg-white">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2 mb-1">
                        <span>✅</span> Assiduidade
                    </h2>
                    <div className="text-gray-500 text-sm">
                        Seniores Masculinos · Março 2025
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold shadow hover:bg-gray-300">
                        Exportar
                    </button>
                    <button className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold shadow hover:bg-purple-600">
                        Registar Sessão
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-lg p-4 flex flex-col justify-between border-green-400">
                    <div className="text-xs text-gray-500 mb-1">
                        ASSIDUIDADE GERAL
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                        {summary.percent}%
                    </div>
                    <div className="text-xs text-gray-500">Esta semana</div>
                </div>
                <div className="border rounded-lg p-4 flex flex-col justify-between border-gray-400">
                    <div className="text-xs text-gray-500 mb-1">
                        PRESENTES HOJE
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {summary.presentes}
                    </div>
                    <div className="text-xs text-gray-500">Último treino</div>
                </div>
                <div className="border rounded-lg p-4 flex flex-col justify-between border-yellow-400">
                    <div className="text-xs text-gray-500 mb-1">
                        FALTAS SEM JUSTIF.
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">
                        {summary.faltasSemJust}
                    </div>
                    <div className="text-xs text-gray-500">Último mês</div>
                </div>
                <div className="border rounded-lg p-4 flex flex-col justify-between border-gray-400">
                    <div className="text-xs text-gray-500 mb-1">
                        ATLETA + ASSÍDUO
                    </div>
                    <div className="font-bold text-gray-900">
                        {summary.atletaAssiduo.name}
                    </div>
                    <div className="text-xs text-gray-500">
                        {summary.atletaAssiduo.percent}% presença
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left">ATLETA</th>
                            <th className="py-3 px-4 text-left">Nº</th>
                            <th className="py-3 px-4 text-left">POSIÇÃO</th>
                            {sessions.map((s) => (
                                <th key={s} className="py-3 px-4 text-center">
                                    {s}
                                </th>
                            ))}
                            <th className="py-3 px-4 text-center">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {athletes.map((a, idx) => (
                            <tr key={idx} className="hover:bg-gray-100">
                                <td className="py-3 px-4 font-medium text-gray-900">
                                    {a.name}
                                </td>
                                <td className="py-3 px-4 text-gray-700">
                                    {a.number}
                                </td>
                                <td className="py-3 px-4 text-gray-700">
                                    {a.pos}
                                </td>
                                {a.pres.map((p, i) => (
                                    <td
                                        key={i}
                                        className="py-3 px-4 text-center"
                                    >
                                        <span
                                            className={`inline-block w-6 h-6 rounded-full font-bold align-middle ${statusBg[p]} ${statusColor[p]}`}
                                        >
                                            {p}
                                        </span>
                                    </td>
                                ))}
                                <td
                                    className={`py-3 px-4 text-center font-bold ${a.percent === 100 ? "text-green-600" : a.percent < 80 ? "text-red-600" : "text-gray-900"}`}
                                >
                                    {a.percent}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
