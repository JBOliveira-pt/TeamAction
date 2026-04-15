// Componente cliente de jogos (presidente).
"use client";

import { useState } from "react";

type Jogo = {
    id: string;
    adversario: string;
    data: string;
    hora_inicio: string | null;
    hora_fim: string | null;
};

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
const hojeISO = hoje.toISOString().split("T")[0];

export default function EditarDataModal({
    jogo,
    onSaved,
}: {
    jogo: Jogo;
    onSaved?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [dataJogo, setDataJogo] = useState(
        new Date(jogo.data).toISOString().split("T")[0],
    );
    const [horaInicio, setHoraInicio] = useState(jogo.hora_inicio ?? "");
    const [horaFim, setHoraFim] = useState(jogo.hora_fim ?? "");
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [toast, setToast] = useState<{
        msg: string;
        tipo: "ok" | "erro";
    } | null>(null);

    const resetFields = () => {
        setDataJogo(new Date(jogo.data).toISOString().split("T")[0]);
        setHoraInicio(jogo.hora_inicio ?? "");
        setHoraFim(jogo.hora_fim ?? "");
        setErro("");
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dataJogo) return;
        const agora = new Date();
        const hojeFresh = new Date();
        hojeFresh.setHours(0, 0, 0, 0);
        const hojeFreshISO = hojeFresh.toISOString().split("T")[0];
        const d = new Date(dataJogo);
        d.setHours(0, 0, 0, 0);
        if (d < hojeFresh) {
            setErro("Não é possível remarcar para uma data passada.");
            return;
        }
        if (dataJogo === hojeFreshISO && horaInicio) {
            const [h, m] = horaInicio.split(":").map(Number);
            if (
                h < agora.getHours() ||
                (h === agora.getHours() && m <= agora.getMinutes())
            ) {
                setErro("Não é possível remarcar para uma hora já passada.");
                return;
            }
        }
        setErro("");
        setSaving(true);
        const res = await fetch(`/api/jogos/${jogo.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data: dataJogo,
                hora_inicio: horaInicio || null,
                hora_fim: horaFim || null,
            }),
        });
        setSaving(false);
        if (res.ok) {
            setToast({ msg: "Data alterada com sucesso!", tipo: "ok" });
            setTimeout(() => {
                setToast(null);
                setOpen(false);
                onSaved?.();
            }, 400);
        } else {
            setToast({ msg: "Erro ao alterar data.", tipo: "erro" });
            setTimeout(() => setToast(null), 2500);
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    resetFields();
                    setOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all whitespace-nowrap"
            >
                📅 Editar
            </button>

            {toast && (
                <div
                    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 ${toast.tipo === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
                >
                    {toast.tipo === "ok" ? "✓" : "✕"} {toast.msg}
                </div>
            )}

            {open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                📅 Alterar Data/Hora
                            </h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            vs{" "}
                            <strong className="text-gray-800 dark:text-gray-100">
                                {jogo.adversario}
                            </strong>
                        </p>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Nova data
                                </label>
                                <input
                                    type="date"
                                    min={hojeISO}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    value={dataJogo}
                                    onChange={(e) => {
                                        setDataJogo(e.target.value);
                                        setErro("");
                                    }}
                                    required
                                    autoFocus
                                />
                                {erro && (
                                    <p className="text-xs text-red-500">
                                        {erro}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Hora de início
                                    </label>
                                    <div className="flex gap-1">
                                        <select
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-2 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            value={
                                                horaInicio
                                                    ? horaInicio.split(":")[0]
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const h = e.target.value;
                                                const m = horaInicio
                                                    ? horaInicio.split(":")[1]
                                                    : "00";
                                                if (h && m) {
                                                    setHoraInicio(`${h}:${m}`);
                                                    const totalMin =
                                                        parseInt(h) * 60 +
                                                        parseInt(m) +
                                                        90;
                                                    const fimH =
                                                        Math.floor(
                                                            totalMin / 60,
                                                        ) % 24;
                                                    const fimM = totalMin % 60;
                                                    setHoraFim(
                                                        `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                                    );
                                                } else {
                                                    setHoraInicio(
                                                        h ? `${h}:00` : "",
                                                    );
                                                }
                                            }}
                                        >
                                            <option value="">HH</option>
                                            {Array.from(
                                                { length: 24 },
                                                (_, i) => (
                                                    <option
                                                        key={i}
                                                        value={String(
                                                            i,
                                                        ).padStart(2, "0")}
                                                    >
                                                        {String(i).padStart(
                                                            2,
                                                            "0",
                                                        )}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <span className="flex items-center text-gray-500 font-bold">
                                            :
                                        </span>
                                        <select
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-2 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            value={
                                                horaInicio
                                                    ? horaInicio.split(":")[1]
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const m = e.target.value;
                                                const h = horaInicio
                                                    ? horaInicio.split(":")[0]
                                                    : "";
                                                if (h && m) {
                                                    setHoraInicio(`${h}:${m}`);
                                                    const totalMin =
                                                        parseInt(h) * 60 +
                                                        parseInt(m) +
                                                        90;
                                                    const fimH =
                                                        Math.floor(
                                                            totalMin / 60,
                                                        ) % 24;
                                                    const fimM = totalMin % 60;
                                                    setHoraFim(
                                                        `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                                    );
                                                }
                                            }}
                                        >
                                            <option value="">MM</option>
                                            {["00", "15", "30", "45"].map(
                                                (m) => (
                                                    <option key={m} value={m}>
                                                        {m}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Hora terminada
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        value={horaFim}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                                >
                                    {saving ? "A guardar..." : "Guardar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
