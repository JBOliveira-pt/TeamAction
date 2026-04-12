// Componente cliente de staff (presidente).
"use client";

import {
    useActionState,
    useEffect,
    useRef,
    useState,
    useTransition,
} from "react";
import { editarMembro, getEscaloesByUserAction } from "@/app/lib/actions";
import {
    GRAUS_TECNICOS,
    getEscaloesPermitidos,
} from "@/app/lib/grau-escalao-compat";
import { X, UserCheck, Loader2 } from "lucide-react";

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

    // Determinar modo baseado no membro existente
    const isRealEdit = isTreinador && !!membro.userid;
    const isFakeEdit = isTreinador && !membro.userid;
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
    const [escaloesTreinador, setEscaloesTreinador] = useState<string[]>([]);
    const [loadingEscaloes, startLoadEscaloes] = useTransition();

    // Campos do treinador fictício
    const [fakeNome, setFakeNome] = useState(
        !membro.userid && isTreinador ? membro.nome : "",
    );
    const [grauId, setGrauId] = useState<number | null>(null);

    const equipasFiltradas = (() => {
        if (isRealEdit && escaloesTreinador.length > 0) {
            return equipas.filter((e) => escaloesTreinador.includes(e.escalao));
        }
        if (isFakeEdit && grauId) {
            const permitidos = getEscaloesPermitidos(grauId);
            return equipas.filter((e) => permitidos.includes(e.escalao));
        }
        return equipas;
    })();

    useEffect(() => {
        if (open && isTreinador && currentUser) {
            startLoadEscaloes(async () => {
                const result = await getEscaloesByUserAction(currentUser.id);
                setEscaloesTreinador(result);
            });
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
            setEscaloesTreinador([]);
            setFakeNome("");
        } else if (!isRealEdit) {
            setTreinadorMode("fake");
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
                            {isFakeEdit && grauId && (
                                <input
                                    type="hidden"
                                    name="grau_tecnico_id"
                                    value={String(grauId)}
                                />
                            )}

                            {/* Função */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Função{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                {isRealEdit ? (
                                    <>
                                        <select
                                            name="funcao"
                                            required
                                            value={funcao}
                                            onChange={(e) =>
                                                setFuncao(e.target.value)
                                            }
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            {FUNCOES_TREINADOR.map((f) => (
                                                <option key={f} value={f}>
                                                    {f}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="hidden"
                                            name="treinador_mode"
                                            value="real"
                                        />
                                        <input
                                            type="hidden"
                                            name="userid"
                                            value={membro.userid ?? ""}
                                        />
                                        <input
                                            type="hidden"
                                            name="nome"
                                            value={membro.nome}
                                        />
                                    </>
                                ) : (
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
                                )}
                            </div>

                            {/* Treinador real — info read-only do utilizador */}
                            {isRealEdit && currentUser && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <UserCheck
                                            size={14}
                                            className="text-emerald-400 flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-emerald-400">
                                                {currentUser.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {currentUser.email}
                                            </p>
                                        </div>
                                        {loadingEscaloes && (
                                            <Loader2
                                                size={14}
                                                className="text-gray-400 animate-spin"
                                            />
                                        )}
                                    </div>
                                    {!loadingEscaloes && (
                                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                                Escalões cobertos:
                                            </p>
                                            {escaloesTreinador.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {escaloesTreinador.map(
                                                        (e) => (
                                                            <span
                                                                key={e}
                                                                className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-full"
                                                            >
                                                                {e}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-red-400">
                                                    ⚠️ Sem cursos registados na
                                                    plataforma.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Treinador fake → modo fake (nome + curso) */}
                            {isTreinador && !isRealEdit && (
                                <div className="space-y-3">
                                    <input
                                        type="hidden"
                                        name="treinador_mode"
                                        value="fake"
                                    />

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
                                                setFakeNome(e.target.value)
                                            }
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Curso (Grau Técnico)
                                        </label>
                                        <select
                                            value={grauId ?? ""}
                                            onChange={(e) =>
                                                setGrauId(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : null,
                                                )
                                            }
                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">
                                                Selecionar grau...
                                            </option>
                                            {GRAUS_TECNICOS.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name} — {g.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {grauId && (
                                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                                Escalões cobertos:
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {getEscaloesPermitidos(
                                                    grauId,
                                                ).map((e) => (
                                                    <span
                                                        key={e}
                                                        className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-full"
                                                    >
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="hidden"
                                        name="userid"
                                        value=""
                                    />
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
                                    name="equipa_id"
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
                                    (escaloesTreinador.length > 0 || grauId) &&
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
                                        (isFakeEdit && !fakeNome.trim())
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
