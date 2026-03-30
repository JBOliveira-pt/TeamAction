"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type StaffMembro = {
    id: string;
    nome: string;
    funcao: string;
};

export default function StaffPanel({ staff }: { staff: StaffMembro[] }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="relative flex-shrink-0 flex items-stretch">
            {/* Painel */}
            <div
                className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
                    open ? "w-56 px-4 py-5" : "w-0 px-0 py-0"
                }`}
            >
                <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-600 uppercase mb-3 whitespace-nowrap">
                    Equipa Técnica
                </p>

                {staff.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        Staff atribuído pelo presidente.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {staff.map((s) => (
                            <li key={s.id} className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold flex-shrink-0">
                                    {s.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate whitespace-nowrap">
                                        {s.nome}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate whitespace-nowrap">
                                        {s.funcao}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Botão toggle */}
            <button
                onClick={() => setOpen((o) => !o)}
                title={open ? "Fechar painel" : "Abrir painel"}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
            >
                {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
            </button>
        </div>
    );
}
