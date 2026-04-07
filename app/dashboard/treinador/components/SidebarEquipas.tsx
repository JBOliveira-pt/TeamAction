"use client";
import React, { useState } from "react";

export type Atleta = {
    id: number;
    nome: string;
    posicao: string;
    user_id?: string | null;
    [key: string]: unknown;
};

export type Staff = {
    id: number;
    nome: string;
    funcao: string;
    user_id?: string | null;
    [key: string]: unknown;
};

type SidebarEquipasProps = {
    atletas: Atleta[];
    staff: Staff[];
};

export default function SidebarEquipas({
    atletas,
    staff,
}: SidebarEquipasProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="relative flex-shrink-0 flex">
            <aside
                className={`bg-white dark:bg-gray-800 rounded-xl shadow mb-6 md:mb-0 overflow-hidden transition-all duration-300 ease-in-out ${
                    collapsed
                        ? "w-0 opacity-0 p-0"
                        : "w-full md:w-64 p-4 opacity-100"
                }`}
            >
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Equipa de Atletas
                </h3>
                <ul className="mb-6 space-y-2">
                    {atletas.map((a) => (
                        <li
                            key={a.id}
                            className="flex items-center justify-between text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">
                                    {a.nome.charAt(0)}
                                </div>
                                <span className="text-gray-800 dark:text-gray-200 font-medium">
                                    {a.nome}
                                </span>
                                {!a.user_id && (
                                    <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                        🤖
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 text-right">
                                {a.posicao}
                            </span>
                        </li>
                    ))}
                </ul>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Equipa Técnica
                </h3>
                <ul className="space-y-2">
                    {staff.map((s) => (
                        <li
                            key={s.id}
                            className="flex items-center justify-between text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold flex-shrink-0">
                                    {s.nome.charAt(0)}
                                </div>
                                <span className="text-gray-800 dark:text-gray-200 font-medium">
                                    {s.nome}
                                </span>
                                {!s.user_id && (
                                    <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                        🤖
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 text-right">
                                {s.funcao}
                            </span>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Toggle handle */}
            <button
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? "Expandir painel" : "Recolher painel"}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-3 h-3 transition-transform duration-300 ${collapsed ? "rotate-0" : "rotate-180"}`}
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>
        </div>
    );
}
