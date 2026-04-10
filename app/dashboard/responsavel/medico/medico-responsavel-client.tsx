"use client";

import {
    editarRegistoMedicoEducando,
    apagarRegistoMedicoEducando,
    adicionarLesaoEducando,
    adicionarDoencaEducando,
} from "@/app/lib/actions";
import {
    ChevronDown,
    ChevronUp,
    Pencil,
    ShieldCheck,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useMemo, useState, useTransition } from "react";

type RegistoMedico = {
    id: string;
    tipo: string;
    descricao: string;
    data_inicio: string;
    data_prevista_retorno: string | null;
    observacoes: string | null;
    estado: string;
    gravidade: string;
    created_at: string;
};

function AddModal({
    title,
    descricaoPlaceholder,
    onClose,
    action,
}: {
    title: string;
    descricaoPlaceholder: string;
    onClose: () => void;
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
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Gravidade
                        </label>
                        <select
                            name="gravidade"
                            defaultValue="leve"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="leve">
                                🟢 Leve — continua disponível
                            </option>
                            <option value="media">
                                🟡 Média — fica indisponível
                            </option>
                            <option value="grave">
                                🔴 Grave — fica indisponível
                            </option>
                        </select>
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
}: {
    registo: RegistoMedico;
    onClose: () => void;
}) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSave(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await editarRegistoMedicoEducando(null, formData);
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
                            Gravidade
                        </label>
                        <select
                            name="gravidade"
                            defaultValue={registo.gravidade}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="leve">
                                🟢 Leve — continua disponível
                            </option>
                            <option value="media">
                                🟡 Média — fica indisponível
                            </option>
                            <option value="grave">
                                🔴 Grave — fica indisponível
                            </option>
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
}: {
    r: RegistoMedico;
    onEdit: (r: RegistoMedico) => void;
    onDelete: (id: string) => void;
}) {
    const fmtDate = (val: string | null) =>
        val ? new Date(val).toLocaleDateString("pt-PT") : "—";

    const resolvido = r.estado !== "ativo";

    return (
        <div
            className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-2 ${resolvido ? "opacity-60" : ""}`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            r.tipo === "lesao"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        }`}
                    >
                        {r.tipo === "lesao" ? "Lesão" : "Doença"}
                    </span>
                    <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            r.gravidade === "grave"
                                ? "bg-red-500 text-white"
                                : r.gravidade === "media"
                                  ? "bg-amber-500 text-white"
                                  : "bg-emerald-500 text-white"
                        }`}
                    >
                        {r.gravidade === "grave"
                            ? "Grave"
                            : r.gravidade === "media"
                              ? "Média"
                              : "Leve"}
                    </span>
                    <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            resolvido
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                    >
                        {resolvido ? "Resolvido" : "Ativo"}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onEdit(r)}
                        className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(r.id)}
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

type SortKey = "data" | "tipo" | "gravidade";
type SortDir = "asc" | "desc";

const gravidadeOrder: Record<string, number> = { grave: 3, media: 2, leve: 1 };

function SortButton({
    label,
    sortKey,
    active,
    dir,
    onClick,
}: {
    label: string;
    sortKey: SortKey;
    active: boolean;
    dir: SortDir;
    onClick: (key: SortKey) => void;
}) {
    return (
        <button
            onClick={() => onClick(sortKey)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
        >
            {label}
            {active &&
                (dir === "asc" ? (
                    <ChevronUp size={12} />
                ) : (
                    <ChevronDown size={12} />
                ))}
        </button>
    );
}

export default function MedicoResponsavelClient({
    registos,
}: {
    registos: RegistoMedico[];
}) {
    const [editando, setEditando] = useState<RegistoMedico | null>(null);
    const [showLesaoModal, setShowLesaoModal] = useState(false);
    const [showDoencaModal, setShowDoencaModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        msg: string;
        tipo: "ok" | "erro";
    } | null>(null);
    const router = useRouter();

    function showToast(msg: string, tipo: "ok" | "erro" = "ok") {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3000);
    }

    async function handleDeleteConfirmed() {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null);
        const result = await apagarRegistoMedicoEducando(id);
        if (result?.error) {
            showToast(result.error, "erro");
        } else {
            router.refresh();
        }
    }

    const [sortKey, setSortKey] = useState<SortKey>("data");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    const sorted = useMemo(() => {
        const arr = [...registos];
        arr.sort((a, b) => {
            let cmp = 0;
            if (sortKey === "data") {
                cmp =
                    new Date(a.data_inicio).getTime() -
                    new Date(b.data_inicio).getTime();
            } else if (sortKey === "tipo") {
                cmp = a.tipo.localeCompare(b.tipo);
            } else if (sortKey === "gravidade") {
                cmp =
                    (gravidadeOrder[a.gravidade] ?? 0) -
                    (gravidadeOrder[b.gravidade] ?? 0);
            }
            return sortDir === "asc" ? cmp : -cmp;
        });
        return arr;
    }, [registos, sortKey, sortDir]);

    const ativos = registos.filter((r) => r.estado === "ativo");
    const statusMedico = ativos.length === 0 ? "Disponível" : "Indisponível";

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Médico
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Lesões, doenças e histórico médico do educando.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowLesaoModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        + Adicionar lesão
                    </button>
                    <button
                        onClick={() => setShowDoencaModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        + Adicionar doença
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Status médico
                    </span>
                    <span
                        className={`text-2xl font-bold ${ativos.length === 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                        {statusMedico}
                    </span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Lesões e doenças
                    </span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {registos.length}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {ativos.length} ativas,{" "}
                        {registos.length - ativos.length} resolvidas
                    </span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Lesão mais comum
                    </span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {registos.length > 0 ? registos[0].descricao : "Nenhum"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {registos.length} em todas as temporadas
                    </span>
                </div>
            </div>

            {/* Lesões e doenças */}
            <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Lesões e doenças
                        </span>
                        <span className="text-sm text-gray-400">
                            {registos.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 mr-1">
                            Ordenar:
                        </span>
                        <SortButton
                            label="Data"
                            sortKey="data"
                            active={sortKey === "data"}
                            dir={sortDir}
                            onClick={handleSort}
                        />
                        <SortButton
                            label="Tipo"
                            sortKey="tipo"
                            active={sortKey === "tipo"}
                            dir={sortDir}
                            onClick={handleSort}
                        />
                        <SortButton
                            label="Gravidade"
                            sortKey="gravidade"
                            active={sortKey === "gravidade"}
                            dir={sortDir}
                            onClick={handleSort}
                        />
                    </div>
                </div>

                {registos.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                            <ShieldCheck
                                size={28}
                                className="text-emerald-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-base">
                                Nenhuma lesão ou doença registada
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                O educando está sem registos médicos e
                                disponível para todas as atividades.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sorted.map((r) => (
                            <RegistoCard
                                key={r.id}
                                r={r}
                                onEdit={setEditando}
                                onDelete={setDeleteId}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showLesaoModal && (
                <AddModal
                    title="Adicionar lesão"
                    descricaoPlaceholder="Ex: Entorse do tornozelo"
                    onClose={() => setShowLesaoModal(false)}
                    action={adicionarLesaoEducando}
                />
            )}

            {showDoencaModal && (
                <AddModal
                    title="Adicionar doença"
                    descricaoPlaceholder="Ex: Gripe"
                    onClose={() => setShowDoencaModal(false)}
                    action={adicionarDoencaEducando}
                />
            )}

            {editando && (
                <EditModal
                    registo={editando}
                    onClose={() => setEditando(null)}
                />
            )}

            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            Apagar registo médico
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Tem a certeza que deseja apagar este registo? Esta
                            ação não pode ser revertida.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteConfirmed}
                                className="flex-1 font-bold py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                            >
                                Apagar
                            </button>
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div
                    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 ${
                        toast.tipo === "ok"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                    }`}
                >
                    {toast.tipo === "ok" ? "✓" : "✕"} {toast.msg}
                </div>
            )}
        </div>
    );
}
