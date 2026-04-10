"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

type Equipa = { id: string; nome: string };
type Clube = {
    id: string;
    name: string;
    cidade: string | null;
    desporto: string | null;
};
type EquipaTreinador = {
    organization_id: string;
    nome: string;
    treinador_nome: string;
};

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
const hojeISO = hoje.toISOString().split("T")[0];

export default function AgendarJogoModal({
    equipas,
    meuClubeId,
    defaultOpen = false,
    defaultData = "",
    onCreated,
}: {
    equipas: Equipa[];
    meuClubeId?: string;
    defaultOpen?: boolean;
    defaultData?: string;
    onCreated?: () => void;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [passo, setPasso] = useState<1 | 2 | 3>(1);

    /* ── Passo 1 ── */
    const [adversarioNaPlataforma, setAdversarioNaPlataforma] = useState<
        boolean | null
    >(null);

    /* ── Passo 2 — adversário com clube ── */
    const [adversarioPossuiClube, setAdversarioPossuiClube] = useState<
        boolean | null
    >(null);
    const [pesquisa, setPesquisa] = useState("");
    const [resultados, setResultados] = useState<Clube[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [clubeSelecionado, setClubeSelecionado] = useState<Clube | null>(
        null,
    );
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [equipasAdv, setEquipasAdv] = useState<
        { id: string; nome: string }[]
    >([]);
    const [equipaAdvSelecionada, setEquipaAdvSelecionada] = useState<{
        id: string;
        nome: string;
    } | null>(null);
    const [equipasLoadedForClubeId, setEquipasLoadedForClubeId] = useState<
        string | null
    >(null);
    const [semEquipas, setSemEquipas] = useState(false);
    const loadingEquipas =
        clubeSelecionado !== null &&
        equipasLoadedForClubeId !== clubeSelecionado.id;

    /* ── Passo 2 — adversário sem clube (treinador) ── */
    const [pesquisaTreinador, setPesquisaTreinador] = useState("");
    const [resultadosTreinador, setResultadosTreinador] = useState<
        EquipaTreinador[]
    >([]);
    const [buscandoTreinador, setBuscandoTreinador] = useState(false);
    const [equipaTreinadorSelecionada, setEquipaTreinadorSelecionada] =
        useState<EquipaTreinador | null>(null);
    const searchTimerTreinador = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    /* ── Passo 2 — adversário manual ── */
    const [nomeManual, setNomeManual] = useState("");

    /* ── Passo 3 — detalhes ── */
    const [dataJogo, setDataJogo] = useState(defaultData || "");
    const [casaFora, setCasaFora] = useState("casa");
    const [local, setLocal] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [equipaId, setEquipaId] = useState(equipas[0]?.id ?? "");
    const [visibilidadePublica, setVisibilidadePublica] = useState(false);
    const [saving, setSaving] = useState(false);
    const [erroData, setErroData] = useState("");
    const [toast, setToast] = useState<{
        msg: string;
        tipo: "ok" | "erro";
    } | null>(null);

    const showToast = useCallback((msg: string, tipo: "ok" | "erro" = "ok") => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 2500);
    }, []);

    const resultadosMostrar =
        adversarioPossuiClube === true && pesquisa.trim().length >= 2
            ? resultados
            : [];

    /* ── Pesquisa de clubes ── */
    useEffect(() => {
        if (adversarioPossuiClube !== true || pesquisa.trim().length < 2)
            return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setBuscando(true);
            const res = await fetch(
                `/api/clubes?q=${encodeURIComponent(pesquisa.trim())}`,
            );
            if (res.ok) {
                const data: Clube[] = await res.json();
                setResultados(
                    meuClubeId ? data.filter((c) => c.id !== meuClubeId) : data,
                );
            } else {
                setResultados([]);
            }
            setBuscando(false);
        }, 350);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [pesquisa, adversarioPossuiClube, meuClubeId]);

    /* ── Carregar equipas do clube selecionado ── */
    useEffect(() => {
        if (!clubeSelecionado) return;
        const id = clubeSelecionado.id;
        let cancelled = false;
        fetch(`/api/equipas?clube_id=${encodeURIComponent(id)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: { id: string; nome: string }[]) => {
                if (cancelled) return;
                setEquipasAdv(data);
                setEquipaAdvSelecionada(null);
                setSemEquipas(data.length === 0);
                setEquipasLoadedForClubeId(id);
            })
            .catch(() => {
                if (cancelled) return;
                setSemEquipas(true);
                setEquipasLoadedForClubeId(id);
            });
        return () => {
            cancelled = true;
        };
    }, [clubeSelecionado]);

    /* ── Pesquisa de equipa de treinador ── */
    useEffect(() => {
        if (
            adversarioPossuiClube !== false ||
            pesquisaTreinador.trim().length < 2
        )
            return;
        if (searchTimerTreinador.current)
            clearTimeout(searchTimerTreinador.current);
        searchTimerTreinador.current = setTimeout(async () => {
            setBuscandoTreinador(true);
            const res = await fetch(
                `/api/treinador/pesquisar-equipas?q=${encodeURIComponent(pesquisaTreinador.trim())}`,
            );
            if (res.ok) setResultadosTreinador(await res.json());
            else setResultadosTreinador([]);
            setBuscandoTreinador(false);
        }, 350);
        return () => {
            if (searchTimerTreinador.current)
                clearTimeout(searchTimerTreinador.current);
        };
    }, [pesquisaTreinador, adversarioPossuiClube]);

    /* ── Adversário final ── */
    const adversarioFinal = adversarioNaPlataforma
        ? adversarioPossuiClube === true
            ? (clubeSelecionado?.name ?? "")
            : (equipaTreinadorSelecionada?.nome ?? "")
        : nomeManual.trim();

    const validarEAvancar = () => {
        if (!adversarioFinal || adversarioFinal.length < 2) return;
        setPasso(3);
    };

    /* ── Submit ── */
    const submitJogo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adversarioFinal || !dataJogo) return;
        const d = new Date(dataJogo);
        d.setHours(0, 0, 0, 0);
        if (d < hoje) {
            setErroData("Não é possível agendar um jogo em data já passada.");
            return;
        }
        if (dataJogo === hojeISO && horaInicio) {
            const agora = new Date();
            const [h, m] = horaInicio.split(":").map(Number);
            if (
                h < agora.getHours() ||
                (h === agora.getHours() && m <= agora.getMinutes())
            ) {
                setErroData("Não é possível agendar para uma hora já passada.");
                return;
            }
        }
        setErroData("");
        setSaving(true);
        const res = await fetch("/api/jogos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                adversario: adversarioFinal,
                data: dataJogo,
                casa_fora: casaFora,
                local,
                equipa_id: equipaId,
                hora_inicio: horaInicio,
                hora_fim: horaFim,
                adversario_org_id: adversarioNaPlataforma
                    ? adversarioPossuiClube
                        ? (clubeSelecionado?.id ?? null)
                        : (equipaTreinadorSelecionada?.organization_id ?? null)
                    : null,
                visibilidade_publica: visibilidadePublica,
            }),
        });
        setSaving(false);
        if (res.ok) {
            showToast("Jogo agendado com sucesso!");
            setTimeout(() => {
                handleClose();
                onCreated?.();
            }, 400);
        } else {
            showToast(await res.text(), "erro");
        }
    };

    /* ── Reset / close ── */
    function resetModal() {
        setPasso(1);
        setAdversarioNaPlataforma(null);
        setAdversarioPossuiClube(null);
        setPesquisa("");
        setResultados([]);
        setClubeSelecionado(null);
        setEquipasAdv([]);
        setEquipaAdvSelecionada(null);
        setSemEquipas(false);
        setEquipasLoadedForClubeId(null);
        setPesquisaTreinador("");
        setResultadosTreinador([]);
        setEquipaTreinadorSelecionada(null);
        setNomeManual("");
        setDataJogo(defaultData || "");
        setCasaFora("casa");
        setLocal("");
        setHoraInicio("");
        setHoraFim("");
        setEquipaId(equipas[0]?.id ?? "");
        setVisibilidadePublica(false);
        setErroData("");
    }

    function handleClose() {
        setOpen(false);
        resetModal();
    }

    const handleBack = () => {
        if (passo === 2) {
            setPasso(1);
            setAdversarioNaPlataforma(null);
            setAdversarioPossuiClube(null);
            setPesquisa("");
            setResultados([]);
            setClubeSelecionado(null);
            setEquipasAdv([]);
            setEquipaAdvSelecionada(null);
            setSemEquipas(false);
            setPesquisaTreinador("");
            setResultadosTreinador([]);
            setEquipaTreinadorSelecionada(null);
            setNomeManual("");
        } else if (passo === 3) {
            setPasso(2);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                + Agendar Jogo
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                {passo > 1 && (
                                    <button
                                        onClick={handleBack}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-lg"
                                    >
                                        ←
                                    </button>
                                )}
                                <div>
                                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                        🏆 Agendar Jogo
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Passo {passo} de 3
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 bg-gray-100 dark:bg-gray-800">
                            <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${(passo / 3) * 100}%` }}
                            />
                        </div>

                        <div className="p-5 flex flex-col gap-5">
                            {/* ── Passo 1 ── */}
                            {passo === 1 && (
                                <>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                                            O adversário está cadastrado na
                                            plataforma?
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Se a equipa adversária também usa o
                                            TeamAction, pode pesquisá-la.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setAdversarioNaPlataforma(true);
                                                setPasso(2);
                                            }}
                                            className="flex-1 border-2 border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1"
                                        >
                                            <span className="text-xl">🔍</span>
                                            <span>Sim, pesquisar</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAdversarioNaPlataforma(
                                                    false,
                                                );
                                                setPasso(2);
                                            }}
                                            className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1"
                                        >
                                            <span className="text-xl">✏️</span>
                                            <span>Não, escrever</span>
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ── Passo 2 — adversário na plataforma ── */}
                            {passo === 2 && adversarioNaPlataforma === true && (
                                <>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-3">
                                            A equipa adversária possui um clube?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setAdversarioPossuiClube(
                                                        true,
                                                    );
                                                    setEquipaTreinadorSelecionada(
                                                        null,
                                                    );
                                                    setPesquisaTreinador("");
                                                    setResultadosTreinador([]);
                                                }}
                                                className={`flex-1 border-2 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${adversarioPossuiClube === true ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                            >
                                                <span className="text-xl">
                                                    🏟️
                                                </span>
                                                <span>Sim</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAdversarioPossuiClube(
                                                        false,
                                                    );
                                                    setClubeSelecionado(null);
                                                    setPesquisa("");
                                                    setResultados([]);
                                                    setEquipasAdv([]);
                                                    setEquipaAdvSelecionada(
                                                        null,
                                                    );
                                                    setSemEquipas(false);
                                                }}
                                                className={`flex-1 border-2 font-bold py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${adversarioPossuiClube === false ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                            >
                                                <span className="text-xl">
                                                    👤
                                                </span>
                                                <span>Não</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pesquisa de clube */}
                                    {adversarioPossuiClube === true && (
                                        <>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    Pesquisar clube adversário{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    autoFocus
                                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                    placeholder="Nome do clube..."
                                                    value={pesquisa}
                                                    onChange={(e) => {
                                                        setPesquisa(
                                                            e.target.value,
                                                        );
                                                        setClubeSelecionado(
                                                            null,
                                                        );
                                                    }}
                                                />
                                            </div>

                                            {buscando && (
                                                <p className="text-xs text-gray-400 text-center">
                                                    A pesquisar...
                                                </p>
                                            )}

                                            {!buscando &&
                                                resultadosMostrar.length >
                                                    0 && (
                                                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                                                        {resultadosMostrar.map(
                                                            (c) => (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        setClubeSelecionado(
                                                                            c,
                                                                        );
                                                                        setPesquisa(
                                                                            c.name,
                                                                        );
                                                                        setResultados(
                                                                            [],
                                                                        );
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${clubeSelecionado?.id === c.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                                                                >
                                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                                        {c.name}
                                                                    </p>
                                                                    {(c.cidade ||
                                                                        c.desporto) && (
                                                                        <p className="text-xs text-gray-400">
                                                                            {[
                                                                                c.desporto,
                                                                                c.cidade,
                                                                            ]
                                                                                .filter(
                                                                                    Boolean,
                                                                                )
                                                                                .join(
                                                                                    " · ",
                                                                                )}
                                                                        </p>
                                                                    )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                            {!buscando &&
                                                pesquisa.trim().length >= 2 &&
                                                resultadosMostrar.length ===
                                                    0 &&
                                                !clubeSelecionado && (
                                                    <p className="text-sm text-gray-400 text-center py-2">
                                                        Nenhum clube encontrado
                                                        na plataforma.
                                                    </p>
                                                )}

                                            {clubeSelecionado &&
                                                loadingEquipas && (
                                                    <p className="text-xs text-gray-400 text-center">
                                                        A carregar equipas...
                                                    </p>
                                                )}

                                            {clubeSelecionado &&
                                                !loadingEquipas &&
                                                semEquipas && (
                                                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm font-medium">
                                                        <span>⚠️</span>
                                                        <span>
                                                            Este clube ainda não
                                                            tem equipas
                                                            cadastradas na
                                                            plataforma.
                                                        </span>
                                                    </div>
                                                )}

                                            {clubeSelecionado &&
                                                !loadingEquipas &&
                                                !semEquipas &&
                                                equipasAdv.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                            Selecionar equipa{" "}
                                                            <span className="text-red-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <select
                                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                            value={
                                                                equipaAdvSelecionada?.id ??
                                                                ""
                                                            }
                                                            onChange={(e) => {
                                                                const found =
                                                                    equipasAdv.find(
                                                                        (eq) =>
                                                                            eq.id ===
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    ) ?? null;
                                                                setEquipaAdvSelecionada(
                                                                    found,
                                                                );
                                                            }}
                                                        >
                                                            <option value="">
                                                                Escolher
                                                                equipa...
                                                            </option>
                                                            {equipasAdv.map(
                                                                (eq) => (
                                                                    <option
                                                                        key={
                                                                            eq.id
                                                                        }
                                                                        value={
                                                                            eq.id
                                                                        }
                                                                    >
                                                                        {
                                                                            eq.nome
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>
                                                )}

                                            <button
                                                onClick={validarEAvancar}
                                                disabled={
                                                    !clubeSelecionado ||
                                                    semEquipas ||
                                                    !equipaAdvSelecionada
                                                }
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                                            >
                                                Continuar →
                                            </button>
                                        </>
                                    )}

                                    {/* Pesquisa de equipa de treinador (sem clube) */}
                                    {adversarioPossuiClube === false && (
                                        <>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    Pesquisar organização do
                                                    treinador{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    autoFocus
                                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                    placeholder="Nome da equipa ou do treinador..."
                                                    value={pesquisaTreinador}
                                                    onChange={(e) => {
                                                        setPesquisaTreinador(
                                                            e.target.value,
                                                        );
                                                        setEquipaTreinadorSelecionada(
                                                            null,
                                                        );
                                                    }}
                                                />
                                            </div>

                                            {buscandoTreinador && (
                                                <p className="text-xs text-gray-400 text-center">
                                                    A pesquisar...
                                                </p>
                                            )}

                                            {!buscandoTreinador &&
                                                pesquisaTreinador.trim()
                                                    .length >= 2 &&
                                                resultadosTreinador.length >
                                                    0 && (
                                                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                                                        {resultadosTreinador.map(
                                                            (e) => (
                                                                <button
                                                                    key={
                                                                        e.organization_id
                                                                    }
                                                                    onClick={() => {
                                                                        setEquipaTreinadorSelecionada(
                                                                            e,
                                                                        );
                                                                        setPesquisaTreinador(
                                                                            e.nome,
                                                                        );
                                                                        setResultadosTreinador(
                                                                            [],
                                                                        );
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${equipaTreinadorSelecionada?.organization_id === e.organization_id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                                                                >
                                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                                        {e.nome}
                                                                    </p>
                                                                    {e.treinador_nome && (
                                                                        <p className="text-xs text-gray-400">
                                                                            Treinador:{" "}
                                                                            {
                                                                                e.treinador_nome
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                            {!buscandoTreinador &&
                                                pesquisaTreinador.trim()
                                                    .length >= 2 &&
                                                resultadosTreinador.length ===
                                                    0 &&
                                                !equipaTreinadorSelecionada && (
                                                    <p className="text-sm text-gray-400 text-center py-2">
                                                        Nenhuma equipa de
                                                        treinador encontrada.
                                                    </p>
                                                )}

                                            <button
                                                onClick={validarEAvancar}
                                                disabled={
                                                    !equipaTreinadorSelecionada
                                                }
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                                            >
                                                Continuar →
                                            </button>
                                        </>
                                    )}
                                </>
                            )}

                            {/* ── Passo 2 — adversário manual ── */}
                            {passo === 2 &&
                                adversarioNaPlataforma === false && (
                                    <>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                                                Criar equipa adversária
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Esta equipa não está na
                                                plataforma. Será criada como
                                                equipa fictícia (🤖) apenas para
                                                registar este jogo.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                Nome da equipa adversária{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                autoFocus
                                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                placeholder="Ex: FC Maia"
                                                value={nomeManual}
                                                onChange={(e) =>
                                                    setNomeManual(
                                                        e.target.value,
                                                    )
                                                }
                                                maxLength={100}
                                                onKeyDown={(e) =>
                                                    e.key === "Enter" &&
                                                    nomeManual.trim().length >=
                                                        2 &&
                                                    validarEAvancar()
                                                }
                                            />
                                            <p className="text-xs text-gray-400 text-right">
                                                {nomeManual.length}/100
                                            </p>
                                        </div>
                                        <button
                                            onClick={validarEAvancar}
                                            disabled={
                                                nomeManual.trim().length < 2
                                            }
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all"
                                        >
                                            Continuar →
                                        </button>
                                    </>
                                )}

                            {/* ── Passo 3 — detalhes do jogo ── */}
                            {passo === 3 && (
                                <form
                                    onSubmit={submitJogo}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-semibold text-blue-800 dark:text-blue-300">
                                        vs {adversarioFinal}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Data{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            min={hojeISO}
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            value={dataJogo}
                                            onChange={(e) => {
                                                setDataJogo(e.target.value);
                                                setErroData("");
                                            }}
                                            required
                                        />
                                        {erroData && (
                                            <p className="text-xs text-red-500">
                                                {erroData}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            A nossa equipa{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            value={equipaId}
                                            onChange={(e) =>
                                                setEquipaId(e.target.value)
                                            }
                                            required
                                        >
                                            <option value="">
                                                Selecionar equipa...
                                            </option>
                                            {equipas.map((eq) => (
                                                <option
                                                    key={eq.id}
                                                    value={eq.id}
                                                >
                                                    {eq.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Casa / Fora{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            value={casaFora}
                                            onChange={(e) =>
                                                setCasaFora(e.target.value)
                                            }
                                        >
                                            <option value="casa">Casa</option>
                                            <option value="fora">Fora</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                Hora de início{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <div className="flex gap-1">
                                                <select
                                                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-2 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                    value={
                                                        horaInicio
                                                            ? horaInicio.split(
                                                                  ":",
                                                              )[0]
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        const h =
                                                            e.target.value;
                                                        const m = horaInicio
                                                            ? horaInicio.split(
                                                                  ":",
                                                              )[1]
                                                            : "00";
                                                        if (h && m) {
                                                            const newVal = `${h}:${m}`;
                                                            setHoraInicio(
                                                                newVal,
                                                            );
                                                            const totalMin =
                                                                parseInt(h) *
                                                                    60 +
                                                                parseInt(m) +
                                                                90;
                                                            const fimH =
                                                                Math.floor(
                                                                    totalMin /
                                                                        60,
                                                                ) % 24;
                                                            const fimM =
                                                                totalMin % 60;
                                                            setHoraFim(
                                                                `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                                            );
                                                        } else {
                                                            setHoraInicio(
                                                                h
                                                                    ? `${h}:00`
                                                                    : "",
                                                            );
                                                        }
                                                    }}
                                                    required
                                                >
                                                    <option value="">HH</option>
                                                    {Array.from(
                                                        { length: 24 },
                                                        (_, i) => (
                                                            <option
                                                                key={i}
                                                                value={String(
                                                                    i,
                                                                ).padStart(
                                                                    2,
                                                                    "0",
                                                                )}
                                                            >
                                                                {String(
                                                                    i,
                                                                ).padStart(
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
                                                            ? horaInicio.split(
                                                                  ":",
                                                              )[1]
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        const m =
                                                            e.target.value;
                                                        const h = horaInicio
                                                            ? horaInicio.split(
                                                                  ":",
                                                              )[0]
                                                            : "";
                                                        if (h && m) {
                                                            const newVal = `${h}:${m}`;
                                                            setHoraInicio(
                                                                newVal,
                                                            );
                                                            const totalMin =
                                                                parseInt(h) *
                                                                    60 +
                                                                parseInt(m) +
                                                                90;
                                                            const fimH =
                                                                Math.floor(
                                                                    totalMin /
                                                                        60,
                                                                ) % 24;
                                                            const fimM =
                                                                totalMin % 60;
                                                            setHoraFim(
                                                                `${String(fimH).padStart(2, "0")}:${String(fimM).padStart(2, "0")}`,
                                                            );
                                                        }
                                                    }}
                                                    required
                                                >
                                                    <option value="">MM</option>
                                                    {[
                                                        "00",
                                                        "15",
                                                        "30",
                                                        "45",
                                                    ].map((m) => (
                                                        <option
                                                            key={m}
                                                            value={m}
                                                        >
                                                            {m}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                Hora terminada{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="time"
                                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                value={horaFim}
                                                readOnly
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Local
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            placeholder="Ex: Estádio Municipal"
                                            value={local}
                                            onChange={(e) =>
                                                setLocal(e.target.value)
                                            }
                                            maxLength={100}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 py-1">
                                        <input
                                            id="visibilidade_publica"
                                            type="checkbox"
                                            className="w-4 h-4 rounded accent-blue-600"
                                            checked={visibilidadePublica}
                                            onChange={(e) =>
                                                setVisibilidadePublica(
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="visibilidade_publica"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Visível publicamente
                                        </label>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={saving || !equipaId}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow"
                                        >
                                            {saving
                                                ? "A agendar..."
                                                : "Agendar Jogo"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
