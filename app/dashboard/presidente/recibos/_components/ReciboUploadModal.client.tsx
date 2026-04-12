// Componente cliente de recibos (presidente).
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { uploadRecibo } from "@/app/lib/receipt-actions";
import { X } from "lucide-react";

type UploadState = { error?: string; success?: boolean } | null;

type Atleta = { id: string; nome: string };
type Mensalidade = { id: string; descricao: string };

const METODOS = [
    { value: "transferencia", label: "Transferência Bancária" },
    { value: "mbway", label: "MB Way" },
    { value: "numerario", label: "Numerário" },
    { value: "cheque", label: "Cheque" },
    { value: "outro", label: "Outro" },
];

const STATUS_OPTS = [
    { value: "pendente_envio", label: "Pendente de Envio" },
    { value: "enviado_atleta", label: "Enviado ao Atleta" },
];

export default function ReciboUploadModal({
    atletas = [],
    mensalidades = [],
}: {
    atletas?: Atleta[];
    mensalidades?: Mensalidade[];
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<UploadState, FormData>(
        uploadRecibo,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [ficheiro, setFicheiro] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [prevState, setPrevState] = useState(state);

    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            setFicheiro(null);
            setOpen(false);
        }
    }
    useEffect(() => {
        if (state?.success) formRef.current?.reset();
    }, [state]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setFicheiro(file);
            const dt = new DataTransfer();
            dt.items.add(file);
            if (inputRef.current) inputRef.current.files = dt.files;
        }
    };

    function handleClose() {
        setOpen(false);
        setFicheiro(null);
        formRef.current?.reset();
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                🧾 Carregar Recibo
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Carregar Recibo</h2>
                                <p className="text-xs text-gray-400 mt-0.5">PDF ou imagem · máx. 10MB (opcional)</p>
                            </div>
                            <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {state?.error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {state.error}
                            </div>
                        )}

                        <form ref={formRef} action={action} className="space-y-4">

                            {/* Atleta */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Atleta <span className="text-red-400">*</span>
                                </label>
                                <select name="atleta_id" required className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors">
                                    <option value="">Seleciona o atleta</option>
                                    {atletas.map((a) => (
                                        <option key={a.id} value={a.id}>{a.nome}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Mensalidade */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Mensalidade <span className="text-red-400">*</span>
                                </label>
                                <select name="mensalidade_id" required className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors">
                                    <option value="">Seleciona a mensalidade</option>
                                    {mensalidades.map((m) => (
                                        <option key={m.id} value={m.id}>{m.descricao}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Valor + Data */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Valor (€) <span className="text-red-400">*</span>
    </label>
    <input
        name="amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="Ex: 900/900.50"
        required
        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
    />
</div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        Data de Recebimento <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="received_date"
                                        type="date"
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Método de Pagamento */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Método de Pagamento <span className="text-red-400">*</span>
                                </label>
                                <select name="payment_method" required className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors">
                                    <option value="">Seleciona o método</option>
                                    {METODOS.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* IBAN */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    IBAN do Emissor <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="issuer_iban"
                                    type="text"
                                    placeholder="Ex: PT50 0000 0000 0000 0000 0000 0"
                                    required
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Status</label>
                                <select name="status" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors">
                                    {STATUS_OPTS.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Ficheiro (opcional) */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                                    dragging
                                        ? "border-blue-500 bg-blue-500/5"
                                        : "border-gray-300 dark:border-gray-700 hover:border-blue-500/50"
                                }`}
                            >
                                <span className="text-3xl">📎</span>
                                {ficheiro ? (
                                    <p className="text-sm font-semibold text-blue-400">{ficheiro.name}</p>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Anexar PDF (opcional)</p>
                                        <p className="text-xs text-gray-400">PDF, JPG, PNG · máx. 10MB</p>
                                    </>
                                )}
                                <input
                                    ref={inputRef}
                                    name="ficheiro"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => setFicheiro(e.target.files?.[0] ?? null)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending ? "A guardar..." : "Guardar Recibo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}