'use client';

import {
    apagarNotaAtleta,
    criarNotaAtleta,
    editarNotaAtleta,
} from '@/app/lib/actions';
import { ClipboardList, LayoutGrid, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

type Nota = {
    id: string;
    titulo: string;
    conteudo: string;
    created_at: string;
};

export default function NotasClientWrapper({
    notas: initialNotas,
}: {
    notas: Nota[];
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
        setError(null);
        startTransition(async () => {
            const result = await criarNotaAtleta(null, formData);
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
        setEditError(null);
        startTransition(async () => {
            const result = await editarNotaAtleta(null, formData);
            if (result?.error) {
                setEditError(result.error);
            } else {
                setEditando(null);
                router.refresh();
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm('Tens a certeza que queres apagar esta nota?')) return;
        await apagarNotaAtleta(id);
        router.refresh();
    }

    return (
        <main className="p-6 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
            {/* header */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    As minhas notas
                </span>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        + Adicionar nota
                    </button>
                </div>
            </div>

            {/* content */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-16 flex flex-col items-center justify-center gap-4 text-center">
                {initialNotas.length === 0 ? (
                    <>
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
                                Regista aqui as tuas notas pessoais.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {initialNotas.map((nota) => (
                            <div
                                key={nota.id}
                                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left flex flex-col gap-2"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {nota.titulo}
                                    </p>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => {
                                                setEditando(nota);
                                                setEditError(null);
                                            }}
                                            title="Editar"
                                            className="p-1 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(nota.id)
                                            }
                                            title="Apagar"
                                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                                    {nota.conteudo}
                                </p>
                                <span className="text-[10px] text-gray-400 mt-auto">
                                    {new Date(
                                        nota.created_at,
                                    ).toLocaleDateString('pt-PT')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Editar */}
            {editando && (
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
                                    T&iacute;tulo
                                </label>
                                <input
                                    name="titulo"
                                    type="text"
                                    defaultValue={editando.titulo}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Conte&uacute;do
                                </label>
                                <textarea
                                    name="conteudo"
                                    rows={5}
                                    defaultValue={editando.conteudo}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                    {isPending ? 'A guardar…' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Nova Nota */}
            {showModal && (
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
                                    Título
                                </label>
                                <input
                                    name="titulo"
                                    type="text"
                                    placeholder="Título da nota"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Conteúdo
                                </label>
                                <textarea
                                    name="conteudo"
                                    rows={5}
                                    placeholder="Escreve a nota aqui..."
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                    {isPending ? 'A guardar…' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
