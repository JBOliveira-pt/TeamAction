"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarEquipa } from "@/app/lib/actions";
import { X, Plus, Trash2, UserPlus, Users } from "lucide-react";

type State = { error?: string; success?: boolean } | null;
type Escalao = { id: number; nome: string };
type Treinador = { id: string; name: string; email: string };
type AtletaEntry = { nome: string; posicao: string; numero_camisola: string };

const ESTADOS = [
    { value: "ativa", label: "Ativa" },
    { value: "periodo_off", label: "Período Off" },
    { value: "inativa", label: "Inativa" },
];

const POSICOES = [
    "Guarda-Redes",
    "Central",
    "Lateral Esquerdo",
    "Lateral Direito",
    "Ponta Esquerdo",
    "Ponta Direito",
    "Pivot",
];

export default function NovaEquipaModal({
    escaloes,
    desporto,
    treinadores,
}: {
    escaloes: Escalao[];
    desporto: string;
    treinadores: Treinador[];
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        criarEquipa,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);

    // Treinador state
    const [treinadorMode, setTreinadorMode] = useState<
        "none" | "real" | "fake"
    >("none");
    const [treinadorId, setTreinadorId] = useState("");
    const [treinadorNomeFake, setTreinadorNomeFake] = useState("");
    const [treinadorEmailFake, setTreinadorEmailFake] = useState("");

    // Atletas state
    const [atletas, setAtletas] = useState<AtletaEntry[]>([]);
    const [novoAtleta, setNovoAtleta] = useState<AtletaEntry>({
        nome: "",
        posicao: "",
        numero_camisola: "",
    });

    const addAtleta = () => {
        if (!novoAtleta.nome.trim()) return;
        setAtletas((prev) => [...prev, { ...novoAtleta }]);
        setNovoAtleta({ nome: "", posicao: "", numero_camisola: "" });
    };

    const removeAtleta = (index: number) => {
        setAtletas((prev) => prev.filter((_, i) => i !== index));
    };

    const resetAll = () => {
        formRef.current?.reset();
        setTreinadorMode("none");
        setTreinadorId("");
        setTreinadorNomeFake("");
        setTreinadorEmailFake("");
        setAtletas([]);
        setNovoAtleta({ nome: "", posicao: "", numero_camisola: "" });
    };

    const [prevState, setPrevState] = useState(state);
    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            setTreinadorMode("none");
            setTreinadorId("");
            setTreinadorNomeFake("");
            setTreinadorEmailFake("");
            setAtletas([]);
            setNovoAtleta({ nome: "", posicao: "", numero_camisola: "" });
            setOpen(false);
        }
    }
    useEffect(() => {
        if (state?.success) formRef.current?.reset();
    }, [state]);

    const inputClass =
        "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors";
    const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                + Nova Equipa
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Nova Equipa
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Desporto */}
                        {desporto && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                <span className="text-xs text-violet-400 font-medium">
                                    Desporto do clube:
                                </span>
                                <span className="text-xs text-violet-300 font-semibold">
                                    {desporto}
                                </span>
                            </div>
                        )}

                        {state?.error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                {state.error}
                            </div>
                        )}

                        <form
                            ref={formRef}
                            action={action}
                            className="space-y-5"
                        >
                            <input
                                type="hidden"
                                name="desporto"
                                value={desporto}
                            />
                            <input
                                type="hidden"
                                name="treinador_id"
                                value={
                                    treinadorMode === "real" ? treinadorId : ""
                                }
                            />
                            <input
                                type="hidden"
                                name="treinador_nome_fake"
                                value={
                                    treinadorMode === "fake"
                                        ? treinadorNomeFake
                                        : ""
                                }
                            />
                            <input
                                type="hidden"
                                name="treinador_email_fake"
                                value={
                                    treinadorMode === "fake"
                                        ? treinadorEmailFake
                                        : ""
                                }
                            />
                            <input
                                type="hidden"
                                name="atletas_json"
                                value={JSON.stringify(atletas)}
                            />

                            {/* === Dados da Equipa === */}
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className={labelClass}>
                                        Nome da Equipa{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="nome"
                                        type="text"
                                        placeholder="Ex: Seniores A"
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            Escalão{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="escalao"
                                            required
                                            className={inputClass}
                                        >
                                            <option value="">Seleciona</option>
                                            {escaloes.map((e) => (
                                                <option
                                                    key={e.id}
                                                    value={e.nome}
                                                >
                                                    {e.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            Estado{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="estado"
                                            required
                                            defaultValue="ativa"
                                            className={inputClass}
                                        >
                                            {ESTADOS.map((s) => (
                                                <option
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* === Treinador === */}
                            <div className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                                <div className="flex items-center gap-2">
                                    <UserPlus
                                        size={16}
                                        className="text-violet-400"
                                    />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Treinador
                                    </span>
                                    <span className="text-xs text-red-400">
                                        *
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTreinadorMode(
                                                treinadorMode === "real"
                                                    ? "none"
                                                    : "real",
                                            )
                                        }
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                            treinadorMode === "real"
                                                ? "bg-violet-600 text-white border-violet-600"
                                                : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-violet-500"
                                        }`}
                                    >
                                        Existente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTreinadorMode(
                                                treinadorMode === "fake"
                                                    ? "none"
                                                    : "fake",
                                            )
                                        }
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                            treinadorMode === "fake"
                                                ? "bg-violet-600 text-white border-violet-600"
                                                : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-violet-500"
                                        }`}
                                    >
                                        Novo (nome)
                                    </button>
                                </div>

                                {treinadorMode === "real" && (
                                    <div className="space-y-1">
                                        {treinadores.length === 0 ? (
                                            <p className="text-xs text-gray-400 py-2">
                                                Nenhum treinador registado na
                                                organização.
                                            </p>
                                        ) : (
                                            <select
                                                value={treinadorId}
                                                onChange={(e) =>
                                                    setTreinadorId(
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    Seleciona treinador
                                                </option>
                                                {treinadores.map((t) => (
                                                    <option
                                                        key={t.id}
                                                        value={t.id}
                                                    >
                                                        {t.name} — {t.email}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {treinadorMode === "fake" && (
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            value={treinadorNomeFake}
                                            onChange={(e) =>
                                                setTreinadorNomeFake(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Nome do treinador"
                                            className={inputClass}
                                        />
                                        <input
                                            type="email"
                                            value={treinadorEmailFake}
                                            onChange={(e) =>
                                                setTreinadorEmailFake(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Email do treinador (opcional)"
                                            className={inputClass}
                                        />
                                        <p className="text-[10px] text-gray-400">
                                            Se o email pertencer a um treinador
                                            registado, será enviado um convite
                                            de vinculação. Caso contrário, o
                                            administrador será notificado.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* === Atletas === */}
                            <div className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                                <div className="flex items-center gap-2">
                                    <Users
                                        size={16}
                                        className="text-cyan-400"
                                    />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Atletas
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        (opcional)
                                    </span>
                                </div>

                                {/* Lista de atletas já adicionados */}
                                {atletas.length > 0 && (
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {atletas.map((a, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="font-medium text-gray-900 dark:text-white truncate">
                                                        {a.nome}
                                                    </span>
                                                    {a.posicao && (
                                                        <span className="text-xs text-gray-400 shrink-0">
                                                            {a.posicao}
                                                        </span>
                                                    )}
                                                    {a.numero_camisola && (
                                                        <span className="text-xs text-cyan-400 shrink-0">
                                                            #{a.numero_camisola}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeAtleta(i)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Form inline para adicionar atleta */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                        <label className={labelClass}>
                                            Nome
                                        </label>
                                        <input
                                            type="text"
                                            value={novoAtleta.nome}
                                            onChange={(e) =>
                                                setNovoAtleta((p) => ({
                                                    ...p,
                                                    nome: e.target.value,
                                                }))
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addAtleta();
                                                }
                                            }}
                                            placeholder="Nome do atleta"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="w-28 space-y-1">
                                        <label className={labelClass}>
                                            Posição
                                        </label>
                                        <select
                                            value={novoAtleta.posicao}
                                            onChange={(e) =>
                                                setNovoAtleta((p) => ({
                                                    ...p,
                                                    posicao: e.target.value,
                                                }))
                                            }
                                            className={inputClass}
                                        >
                                            <option value="">—</option>
                                            {POSICOES.map((p) => (
                                                <option key={p} value={p}>
                                                    {p}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-16 space-y-1">
                                        <label className={labelClass}>Nº</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={novoAtleta.numero_camisola}
                                            onChange={(e) =>
                                                setNovoAtleta((p) => ({
                                                    ...p,
                                                    numero_camisola:
                                                        e.target.value,
                                                }))
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addAtleta();
                                                }
                                            }}
                                            placeholder="—"
                                            className={inputClass}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addAtleta}
                                        disabled={!novoAtleta.nome.trim()}
                                        className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {atletas.length > 0 && (
                                    <p className="text-xs text-gray-400">
                                        {atletas.length} atleta(s) serão
                                        adicionados
                                    </p>
                                )}
                            </div>

                            {/* Botões */}
                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending ? "A criar..." : "Criar Equipa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
