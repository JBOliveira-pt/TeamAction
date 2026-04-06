"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { editarMembro, getEscaloesByUserAction } from "@/app/lib/actions";
import { X, Search, UserCheck, Loader2 } from "lucide-react";

type Equipa = { id: string; nome: string; escalao: string };
type UserPlataforma = {
    id: string;
    name: string;
    email: string;
    imageurl: string | null;
};
type Membro = {
    id: string;
    nome: string;
    funcao: string;
    equipaid: string | null;
    userid: string | null;
};

const FUNCOES = [
    "Treinador Principal",
    "Treinador Adjunto",
    "Fisioterapeuta",
    "Preparador Físico",
    "Team Manager",
    "Médico",
    "Nutricionista",
    "Delegado",
    "Outro",
];
const FUNCOES_TREINADOR = ["Treinador Principal", "Treinador Adjunto"];

export function EditarMembroModal({
    membro,
    equipas,
    users,
}: {
    membro: Membro;
    equipas: Equipa[];
    users: UserPlataforma[];
}) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState(editarMembro, null);
    const formRef = useRef<HTMLFormElement>(null);

    const currentUser = users.find((u) => u.id === membro.userid) ?? null;

    const [funcao, setFuncao] = useState(membro.funcao);
    const isTreinador = FUNCOES_TREINADOR.includes(funcao);

    // Determinar modo inicial baseado no membro existente
    const initialMode = isTreinador
        ? membro.userid
            ? "real"
            : "fake"
        : "none";
    const [treinadorMode, setTreinadorMode] = useState<
        "none" | "real" | "fake"
    >(initialMode);

    const [selectedUser, setSelectedUser] = useState<UserPlataforma | null>(
        currentUser,
    );
    const [userSearch, setUserSearch] = useState(currentUser?.name ?? "");
    const [showDropdown, setShowDropdown] = useState(false);
    const [escaloesTreinador, setEscaloesTreinador] = useState<string[]>([]);
    const [loadingEscaloes, setLoadingEscaloes] = useState(false);

    // Fake trainer fields
    const [fakeNome, setFakeNome] = useState(
        !membro.userid && isTreinador ? membro.nome : "",
    );
    const [fakeEmail, setFakeEmail] = useState("");

    const equipasFiltradas =
        isTreinador && treinadorMode === "real" && escaloesTreinador.length > 0
            ? equipas.filter((e) => escaloesTreinador.includes(e.escalao))
            : equipas;

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase()),
    );

    useEffect(() => {
        if (open && isTreinador && currentUser) {
            setLoadingEscaloes(true);
            getEscaloesByUserAction(currentUser.id)
                .then(setEscaloesTreinador)
                .finally(() => setLoadingEscaloes(false));
        }
    }, [open, isTreinador, currentUser]);

    const [prevState, setPrevState] = useState(state);
    if (state !== prevState) {
        setPrevState(state);
        if (state?.success) setOpen(false);
    }

    function handleFuncaoChange(val: string) {
        setFuncao(val);
        if (!FUNCOES_TREINADOR.includes(val)) {
            setTreinadorMode("none");
            setSelectedUser(null);
            setUserSearch("");
            setEscaloesTreinador([]);
            setFakeNome("");
            setFakeEmail("");
        } else {
            setTreinadorMode("real");
        }
    }

    async function handleSelectUser(u: UserPlataforma) {
        setSelectedUser(u);
        setUserSearch(u.name);
        setShowDropdown(false);
        setLoadingEscaloes(true);
        try {
            const escaloes = await getEscaloesByUserAction(u.id);
            setEscaloesTreinador(escaloes);
        } finally {
            setLoadingEscaloes(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
                Editar
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Editar Membro
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                            <input type="hidden" name="id" value={membro.id} />

                            {/* Função */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Função{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="funcao"
                                    required
                                    value={funcao}
                                    onChange={(e) =>
                                        handleFuncaoChange(e.target.value)
                                    }
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    {FUNCOES.map((f) => (
                                        <option key={f} value={f}>
                                            {f}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Treinador → modo real/fake */}
                            {isTreinador && (
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Tipo de treinador
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTreinadorMode("real");
                                                setFakeNome("");
                                                setFakeEmail("");
                                            }}
                                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                                treinadorMode === "real"
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-blue-500"
                                            }`}
                                        >
                                            Utilizador da plataforma
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTreinadorMode("fake");
                                                setSelectedUser(null);
                                                setUserSearch("");
                                                setEscaloesTreinador([]);
                                            }}
                                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                                treinadorMode === "fake"
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-blue-500"
                                            }`}
                                        >
                                            Registar manualmente
                                        </button>
                                    </div>

                                    <input
                                        type="hidden"
                                        name="treinador_mode"
                                        value={treinadorMode}
                                    />

                                    {/* Modo real: pesquisar utilizador */}
                                    {treinadorMode === "real" && (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Search
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                    size={14}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Pesquisar por nome ou email..."
                                                    value={userSearch}
                                                    onChange={(e) => {
                                                        setUserSearch(
                                                            e.target.value,
                                                        );
                                                        setShowDropdown(true);
                                                        if (
                                                            selectedUser &&
                                                            e.target.value !==
                                                                selectedUser.name
                                                        ) {
                                                            setSelectedUser(
                                                                null,
                                                            );
                                                            setEscaloesTreinador(
                                                                [],
                                                            );
                                                        }
                                                    }}
                                                    onFocus={() =>
                                                        setShowDropdown(true)
                                                    }
                                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                {showDropdown &&
                                                    userSearch.length > 0 && (
                                                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                            {filteredUsers.length >
                                                            0 ? (
                                                                filteredUsers.map(
                                                                    (u) => (
                                                                        <button
                                                                            key={
                                                                                u.id
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleSelectUser(
                                                                                    u,
                                                                                )
                                                                            }
                                                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                                                        >
                                                                            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                                                                <span className="text-xs font-bold text-blue-400">
                                                                                    {u.name
                                                                                        .charAt(
                                                                                            0,
                                                                                        )
                                                                                        .toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                                    {
                                                                                        u.name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-xs text-gray-400">
                                                                                    {
                                                                                        u.email
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </button>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <p className="px-4 py-3 text-sm text-gray-400 text-center">
                                                                    Nenhum
                                                                    utilizador
                                                                    encontrado.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                            </div>

                                            <input
                                                type="hidden"
                                                name="userid"
                                                value={selectedUser?.id ?? ""}
                                            />
                                            <input
                                                type="hidden"
                                                name="nome"
                                                value={
                                                    selectedUser?.name ??
                                                    membro.nome
                                                }
                                            />

                                            {selectedUser && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                    <UserCheck
                                                        size={14}
                                                        className="text-emerald-400 flex-shrink-0"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-emerald-400">
                                                            {selectedUser.name}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {selectedUser.email}
                                                        </p>
                                                    </div>
                                                    {loadingEscaloes && (
                                                        <Loader2
                                                            size={14}
                                                            className="text-gray-400 animate-spin"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {selectedUser &&
                                                !loadingEscaloes && (
                                                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                                            Escalões cobertos:
                                                        </p>
                                                        {escaloesTreinador.length >
                                                        0 ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {escaloesTreinador.map(
                                                                    (e) => (
                                                                        <span
                                                                            key={
                                                                                e
                                                                            }
                                                                            className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-full"
                                                                        >
                                                                            {e}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-red-400">
                                                                ⚠️ Sem cursos
                                                                registados na
                                                                plataforma.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {/* Modo fake: nome + email opcional */}
                                    {treinadorMode === "fake" && (
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Nome do Treinador{" "}
                                                    <span className="text-red-400">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    name="nome"
                                                    type="text"
                                                    required
                                                    value={fakeNome}
                                                    onChange={(e) =>
                                                        setFakeNome(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Email (opcional — para
                                                    procurar na plataforma)
                                                </label>
                                                <input
                                                    name="treinador_email_fake"
                                                    type="email"
                                                    value={fakeEmail}
                                                    onChange={(e) =>
                                                        setFakeEmail(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="email@dominio.pt"
                                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            <input
                                                type="hidden"
                                                name="userid"
                                                value=""
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Nome livre */}
                            {!isTreinador && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Nome Completo{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="nome"
                                        type="text"
                                        defaultValue={membro.nome}
                                        required
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            )}

                            {/* Equipa filtrada */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Equipa
                                </label>
                                <select
                                    name="equipaid"
                                    defaultValue={membro.equipaid ?? ""}
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Sem equipa</option>
                                    {equipasFiltradas.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.nome}
                                            {e.escalao ? ` — ${e.escalao}` : ""}
                                        </option>
                                    ))}
                                </select>
                                {isTreinador &&
                                    escaloesTreinador.length > 0 &&
                                    equipasFiltradas.length <
                                        equipas.length && (
                                        <p className="text-xs text-gray-400">
                                            A mostrar apenas equipas dos
                                            escalões cobertos pelo curso.
                                        </p>
                                    )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isPending ||
                                        (isTreinador &&
                                            treinadorMode === "real" &&
                                            !selectedUser) ||
                                        (isTreinador &&
                                            treinadorMode === "fake" &&
                                            !fakeNome.trim())
                                    }
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {isPending
                                        ? "A guardar..."
                                        : "Guardar Alterações"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
