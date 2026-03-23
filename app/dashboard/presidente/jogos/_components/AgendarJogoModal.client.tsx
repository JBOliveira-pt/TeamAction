"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { agendarJogo, searchClubes } from "@/app/lib/actions";
import { X, Search } from "lucide-react";

type State = { error?: string; success?: boolean } | null;
type Equipa = { id: string; nome: string };
type Clube  = { id: string; nome: string };

const ESTADOS = [
    { value: "agendado",  label: "Agendado"  },
    { value: "realizado", label: "Realizado" },
    { value: "cancelado", label: "Cancelado" },
];

export default function AgendarJogoModal({ equipas }: { equipas: Equipa[] }) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(agendarJogo, null);
    const formRef = useRef<HTMLFormElement>(null);

    const [advNaPlataforma, setAdvNaPlataforma]       = useState<boolean | null>(null);
    const [searchQuery, setSearchQuery]               = useState("");
    const [clubes, setClubes]                         = useState<Clube[]>([]);
    const [clubeSelecionado, setClubeSelecionado]     = useState<Clube | null>(null);
    const [isSearching, startSearch]                  = useTransition();

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            handleClose();
        }
    }, [state]);

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) { setClubes([]); return; }
        const timer = setTimeout(() => {
            startSearch(async () => {
                const results = await searchClubes(searchQuery);
                setClubes(results);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    function handleClose() {
        setOpen(false);
        setAdvNaPlataforma(null);
        setSearchQuery("");
        setClubes([]);
        setClubeSelecionado(null);
    }

    function handleAdvToggle(valor: boolean) {
        setAdvNaPlataforma(valor);
        setClubeSelecionado(null);
        setSearchQuery("");
        setClubes([]);
    }

    const podeSubmeter = advNaPlataforma === false || (advNaPlataforma === true && !!clubeSelecionado);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                + Agendar Jogo
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Agendar Jogo</h2>
                            <button
                                onClick={handleClose}
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

                        <form ref={formRef} action={action} className="space-y-4">

                            {/* ── Pergunta: adversário na plataforma? ── */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    O adversário está cadastrado na plataforma? <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-2">
                                    {([{ label: "Sim", valor: true }, { label: "Não", valor: false }] as const).map(({ label, valor }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => handleAdvToggle(valor)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                                advNaPlataforma === valor
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-500"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── SIM: pesquisa de clube ── */}
                            {advNaPlataforma === true && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Pesquisar clube <span className="text-red-400">*</span>
                                    </label>

                                    {clubeSelecionado ? (
                                        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2.5">
                                            <span className="text-sm font-medium text-blue-400">{clubeSelecionado.nome}</span>
                                            <button
                                                type="button"
                                                onClick={() => setClubeSelecionado(null)}
                                                className="text-gray-400 hover:text-gray-200 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Nome do clube adversário..."
                                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                            />

                                            {clubes.length > 0 && (
                                                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                                                    {clubes.map((c) => (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setClubeSelecionado(c);
                                                                setSearchQuery("");
                                                                setClubes([]);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            {c.nome}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {isSearching && (
                                                <p className="text-xs text-gray-400 mt-1">A pesquisar...</p>
                                            )}

                                            {!isSearching && searchQuery.length >= 2 && clubes.length === 0 && (
                                                <p className="text-xs text-gray-400 mt-1">Nenhum clube encontrado.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Hidden inputs para o form action */}
                                    <input type="hidden" name="adversario"          value={clubeSelecionado?.nome ?? ""} />
                                    <input type="hidden" name="adversario_clube_id" value={clubeSelecionado?.id  ?? ""} />
                                </div>
                            )}

                            {/* ── NÃO: texto livre ── */}
                            {advNaPlataforma === false && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Nome do adversário <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="adversario"
                                        type="text"
                                        placeholder="Ex: Sporting CP"
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            )}

                            {/* ── Resto do formulário (só aparece depois de responder Sim/Não) ── */}
                            {advNaPlataforma !== null && (
                                <>
                                    {/* Data + Equipa */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Data <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                name="data"
                                                type="date"
                                                required
                                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Equipa</label>
                                            <select
                                                name="equipa_id"
                                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            >
                                                <option value="">Seleciona</option>
                                                {equipas.map((e) => (
                                                    <option key={e.id} value={e.id}>{e.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Casa/Fora + Estado */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Casa / Fora <span className="text-red-400">*</span>
                                            </label>
                                            <select
                                                name="casa_fora"
                                                required
                                                defaultValue="casa"
                                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            >
                                                <option value="casa">Casa</option>
                                                <option value="fora">Fora</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Estado <span className="text-red-400">*</span>
                                            </label>
                                            <select
                                                name="estado"
                                                required
                                                defaultValue="agendado"
                                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            >
                                                {ESTADOS.map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Local */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Local</label>
                                        <input
                                            name="local"
                                            type="text"
                                            placeholder="Ex: Estádio Municipal"
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    {/* Visibilidade pública */}
                                    <div className="flex items-center gap-3 py-1">
                                        <input
                                            id="visibilidade_publica"
                                            name="visibilidade_publica"
                                            type="checkbox"
                                            className="w-4 h-4 rounded accent-blue-600"
                                        />
                                        <label htmlFor="visibilidade_publica" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Visível publicamente
                                        </label>
                                    </div>

                                    {/* Botões */}
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isPending || !podeSubmeter}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                        >
                                            {isPending ? "A agendar..." : "Agendar Jogo"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

