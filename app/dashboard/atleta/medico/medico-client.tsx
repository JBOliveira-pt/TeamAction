"use client";

import {
    adicionarDoencaAtleta,
    adicionarLesaoAtleta,
    apagarRegistoMedico,
    editarRegistoMedico,
} from "@/app/lib/actions";
import { Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type RegistoMedico = {
    id: string;
    tipo: string;
    descricao: string;
    data_inicio: string;
    data_prevista_retorno: string | null;
    observacoes: string | null;
    estado: string;
    created_at: string;
};

function StatCard({
    title,
    value,
    sub,
    valueColor,
}: {
    title: string;
    value: string;
    sub?: string;
    valueColor?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {title}
            </span>
            <span
                className={`text-2xl font-bold ${valueColor ?? "text-gray-900 dark:text-white"}`}
            >
                {value}
            </span>
            {sub && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {sub}
                </span>
            )}
        </div>
    );
}

function ModalForm({
    title,
    descricaoPlaceholder,
    onClose,
    action,
    contaPendente,
}: {
    title: string;
    descricaoPlaceholder: string;
    onClose: () => void;
    contaPendente: boolean;
    action: (
        prev: { error?: string; success?: boolean } | null,
        fd: FormData,
    ) => Promise<{ error?: string; success?: boolean } | null>;
}) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    function handleSave(formData: FormData) {
        if (contaPendente) {
            setError(
                "Conta de atleta menor pendente de validação do responsável.",
            );
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await action(null, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                onClose();
                formRef.current?.reset();
                router.refresh();
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {title}
                </h2>
                <form ref={formRef} action={handleSave} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Descrição
                        </label>
                        <input
                            name="descricao"
                            type="text"
                            placeholder={descricaoPlaceholder}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Data início
                            </label>
                            <input
                                name="data_inicio"
                                type="date"
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Data prevista retorno
                            </label>
                            <input
                                name="data_prevista_retorno"
                                type="date"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Observações
                        </label>
                        <textarea
                            name="observacoes"
                            rows={3}
                            placeholder="Observações adicionais..."
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
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
                            {isPending ? "A guardar…" : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditModal({
    registo,
    onClose,
    contaPendente,
}: {
    registo: RegistoMedico;
    onClose: () => void;
    contaPendente: boolean;
}) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSave(formData: FormData) {
        if (contaPendente) {
            setError(
                "Conta de atleta menor pendente de validação do responsável.",
            );
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await editarRegistoMedico(null, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                onClose();
                router.refresh();
            }
        });
    }

    const toInputDate = (val: string | null) => (val ? val.slice(0, 10) : "");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Editar {registo.tipo === "lesao" ? "lesão" : "doença"}
                </h2>
                <form action={handleSave} className="space-y-3">
                    <input type="hidden" name="id" value={registo.id} />
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Descrição
                        </label>
                        <input
                            name="descricao"
                            type="text"
                            defaultValue={registo.descricao}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Data início
                            </label>
                            <input
                                name="data_inicio"
                                type="date"
                                defaultValue={toInputDate(registo.data_inicio)}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Data prevista retorno
                            </label>
                            <input
                                name="data_prevista_retorno"
                                type="date"
                                defaultValue={toInputDate(
                                    registo.data_prevista_retorno,
                                )}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Estado
                        </label>
                        <select
                            name="estado"
                            defaultValue={registo.estado}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ativo">Ativo</option>
                            <option value="resolvido">Resolvido</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Observações
                        </label>
                        <textarea
                            name="observacoes"
                            rows={3}
                            defaultValue={registo.observacoes ?? ""}
                            placeholder="Observações adicionais..."
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
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
                            {isPending ? "A guardar…" : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RegistoCard({
    r,
    onEdit,
    onDelete,
    contaPendente,
}: {
    r: RegistoMedico;
    onEdit: (r: RegistoMedico) => void;
    onDelete: (id: string) => void;
    contaPendente: boolean;
}) {
    const fmtDate = (val: string | null) =>
        val ? new Date(val).toLocaleDateString("pt-PT") : "—";

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        r.tipo === "lesao"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}
                >
                    {r.tipo === "lesao" ? "Lesão" : "Doença"}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(r)}
                        disabled={contaPendente}
                        className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(r.id)}
                        disabled={contaPendente}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Apagar"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {r.descricao}
            </p>
            {r.observacoes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {r.observacoes}
                </p>
            )}
            <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-1">
                <div>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-400">
                        Início
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {fmtDate(r.data_inicio)}
                    </span>
                </div>
                <div>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-400">
                        Retorno previsto
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {fmtDate(r.data_prevista_retorno)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function MedicoClientWrapper({
    registos,
    contaPendente,
}: {
    registos: RegistoMedico[];
    contaPendente: boolean;
}) {
    const [showLesaoModal, setShowLesaoModal] = useState(false);
    const [showDoencaModal, setShowDoencaModal] = useState(false);
    const [editando, setEditando] = useState<RegistoMedico | null>(null);
    const router = useRouter();

    async function handleDelete(id: string) {
        if (contaPendente) return;
        if (!confirm("Tens a certeza que queres apagar este registo?")) return;
        await apagarRegistoMedico(id);
        router.refresh();
    }

    const ativos = registos.filter((r) => r.estado === "ativo");
    const statusMedico = ativos.length === 0 ? "Disponível" : "Indisponível";

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 max-h-screen">
            {/* header */}

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Médico
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Gere lesões, doenças e o teu histórico médico.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowLesaoModal(true)}
                        disabled={contaPendente}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + Adicionar lesão
                    </button>
                    <button
                        onClick={() => setShowDoencaModal(true)}
                        disabled={contaPendente}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + Adicionar doença
                    </button>
                </div>
            </div>

            {contaPendente && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    Conta pendente: aguarda validação do responsável para gerir
                    registos médicos.
                </p>
            )}

            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Status médico"
                    value={statusMedico}
                    valueColor={
                        ativos.length === 0
                            ? "text-emerald-500"
                            : "text-red-500"
                    }
                />
                <StatCard
                    title="Lesões e doenças"
                    value={String(registos.length)}
                    sub={`${ativos.length} ativas, ${registos.length - ativos.length} resolvidas`}
                />
                <StatCard
                    title="Lesão mais comum"
                    value={
                        registos.length > 0 ? registos[0].descricao : "Nenhum"
                    }
                    sub={`${registos.length} em todas as temporadas`}
                />
            </div>

            {/* active injuries/illnesses */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Lesões e doenças em andamento
                    </span>
                    <span className="text-sm text-gray-400">
                        {ativos.length}
                    </span>
                </div>

                {ativos.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                            <ShieldCheck
                                size={28}
                                className="text-emerald-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-base">
                                Nenhuma lesão ou doença ativa
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                Boas notícias! Atualmente estás sem lesões e
                                disponível para todas as atividades.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ativos.map((r) => (
                            <RegistoCard
                                key={r.id}
                                r={r}
                                onEdit={setEditando}
                                onDelete={handleDelete}
                                contaPendente={contaPendente}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showLesaoModal && !contaPendente && (
                <ModalForm
                    title="Adicionar lesão"
                    descricaoPlaceholder="Ex: Entorse do tornozelo"
                    onClose={() => setShowLesaoModal(false)}
                    action={adicionarLesaoAtleta}
                    contaPendente={contaPendente}
                />
            )}

            {showDoencaModal && !contaPendente && (
                <ModalForm
                    title="Adicionar doença"
                    descricaoPlaceholder="Ex: Gripe"
                    onClose={() => setShowDoencaModal(false)}
                    action={adicionarDoencaAtleta}
                    contaPendente={contaPendente}
                />
            )}

            {editando && !contaPendente && (
                <EditModal
                    registo={editando}
                    onClose={() => setEditando(null)}
                    contaPendente={contaPendente}
                />
            )}
        </main>
    );
}
