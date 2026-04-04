"use client";

import {
    useActionState,
    useEffect,
    useRef,
    useState,
    useTransition,
} from "react";
import Image from "next/image";
import { convidarAtleta, searchUsuarios } from "@/app/lib/actions";
import { X, Search, UserPlus } from "lucide-react";

type State = { error?: string; success?: boolean } | null;
type Equipa = { id: string; nome: string };
type Usuario = {
    id: string;
    name: string;
    email: string;
    image_url: string | null;
};

export default function ConvidarAtletaModal({
    equipas,
}: {
    equipas: Equipa[];
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState<State, FormData>(
        convidarAtleta,
        null,
    );
    const formRef = useRef<HTMLFormElement>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [resultados, setResultados] = useState<Usuario[]>([]);
    const [selecionado, setSelecionado] = useState<Usuario | null>(null);
    const [isSearching, startSearch] = useTransition();

    function handleClose() {
        setOpen(false);
        setSearchQuery("");
        setResultados([]);
        setSelecionado(null);
    }

    const [prevState, setPrevState] = useState(state);
    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) {
            handleClose();
        }
    }
    useEffect(() => {
        if (state?.success) formRef.current?.reset();
    }, [state]);

    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
    if (searchQuery !== prevSearchQuery) {
        setPrevSearchQuery(searchQuery);
        if (!searchQuery || searchQuery.length < 2) setResultados([]);
    }

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) return;
        const timer = setTimeout(() => {
            startSearch(async () => {
                const res = await searchUsuarios(searchQuery);
                setResultados(res);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                <UserPlus size={16} />
                Convidar Atleta
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Convidar Atleta
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Pesquisa um atleta registado na plataforma
                                </p>
                            </div>
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

                        <form
                            ref={formRef}
                            action={action}
                            className="space-y-4"
                        >
                            <input
                                type="hidden"
                                name="atleta_user_id"
                                value={selecionado?.id ?? ""}
                            />

                            {/* Pesquisa */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Atleta{" "}
                                    <span className="text-red-400">*</span>
                                </label>

                                {selecionado ? (
                                    <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {selecionado.image_url ? (
                                                <Image
                                                    src={selecionado.image_url}
                                                    alt={selecionado.name}
                                                    width={32}
                                                    height={32}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                                                    {selecionado.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-blue-400">
                                                    {selecionado.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {selecionado.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelecionado(null)}
                                            className="text-gray-400 hover:text-gray-200 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search
                                            size={14}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            placeholder="Nome ou email do atleta..."
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                        />

                                        {resultados.length > 0 && (
                                            <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                                                {resultados.map((u) => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelecionado(u);
                                                            setSearchQuery("");
                                                            setResultados([]);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                                    >
                                                        {u.image_url ? (
                                                            <Image
                                                                src={
                                                                    u.image_url
                                                                }
                                                                alt={u.name}
                                                                width={28}
                                                                height={28}
                                                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                {u.name.charAt(
                                                                    0,
                                                                )}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                {u.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {u.email}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {isSearching && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                A pesquisar...
                                            </p>
                                        )}
                                        {!isSearching &&
                                            searchQuery.length >= 2 &&
                                            resultados.length === 0 && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Nenhum utilizador
                                                    encontrado.
                                                </p>
                                            )}
                                    </div>
                                )}
                            </div>

                            {/* Equipa (opcional) */}
                            {selecionado && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Equipa (opcional)
                                    </label>
                                    <select
                                        name="equipa_id"
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">
                                            Sem equipa definida
                                        </option>
                                        {equipas.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Info */}
                            <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                                O atleta receberá uma notificação e terá de
                                aceitar o convite para ser federado no clube.
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
                                    disabled={isPending || !selecionado}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending
                                        ? "A enviar..."
                                        : "Enviar Convite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
