"use client";

import {
    criarNotaCalendario,
    editarNotaCalendario,
    apagarNotaCalendario,
} from "@/app/lib/actions/notas-calendario";
import {
    CalendarDays,
    ClipboardList,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Nota = {
    id: string;
    data: string;
    nota: string;
    created_at: string;
    updated_at: string;
};

function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

/** Group notes by date */
function groupByDate(notas: Nota[]) {
    const map = new Map<string, Nota[]>();
    for (const n of notas) {
        const key = n.data;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(n);
    }
    return map;
}

export default function NotasCalendarioClient({
    notas: initialNotas,
    contaPendente = false,
}: {
    notas: Nota[];
    contaPendente?: boolean;
}) {
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<Nota | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const editFormRef = useRef<HTMLFormElement>(null);

    function handleSave(formData: FormData) {
        if (contaPendente) {
            setError(
                "Conta de atleta menor pendente de validação do responsável.",
            );
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await criarNotaCalendario(null, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setShowModal(false);
                formRef.current?.reset();
                router.refresh();
            }
        });
    }

    function handleEditSave(formData: FormData) {
        if (contaPendente) {
            setEditError(
                "Conta de atleta menor pendente de validação do responsável.",
            );
            return;
        }

        setEditError(null);
        startTransition(async () => {
            const result = await editarNotaCalendario(null, formData);
            if (result?.error) {
                setEditError(result.error);
            } else {
                setEditando(null);
                router.refresh();
            }
        });
    }

    async function handleDelete(id: string) {
        if (contaPendente) return;
        if (!confirm("Tens a certeza que queres apagar esta nota?")) return;
        await apagarNotaCalendario(id);
        router.refresh();
    }

    const grouped = groupByDate(initialNotas);

    return (
        <div className="p-6 space-y-6">
            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Notas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {initialNotas.length} anotaç
                        {initialNotas.length !== 1 ? "ões" : "ão"} no calendário
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setError(null);
                    }}
                    disabled={contaPendente}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={16} />
                    Nova nota
                </button>
            </div>

            {contaPendente && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    Conta pendente: aguarda validação do responsável para criar
                    ou editar notas.
                </p>
            )}

            {/* content */}
            {initialNotas.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-16 text-center flex flex-col items-center gap-4">
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <ClipboardList
                            size={28}
                            className="text-gray-700 dark:text-gray-300"
                        />
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-base">
                            Nenhuma nota ainda
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Cria anotações pessoais associadas a datas do teu
                            calendário.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {[...grouped.entries()].map(([date, notes]) => (
                        <div key={date}>
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarDays
                                    size={14}
                                    className="text-violet-500"
                                />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {formatDate(date)}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {notes.map((n) => (
                                    <div
                                        key={n.id}
                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start gap-4 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                                {n.nota}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => {
                                                    setEditando(n);
                                                    setEditError(null);
                                                }}
                                                disabled={contaPendente}
                                                title="Editar"
                                                className="p-1.5 rounded-md text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(n.id)
                                                }
                                                disabled={contaPendente}
                                                title="Apagar"
                                                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Nova Nota */}
            {showModal && !contaPendente && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Nova nota
                        </h2>
                        <form
                            ref={formRef}
                            action={handleSave}
                            className="space-y-3"
                        >
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Data
                                </label>
                                <input
                                    name="data"
                                    type="date"
                                    defaultValue={todayISO()}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Nota
                                </label>
                                <textarea
                                    name="nota"
                                    rows={4}
                                    placeholder="Escreve a tua anotação…"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                />
                            </div>
                            {error && (
                                <p className="text-xs text-red-500">{error}</p>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError(null);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
                                >
                                    {isPending ? "A guardar…" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Nota */}
            {editando && !contaPendente && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Editar nota
                        </h2>
                        <form
                            ref={editFormRef}
                            action={handleEditSave}
                            className="space-y-3"
                        >
                            <input
                                type="hidden"
                                name="id"
                                value={editando.id}
                            />
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Data
                                </label>
                                <input
                                    name="data"
                                    type="date"
                                    defaultValue={editando.data}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Nota
                                </label>
                                <textarea
                                    name="nota"
                                    rows={4}
                                    defaultValue={editando.nota}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                />
                            </div>
                            {editError && (
                                <p className="text-xs text-red-500">
                                    {editError}
                                </p>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditando(null)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
                                >
                                    {isPending ? "A guardar…" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
