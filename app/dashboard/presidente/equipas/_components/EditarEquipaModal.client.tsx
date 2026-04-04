"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { editarEquipa } from "@/app/lib/actions";
import { Pencil, X, Plus, Trash2, UserPlus, Users } from "lucide-react";

type State = { error?: string; success?: boolean } | null;
type Escalao = { id: number; nome: string };
type Treinador = { id: string; name: string; email: string };
type AtletaExistente = {
    id: string;
    nome: string;
    posicao: string | null;
    numero_camisola: number | null;
};
type AtletaNovo = { nome: string; posicao: string; numero_camisola: string };

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

export default function EditarEquipaModal({
    equipa,
    escaloes,
    treinadores,
    atletasIniciais,
}: {
    equipa: {
        id: string;
        nome: string;
        escalao: string;
        estado: string;
        treinador_id: string | null;
    };
    escaloes: Escalao[];
    treinadores: Treinador[];
    atletasIniciais: AtletaExistente[];
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        editarEquipa,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);

    // Treinador state
    const [treinadorId, setTreinadorId] = useState(equipa.treinador_id ?? "");

    // Atletas state
    const [atletasExistentes, setAtletasExistentes] =
        useState<AtletaExistente[]>(atletasIniciais);
    const [atletasRemovidos, setAtletasRemovidos] = useState<string[]>([]);
    const [atletasNovos, setAtletasNovos] = useState<AtletaNovo[]>([]);
    const [novoAtleta, setNovoAtleta] = useState<AtletaNovo>({
        nome: "",
        posicao: "",
        numero_camisola: "",
    });

    const resetState = useCallback(() => {
        setTreinadorId(equipa.treinador_id ?? "");
        setAtletasExistentes(atletasIniciais);
        setAtletasRemovidos([]);
        setAtletasNovos([]);
        setNovoAtleta({ nome: "", posicao: "", numero_camisola: "" });
    }, [equipa.treinador_id, atletasIniciais]);

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resetState();
        setOpen(true);
    };

    const removeExistente = (atletaId: string) => {
        setAtletasRemovidos((prev) => [...prev, atletaId]);
        setAtletasExistentes((prev) => prev.filter((a) => a.id !== atletaId));
    };

    const addNovo = () => {
        if (!novoAtleta.nome.trim()) return;
        setAtletasNovos((prev) => [...prev, { ...novoAtleta }]);
        setNovoAtleta({ nome: "", posicao: "", numero_camisola: "" });
    };

    const removeNovo = (index: number) => {
        setAtletasNovos((prev) => prev.filter((_, i) => i !== index));
    };

    const [prevState, setPrevState] = useState(state);
    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            setOpen(false);
        }
    }

    const inputClass =
        "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors";
    const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

    return (
        <>
            <button
                onClick={handleOpen}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Editar equipa"
            >
                <Pencil size={15} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Editar Equipa
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

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
                            <input type="hidden" name="id" value={equipa.id} />
                            <input
                                type="hidden"
                                name="treinador_id"
                                value={treinadorId}
                            />
                            <input
                                type="hidden"
                                name="atletas_remover_json"
                                value={JSON.stringify(atletasRemovidos)}
                            />
                            <input
                                type="hidden"
                                name="atletas_adicionar_json"
                                value={JSON.stringify(atletasNovos)}
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
                                        defaultValue={equipa.nome}
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
                                            defaultValue={equipa.escalao}
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
                                            defaultValue={equipa.estado}
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
                                </div>

                                {treinadores.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-1">
                                        Nenhum treinador registado na
                                        organização.
                                    </p>
                                ) : (
                                    <select
                                        value={treinadorId}
                                        onChange={(e) =>
                                            setTreinadorId(e.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="">Sem treinador</option>
                                        {treinadores.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} — {t.email}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* === Atletas existentes === */}
                            <div className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                                <div className="flex items-center gap-2">
                                    <Users
                                        size={16}
                                        className="text-cyan-400"
                                    />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Atletas (
                                        {atletasExistentes.length +
                                            atletasNovos.length}
                                        )
                                    </span>
                                </div>

                                {/* Atletas já na equipa */}
                                {atletasExistentes.length > 0 && (
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {atletasExistentes.map((a) => (
                                            <div
                                                key={a.id}
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
                                                    {a.numero_camisola !=
                                                        null && (
                                                        <span className="text-xs text-cyan-400 shrink-0">
                                                            #{a.numero_camisola}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeExistente(a.id)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                                                    title="Remover atleta"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Novos atletas a adicionar */}
                                {atletasNovos.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wider">
                                            Novos
                                        </p>
                                        {atletasNovos.map((a, i) => (
                                            <div
                                                key={`new-${i}`}
                                                className="flex items-center justify-between px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-sm"
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
                                                        removeNovo(i)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {atletasExistentes.length === 0 &&
                                    atletasNovos.length === 0 && (
                                        <p className="text-xs text-gray-400 py-1">
                                            Nenhum atleta nesta equipa.
                                        </p>
                                    )}

                                {/* Inline form para adicionar */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                        <label className={labelClass}>
                                            Adicionar atleta
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
                                                    addNovo();
                                                }
                                            }}
                                            placeholder="Nome"
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
                                                    addNovo();
                                                }
                                            }}
                                            placeholder="—"
                                            className={inputClass}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addNovo}
                                        disabled={!novoAtleta.nome.trim()}
                                        className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
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
                                    {isPending ? "A guardar..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
