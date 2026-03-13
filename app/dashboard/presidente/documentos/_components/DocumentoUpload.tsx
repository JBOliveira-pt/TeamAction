"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { uploadDocumento } from "@/app/lib/actions";

type UploadState = { error?: string; success?: boolean } | null;

export default function DocumentoUpload() {
    const [state, action, isPending] = useActionState<UploadState, FormData>(
        uploadDocumento,
        null
    );
    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [ficheiro, setFicheiro] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            setFicheiro(null);
        }
    }, [state]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) setFicheiro(file);
    };

    return (
        <form ref={formRef} action={action} className="space-y-4">
            {state?.error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {state.error}
                </div>
            )}
            {state?.success && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                    Documento carregado com sucesso!
                </div>
            )}

            {/* Zona drag & drop */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`bg-white dark:bg-gray-900 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                    dragging
                        ? "border-violet-500 bg-violet-500/5"
                        : "border-gray-300 dark:border-gray-700 hover:border-violet-500/50"
                }`}
            >
                <span className="text-4xl">📂</span>
                {ficheiro ? (
                    <p className="text-sm font-semibold text-violet-400">{ficheiro.name}</p>
                ) : (
                    <>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Arrasta ficheiros para aqui</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">PDF, XLSX, DOCX · máx. 10MB</p>
                    </>
                )}
                <input
                    ref={inputRef}
                    name="ficheiro"
                    type="file"
                    accept=".pdf,.xlsx,.docx"
                    className="hidden"
                    onChange={(e) => setFicheiro(e.target.files?.[0] ?? null)}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Nome */}
            <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Nome do documento <span className="text-red-400">*</span>
                </label>
                <input
                    name="nome"
                    type="text"
                    placeholder="Ex: Regulamento Interno 2024/2025"
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending || !ficheiro}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    {isPending ? "A carregar..." : "Carregar Documento"}
                </button>
            </div>
        </form>
    );
}

