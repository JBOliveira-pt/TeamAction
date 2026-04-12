// Componente admin equipas manager.
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Trash2, X, Check, Users, ShieldAlert } from "lucide-react";

type EquipaRow = {
    id: string;
    nome: string;
    escalao: string | null;
    estado: string | null;
    desporto: string | null;
    treinador_id: string | null;
    treinador_nome: string | null;
    total_atletas: number;
    total_staff: number;
};

type Props = {
    equipas: EquipaRow[];
    editAction: (equipaId: string, formData: FormData) => Promise<void>;
    deleteAction: (equipaId: string, formData: FormData) => Promise<void>;
    redirectUserId: string;
};

const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";
const labelCls =
    "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

const estadoLabel: Record<string, string> = {
    ativa: "Ativa",
    periodo_off: "Período Off",
    inativa: "Inativa",
};

const estadoStyle: Record<string, string> = {
    ativa: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    periodo_off:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    inativa: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
            <Check size={12} />
            {pending ? "A guardar..." : label}
        </button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
            <Trash2 size={12} />
            {pending ? "A eliminar..." : "Confirmar Eliminação"}
        </button>
    );
}

export function AdminEquipasManager({
    equipas,
    editAction,
    deleteAction,
    redirectUserId,
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    if (equipas.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    ⚽ Equipas
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                    Nenhuma equipa registada nesta organização.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                ⚽ Equipas ({equipas.length})
            </h3>

            <div className="space-y-3">
                {equipas.map((equipa) => {
                    const isEditing = editingId === equipa.id;
                    const isDeleting = deletingId === equipa.id;

                    if (isEditing) {
                        return (
                            <div
                                key={equipa.id}
                                className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        A editar: {equipa.nome}
                                    </p>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <form
                                    action={editAction.bind(null, equipa.id)}
                                    className="space-y-3"
                                >
                                    <input
                                        type="hidden"
                                        name="_redirectUserId"
                                        value={redirectUserId}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className={labelCls}>
                                                Nome{" "}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                name="nome"
                                                type="text"
                                                defaultValue={equipa.nome}
                                                required
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>
                                                Escalão
                                            </label>
                                            <input
                                                name="escalao"
                                                type="text"
                                                defaultValue={
                                                    equipa.escalao ?? ""
                                                }
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>
                                                Estado
                                            </label>
                                            <select
                                                name="estado"
                                                defaultValue={
                                                    equipa.estado ?? "ativa"
                                                }
                                                className={inputCls}
                                            >
                                                <option value="ativa">
                                                    Ativa
                                                </option>
                                                <option value="periodo_off">
                                                    Período Off
                                                </option>
                                                <option value="inativa">
                                                    Inativa
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <SubmitButton label="Guardar" />
                                    </div>
                                </form>
                            </div>
                        );
                    }

                    if (isDeleting) {
                        return (
                            <div
                                key={equipa.id}
                                className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldAlert
                                        size={16}
                                        className="text-red-500"
                                    />
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        Eliminar &quot;{equipa.nome}&quot;?
                                    </p>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    {equipa.total_atletas > 0 && (
                                        <span className="font-medium text-amber-600 dark:text-amber-400">
                                            {equipa.total_atletas} atleta(s)
                                            serão desvinculados.{" "}
                                        </span>
                                    )}
                                    {equipa.total_staff > 0 && (
                                        <span className="font-medium text-amber-600 dark:text-amber-400">
                                            {equipa.total_staff} membro(s) de
                                            staff serão desvinculados.{" "}
                                        </span>
                                    )}
                                    Esta ação é irreversível.
                                </p>
                                <div className="flex items-center gap-2">
                                    <form
                                        action={deleteAction.bind(
                                            null,
                                            equipa.id,
                                        )}
                                    >
                                        <input
                                            type="hidden"
                                            name="_redirectUserId"
                                            value={redirectUserId}
                                        />
                                        <DeleteButton />
                                    </form>
                                    <button
                                        onClick={() => setDeletingId(null)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        <X size={12} />
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={equipa.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50"
                        >
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {equipa.nome}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {equipa.escalao && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {equipa.escalao}
                                            </span>
                                        )}
                                        {equipa.estado && (
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${estadoStyle[equipa.estado] ?? "bg-gray-100 text-gray-600"}`}
                                            >
                                                {estadoLabel[equipa.estado] ??
                                                    equipa.estado}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Users size={12} />
                                    {equipa.total_atletas} atletas
                                </div>
                                {equipa.treinador_nome && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        · {equipa.treinador_nome}
                                    </span>
                                )}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setDeletingId(null);
                                            setEditingId(equipa.id);
                                        }}
                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                        title="Editar equipa"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
                                            setDeletingId(equipa.id);
                                        }}
                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                        title="Eliminar equipa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
