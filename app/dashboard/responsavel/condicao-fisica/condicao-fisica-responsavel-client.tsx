// Componente condicao fisica responsavel client.
"use client";

import {
    editarMedidaCondicaoFisicaEducando,
    apagarMedidaCondicaoFisicaEducando,
    registarMedidaCondicaoFisicaEducando,
} from "@/app/lib/actions";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Medida = {
    id: string;
    altura: number;
    peso: number;
    data_registo: string;
};

function EditModal({
    medida,
    onClose,
}: {
    medida: Medida;
    onClose: () => void;
}) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSave(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await editarMedidaCondicaoFisicaEducando(
                null,
                formData,
            );
            if (result?.error) {
                setError(result.error);
            } else {
                onClose();
                router.refresh();
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Editar medida
                </h2>
                <form action={handleSave} className="space-y-3">
                    <input type="hidden" name="id" value={medida.id} />
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Altura (cm)
                        </label>
                        <input
                            name="altura"
                            type="number"
                            step="0.1"
                            min="50"
                            max="250"
                            defaultValue={medida.altura}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Peso (kg)
                        </label>
                        <input
                            name="peso"
                            type="number"
                            step="0.1"
                            min="20"
                            max="300"
                            defaultValue={medida.peso}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Data do registo
                        </label>
                        <input
                            name="data_registo"
                            type="date"
                            defaultValue={medida.data_registo.slice(0, 10)}
                            max={new Date().toISOString().split("T")[0]}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

function StatCard({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
            </span>
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </div>
    );
}

export default function CondicaoFisicaResponsavelClient({
    medidas,
    nomeEducando,
}: {
    medidas: Medida[];
    nomeEducando: string;
}) {
    const [editando, setEditando] = useState<Medida | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
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
        const result = await apagarMedidaCondicaoFisicaEducando(id);
        if (result?.error) {
            showToast(result.error, "erro");
        } else {
            router.refresh();
        }
    }

    const ultima = medidas.length > 0 ? medidas[medidas.length - 1] : null;
    const primeira = medidas.length > 0 ? medidas[0] : null;
    const cfAltura = ultima?.altura ?? null;
    const cfPeso = ultima?.peso ?? null;
    const cfIMC =
        cfAltura && cfPeso && cfAltura > 0
            ? (cfPeso / (cfAltura / 100) ** 2).toFixed(1)
            : null;
    const variacaoPeso =
        primeira && ultima ? (ultima.peso - primeira.peso).toFixed(1) : null;

    const ultimaData = ultima?.data_registo
        ? new Date(ultima.data_registo).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Condição Física
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Evolução de peso e altura de {nomeEducando}.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                >
                    <Pencil size={14} />
                    Registar medidas
                </button>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Altura atual"
                    value={cfAltura ? `${cfAltura} cm` : "—"}
                    sub={
                        ultimaData
                            ? `Atualizado em ${ultimaData}`
                            : "Sem registos"
                    }
                />
                <StatCard
                    label="Peso atual"
                    value={cfPeso ? `${cfPeso} kg` : "—"}
                    sub={
                        ultimaData
                            ? `Atualizado em ${ultimaData}`
                            : "Sem registos"
                    }
                />
                <StatCard
                    label="IMC"
                    value={cfIMC ?? "—"}
                    sub={
                        cfIMC
                            ? Number(cfIMC) < 18.5
                                ? "Abaixo do peso"
                                : Number(cfIMC) < 25
                                  ? "Peso normal"
                                  : "Acima do peso"
                            : ""
                    }
                />
                <StatCard
                    label="Variação peso"
                    value={
                        variacaoPeso
                            ? `${Number(variacaoPeso) >= 0 ? "+" : ""}${variacaoPeso} kg`
                            : "—"
                    }
                    sub="Desde o primeiro registo"
                />
            </div>

            {medidas.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-10 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="text-3xl">💪</span>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Sem registos de medidas
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Utilize o botão &quot;Registar medidas&quot; para
                        adicionar.
                    </p>
                </div>
            ) : (
                <>
                    {/* Tabela */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Altura
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Peso
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        IMC
                                    </th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {[...medidas].reverse().map((m) => {
                                    const imc =
                                        m.altura > 0
                                            ? (
                                                  m.peso /
                                                  (m.altura / 100) ** 2
                                              ).toFixed(1)
                                            : "—";
                                    return (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                                                {new Date(
                                                    m.data_registo,
                                                ).toLocaleDateString("pt-PT", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">
                                                {m.altura} cm
                                            </td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">
                                                {m.peso} kg
                                            </td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">
                                                {imc}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() =>
                                                            setEditando(m)
                                                        }
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDeleteId(m.id)
                                                        }
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Apagar"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showAddModal && (
                <AddMedidaModal
                    defaultAltura={cfAltura}
                    defaultPeso={cfPeso}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {editando && (
                <EditModal
                    medida={editando}
                    onClose={() => setEditando(null)}
                />
            )}

            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            Apagar registo de condição física
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

function AddMedidaModal({
    defaultAltura,
    defaultPeso,
    onClose,
}: {
    defaultAltura: number | null;
    defaultPeso: number | null;
    onClose: () => void;
}) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    function handleSave(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await registarMedidaCondicaoFisicaEducando(
                null,
                formData,
            );
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Registar medidas
                </h2>
                <form ref={formRef} action={handleSave} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Altura (cm)
                        </label>
                        <input
                            name="altura"
                            type="number"
                            step="0.1"
                            min="50"
                            max="250"
                            placeholder="ex: 172"
                            defaultValue={defaultAltura ?? ""}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Peso (kg)
                        </label>
                        <input
                            name="peso"
                            type="number"
                            step="0.1"
                            min="20"
                            max="300"
                            placeholder="ex: 64"
                            defaultValue={defaultPeso ?? ""}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Data do registo
                        </label>
                        <input
                            name="data_registo"
                            type="date"
                            defaultValue={
                                new Date().toISOString().split("T")[0]
                            }
                            max={new Date().toISOString().split("T")[0]}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
