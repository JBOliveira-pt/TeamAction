// SidebarEquipas.tsx
// Componente para mostrar equipas de atletas e equipa técnica
import React from "react";

export type Atleta = {
    id: number;
    nome: string;
    posicao: string;
};

export type Staff = {
    id: number;
    nome: string;
    funcao: string;
};

type SidebarEquipasProps = {
    atletas: Atleta[];
    staff: Staff[];
};

export default function SidebarEquipas({
    atletas,
    staff,
}: SidebarEquipasProps) {
    return (
        <aside className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 md:mb-0 md:mr-6">
            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300 mb-3">
                Equipa de Atletas
            </h3>
            <ul className="mb-6 space-y-1">
                {atletas.map((a) => (
                    <li
                        key={a.id}
                        className="flex justify-between text-sm text-gray-700 dark:text-gray-200"
                    >
                        <span>{a.nome}</span>
                        <span className="text-xs text-gray-400">
                            {a.posicao}
                        </span>
                    </li>
                ))}
            </ul>
            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300 mb-3">
                Equipa Técnica
            </h3>
            <ul className="space-y-1">
                {staff.map((s) => (
                    <li
                        key={s.id}
                        className="flex justify-between text-sm text-gray-700 dark:text-gray-200"
                    >
                        <span>{s.nome}</span>
                        <span className="text-xs text-gray-400">
                            {s.funcao}
                        </span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
