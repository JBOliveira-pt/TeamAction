// Componente cliente de comunicados (presidente).
"use client";

import { useState, useTransition } from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import { editarComunicado, excluirComunicado } from "@/app/lib/actions";
import { useRouter } from "next/navigation";

type Comunicado = {
    id: string;
    titulo: string;
    conteudo: string;
    destinatarios: string;
    created_at: string;
};

const DESTINATARIOS = [
    { value: "todos", label: "Todos" },
    { value: "atletas", label: "Atletas" },
    { value: "treinadores", label: "Treinadores" },
    { value: "staff", label: "Staff" },
    { value: "pais", label: "Pais / Encarregados" },
];

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

export default function ComunicadoModal({
    comunicado,
}: {
    comunicado: Comunicado;
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">(
        "view",
    );
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Estado do formulário de edição
    const [titulo, setTitulo] = useState(comunicado.titulo);
    const [conteudo, setConteudo] = useState(comunicado.conteudo);
    const [destinatarios, setDestinatarios] = useState(
        comunicado.destinatarios,
    );

    function handleClose() {
        setOpen(false);
        setMode("view");
        setError(null);
        // Repor campos de edição para os valores originais
        setTitulo(comunicado.titulo);
        setConteudo(comunicado.conteudo);
        setDestinatarios(comunicado.destinatarios);
    }

    function handleEdit() {
        setError(null);
        if (!titulo.trim() || !conteudo.trim() || !destinatarios.trim()) {
            setError("Preenche todos os campos obrigatórios.");
            return;
        }
        startTransition(async () => {
            const result = await editarComunicado(comunicado.id, {
                titulo: titulo.trim(),
                conteudo: conteudo.trim(),
                destinatarios: destinatarios.trim(),
            });
            if (result.error) {
                setError(result.error);
            } else {
                handleClose();
                router.refresh();
            }
        });
    }

    function handleDelete() {
        setError(null);
        startTransition(async () => {
            const result = await excluirComunicado(comunicado.id);
            if (result.error) {
                setError(result.error);
            } else {
                handleClose();
                router.refresh();
            }
        });
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
                Ver →
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
                        {/* Cabe�alho */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                {mode === "edit" ? (
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Editar Comunicado
                                    </h2>
                                ) : mode === "confirm-delete" ? (
                                    <h2 className="text-lg font-bold text-red-500">
                                        Excluir Comunicado
                                    </h2>
                                ) : (
                                    <>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {comunicado.titulo}
                                        </h2>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {formatData(comunicado.created_at)}{" "}
                                            · Para: {comunicado.destinatarios}
                                        </p>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Modo visualiza��o */}
                        {mode === "view" && (
                            <>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                    {comunicado.conteudo}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setMode("edit")}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors"
                                        >
                                            <Pencil size={14} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() =>
                                                setMode("confirm-delete")
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                            Excluir
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Modo edi��o */}
                        {mode === "edit" && (
                            <>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            Título{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            value={titulo}
                                            onChange={(e) =>
                                                setTitulo(e.target.value)
                                            }
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            Destinatários{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={destinatarios}
                                            onChange={(e) =>
                                                setDestinatarios(e.target.value)
                                            }
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                                        >
                                            {DESTINATARIOS.map((d) => (
                                                <option
                                                    key={d.value}
                                                    value={d.value}
                                                >
                                                    {d.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            Conteúdo{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            value={conteudo}
                                            onChange={(e) =>
                                                setConteudo(e.target.value)
                                            }
                                            rows={5}
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setMode("view");
                                            setError(null);
                                        }}
                                        disabled={isPending}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        disabled={isPending}
                                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        {isPending
                                            ? "A guardar..."
                                            : "Guardar e Reenviar"}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Modo confirmar elimina��o */}
                        {mode === "confirm-delete" && (
                            <>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 space-y-2">
                                    <p className="font-medium">
                                        Tens a certeza que queres excluir este
                                        comunicado?
                                    </p>
                                    <p className="text-red-400/70">
                                        O comunicado{" "}
                                        <strong>
                                            &quot;{comunicado.titulo}&quot;
                                        </strong>{" "}
                                        será apagado para todos os membros do
                                        clube (exceto admin). Esta ação não pode
                                        ser revertida.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setMode("view");
                                            setError(null);
                                        }}
                                        disabled={isPending}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isPending}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        {isPending
                                            ? "A excluir..."
                                            : "Sim, Excluir"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
