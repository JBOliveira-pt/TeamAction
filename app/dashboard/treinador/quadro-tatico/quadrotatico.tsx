"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

/* ── Tipos ─────────────────────────────────────────────────────────────── */
type Player = { id: string; color: "blue" | "red"; x: number; y: number };

type Jogada = {
    id: string;
    nome: string;
    tipo: string;
    sistema: string;
    posicoes: Player[];
    created_at: string;
};

/* ── Formações defensivas (equipa vermelha) ────────────────────────────── */
const FORMACOES: Record<string, Player[]> = {
    "6-0": [
        { id: "A1", color: "red", x: 78, y: 20 },
        { id: "A2", color: "red", x: 78, y: 32 },
        { id: "A3", color: "red", x: 78, y: 44 },
        { id: "A4", color: "red", x: 78, y: 56 },
        { id: "A5", color: "red", x: 78, y: 68 },
        { id: "A6", color: "red", x: 78, y: 80 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "5-1": [
        { id: "A1", color: "red", x: 78, y: 20 },
        { id: "A2", color: "red", x: 78, y: 35 },
        { id: "A3", color: "red", x: 78, y: 50 },
        { id: "A4", color: "red", x: 78, y: 65 },
        { id: "A5", color: "red", x: 78, y: 80 },
        { id: "A6", color: "red", x: 65, y: 50 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "3-2-1": [
        { id: "A1", color: "red", x: 78, y: 28 },
        { id: "A2", color: "red", x: 78, y: 50 },
        { id: "A3", color: "red", x: 78, y: 72 },
        { id: "A4", color: "red", x: 67, y: 38 },
        { id: "A5", color: "red", x: 67, y: 62 },
        { id: "A6", color: "red", x: 57, y: 50 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "4-2": [
        { id: "A1", color: "red", x: 78, y: 26 },
        { id: "A2", color: "red", x: 78, y: 42 },
        { id: "A3", color: "red", x: 78, y: 58 },
        { id: "A4", color: "red", x: 78, y: 74 },
        { id: "A5", color: "red", x: 67, y: 38 },
        { id: "A6", color: "red", x: 67, y: 62 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "3-3": [
        { id: "A1", color: "red", x: 78, y: 28 },
        { id: "A2", color: "red", x: 78, y: 50 },
        { id: "A3", color: "red", x: 78, y: 72 },
        { id: "A4", color: "red", x: 65, y: 22 },
        { id: "A5", color: "red", x: 65, y: 50 },
        { id: "A6", color: "red", x: 65, y: 78 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
};

const JOGADORES_ATAQUE_INICIAL: Player[] = [
    { id: "7",  color: "blue", x: 22, y: 20 },
    { id: "9",  color: "blue", x: 22, y: 32 },
    { id: "11", color: "blue", x: 22, y: 44 },
    { id: "5",  color: "blue", x: 22, y: 56 },
    { id: "3",  color: "blue", x: 22, y: 68 },
    { id: "14", color: "blue", x: 22, y: 80 },
    { id: "GR", color: "blue", x: 10, y: 50 },
];

const SISTEMAS = ["6-0", "5-1", "3-2-1", "4-2", "3-3"] as const;
const TIPOS = ["Ataque", "Defesa", "Transição", "Bola Parada", "Personalizada"] as const;
const LS_KEY = "quadro_tatico_board";

/* ── Toast simples ─────────────────────────────────────────────────────── */
function Toast({ msg, tipo }: { msg: string; tipo: "ok" | "erro" }) {
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 transition-all ${tipo === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {tipo === "ok" ? "✓" : "✕"} {msg}
        </div>
    );
}

/* ── Modal de confirmação ──────────────────────────────────────────────── */
function ModalConfirm({ titulo, descricao, onConfirm, onCancel, labelConfirm = "Confirmar", perigo = false }: {
    titulo: string;
    descricao?: string;
    onConfirm: () => void;
    onCancel: () => void;
    labelConfirm?: string;
    perigo?: boolean;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{titulo}</h3>
                {descricao && <p className="text-sm text-gray-500 dark:text-gray-400">{descricao}</p>}
                <div className="flex gap-2">
                    <button
                        onClick={onConfirm}
                        className={`flex-1 font-bold py-2.5 rounded-xl transition-all ${perigo ? "bg-red-600 hover:bg-red-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                    >
                        {labelConfirm}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal de texto (substitui prompt) ────────────────────────────────── */
function ModalTexto({ titulo, valorInicial, onConfirm, onCancel }: {
    titulo: string;
    valorInicial: string;
    onConfirm: (v: string) => void;
    onCancel: () => void;
}) {
    const [valor, setValor] = useState(valorInicial);
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{titulo}</h3>
                <input
                    autoFocus
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    maxLength={80}
                    onKeyDown={(e) => e.key === "Enter" && valor.trim().length >= 2 && onConfirm(valor.trim())}
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => valor.trim().length >= 2 && onConfirm(valor.trim())}
                        disabled={valor.trim().length < 2}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                    >
                        Guardar
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal ver todas as jogadas ────────────────────────────────────────── */
function ModalVerTodas({ jogadas, onClose }: { jogadas: Jogada[]; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">📑 Todas as Jogadas</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold">×</button>
                </div>
                <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-2">
                    {jogadas.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Nenhuma jogada guardada.</p>
                    ) : jogadas.map((j) => (
                        <div key={j.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{j.nome}</p>
                                <p className="text-xs text-gray-400">{j.tipo} · Sistema {j.sistema}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-5 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all">Fechar</button>
                </div>
            </div>
        </div>
    );
}

/* ── Componente principal ──────────────────────────────────────────────── */
export default function QuadroTatico() {
    const [jogadas, setJogadas] = useState<Jogada[]>([]);
    const [jogadaSelecionada, setJogadaSelecionada] = useState<string | null>(null);
    const [sistema, setSistema] = useState<string>("6-0");
    const [players, setPlayers] = useState<Player[]>([
        ...JOGADORES_ATAQUE_INICIAL,
        ...FORMACOES["6-0"],
    ]);
    const [dragged, setDragged] = useState<number | null>(null);
    const fieldRef = useRef<HTMLDivElement>(null);

    // Toast
    const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
    const showToast = useCallback((msg: string, tipo: "ok" | "erro" = "ok") => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 2500);
    }, []);

    // Modais
    const [modalNovaJogada, setModalNovaJogada] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [novoTipo, setNovoTipo] = useState<string>("Personalizada");
    const [savingNova, setSavingNova] = useState(false);

    const [modalConfirm, setModalConfirm] = useState<{ titulo: string; descricao?: string; onConfirm: () => void; perigo?: boolean; label?: string } | null>(null);
    const [modalEditar, setModalEditar] = useState<{ id: string; nomeAtual: string } | null>(null);
    const [modalVerTodas, setModalVerTodas] = useState(false);

    // Carregar jogadas do Neon e board do localStorage
    useEffect(() => {
        fetch("/api/jogadas-taticas")
            .then((r) => r.ok ? r.json() : [])
            .then((data: Jogada[]) => {
                setJogadas(data);
                if (data.length > 0) setJogadaSelecionada(data[0].id);
            })
            .catch(() => {});

        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
            setTimeout(() => {
                try {
                    const { players: p, sistema: s } = JSON.parse(cached);
                    if (Array.isArray(p)) setPlayers(p);
                    if (s) setSistema(s);
                } catch { /* ignorar */ }
            }, 0);
        }
    }, []);

    // Guardar board no localStorage quando muda
    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify({ players, sistema }));
    }, [players, sistema]);

    // Mudar sistema → reposicionar equipa vermelha
    function mudarSistema(s: string) {
        setSistema(s);
        const novasPosicoesVermelhas = FORMACOES[s];
        if (!novasPosicoesVermelhas) return;
        setPlayers((prev) => {
            const azuis = prev.filter((p) => p.color === "blue");
            return [...azuis, ...novasPosicoesVermelhas];
        });
    }

    // Drag & drop no campo
    function onMouseMove(e: React.MouseEvent) {
        if (dragged === null || !fieldRef.current) return;
        const rect = fieldRef.current.getBoundingClientRect();
        const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
        setPlayers((prev) => prev.map((p, idx) => idx === dragged ? { ...p, x, y } : p));
    }

    function onTouchMove(e: React.TouchEvent) {
        if (dragged === null || !fieldRef.current) return;
        const touch = e.touches[0];
        const rect = fieldRef.current.getBoundingClientRect();
        const x = Math.max(2, Math.min(98, ((touch.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(2, Math.min(98, ((touch.clientY - rect.top) / rect.height) * 100));
        setPlayers((prev) => prev.map((p, idx) => idx === dragged ? { ...p, x, y } : p));
    }

    // Guardar jogada seleccionada
    async function guardar() {
        if (!jogadaSelecionada) {
            showToast("Selecione ou crie uma jogada primeiro.", "erro");
            return;
        }
        const jogada = jogadas.find((j) => j.id === jogadaSelecionada);
        if (!jogada) return;

        const res = await fetch(`/api/jogadas-taticas/${jogadaSelecionada}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: jogada.nome, tipo: jogada.tipo, sistema, posicoes: players }),
        });
        if (res.ok) {
            setJogadas((prev) => prev.map((j) => j.id === jogadaSelecionada ? { ...j, sistema, posicoes: players } : j));
            showToast("Jogada guardada com sucesso!");
        } else {
            showToast("Erro ao guardar jogada.", "erro");
        }
    }

    // Criar nova jogada
    async function criarJogada() {
        if (!novoNome.trim() || novoNome.trim().length < 2) return;
        setSavingNova(true);
        const res = await fetch("/api/jogadas-taticas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: novoNome.trim(), tipo: novoTipo, sistema, posicoes: players }),
        });
        setSavingNova(false);
        if (res.ok) {
            const nova: Jogada = await res.json();
            setJogadas((prev) => [nova, ...prev]);
            setJogadaSelecionada(nova.id);
            setModalNovaJogada(false);
            setNovoNome("");
            setNovoTipo("Personalizada");
            showToast("Jogada criada!");
        } else {
            showToast(await res.text(), "erro");
        }
    }

    // Editar nome da jogada
    async function editarNome(id: string, novoNomeValor: string) {
        const jogada = jogadas.find((j) => j.id === id);
        if (!jogada) return;
        const res = await fetch(`/api/jogadas-taticas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: novoNomeValor, tipo: jogada.tipo, sistema: jogada.sistema, posicoes: jogada.posicoes }),
        });
        if (res.ok) {
            setJogadas((prev) => prev.map((j) => j.id === id ? { ...j, nome: novoNomeValor } : j));
            showToast("Nome actualizado!");
        } else {
            showToast("Erro ao actualizar.", "erro");
        }
        setModalEditar(null);
    }

    // Remover jogada
    async function removerJogada(id: string) {
        const res = await fetch(`/api/jogadas-taticas/${id}`, { method: "DELETE" });
        if (res.ok) {
            const novas = jogadas.filter((j) => j.id !== id);
            setJogadas(novas);
            setJogadaSelecionada(novas.length > 0 ? novas[0].id : null);
            showToast("Jogada removida.");
        } else {
            showToast("Erro ao remover.", "erro");
        }
    }

    // Carregar jogada seleccionada no campo
    function carregarJogada(id: string) {
        setJogadaSelecionada(id);
        const j = jogadas.find((jj) => jj.id === id);
        if (Array.isArray(j?.posicoes) && j.posicoes.length) {
            setPlayers(j.posicoes);
            setSistema(j.sistema);
        }
    }

    // Desfazer → repor posições iniciais do sistema actual
    function desfazer() {
        const azuis = JOGADORES_ATAQUE_INICIAL;
        const vermelhos = FORMACOES[sistema] ?? FORMACOES["6-0"];
        setPlayers([...azuis, ...vermelhos]);
        showToast("Posições repostas.");
    }

    // Limpar todas as jogadas do Neon
    function pedirLimpar() {
        setModalConfirm({
            titulo: "Remover todas as jogadas?",
            descricao: "Esta acção é irreversível. Todas as jogadas guardadas serão eliminadas.",
            perigo: true,
            label: "Eliminar tudo",
            onConfirm: async () => {
                setModalConfirm(null);
                await Promise.all(jogadas.map((j) => fetch(`/api/jogadas-taticas/${j.id}`, { method: "DELETE" })));
                setJogadas([]);
                setJogadaSelecionada(null);
                showToast("Todas as jogadas removidas.");
            },
        });
    }

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6 flex flex-col lg:flex-row gap-6">

            {/* ── TOAST ─────────────────────────────────────────────────── */}
            {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

            {/* ── MODAL NOVA JOGADA ─────────────────────────────────────── */}
            {modalNovaJogada && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2"><span>✨</span> Nova Jogada</h3>
                            <button onClick={() => setModalNovaJogada(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 text-xl font-bold">×</button>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nome <span className="text-red-500">*</span></label>
                            <input
                                autoFocus
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                placeholder="Ex: Ataque Posicional A1"
                                value={novoNome}
                                onChange={(e) => setNovoNome(e.target.value)}
                                maxLength={80}
                            />
                            <p className="text-xs text-gray-400 text-right">{novoNome.length}/80</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tipo</label>
                            <select
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                value={novoTipo}
                                onChange={(e) => setNovoTipo(e.target.value)}
                            >
                                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={criarJogada}
                                disabled={savingNova || novoNome.trim().length < 2}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                            >
                                {savingNova ? "A guardar..." : "Criar"}
                            </button>
                            <button onClick={() => setModalNovaJogada(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-all">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CONFIRMAÇÃO ─────────────────────────────────────── */}
            {modalConfirm && (
                <ModalConfirm
                    titulo={modalConfirm.titulo}
                    descricao={modalConfirm.descricao}
                    onConfirm={modalConfirm.onConfirm}
                    onCancel={() => setModalConfirm(null)}
                    labelConfirm={modalConfirm.label}
                    perigo={modalConfirm.perigo}
                />
            )}

            {/* ── MODAL EDITAR NOME ─────────────────────────────────────── */}
            {modalEditar && (
                <ModalTexto
                    titulo="Editar nome da jogada"
                    valorInicial={modalEditar.nomeAtual}
                    onConfirm={(v) => editarNome(modalEditar.id, v)}
                    onCancel={() => setModalEditar(null)}
                />
            )}

            {/* ── MODAL VER TODAS ───────────────────────────────────────── */}
            {modalVerTodas && (
                <ModalVerTodas jogadas={jogadas} onClose={() => setModalVerTodas(false)} />
            )}

            {/* ── ÁREA PRINCIPAL ────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-3">
                        <span>📋</span> Quadro Tático
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Editor de jogadas e sistemas defensivos
                    </p>
                </div>

                {/* Botões de sistema */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {SISTEMAS.map((s) => (
                        <button
                            key={s}
                            onClick={() => mudarSistema(s)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all shadow-sm ${
                                sistema === s
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            }`}
                            title={`Formação defensiva ${s}`}
                        >
                            🧩 {s}
                        </button>
                    ))}
                </div>

                {/* Campo de andebol */}
                <div
                    ref={fieldRef}
                    className="relative mb-4 rounded-2xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 overflow-hidden w-full shadow-lg select-none"
                    style={{ aspectRatio: "400 / 220" }}
                    onMouseMove={onMouseMove}
                    onMouseUp={() => setDragged(null)}
                    onMouseLeave={() => setDragged(null)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => setDragged(null)}
                >
                    {/* Linhas do campo */}
                    <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full pointer-events-none">
                        {/* Exterior */}
                        <rect x="10" y="10" width="380" height="200" fill="none" stroke="#22c55e" strokeWidth="2" />
                        {/* Linha central */}
                        <line x1="200" y1="10" x2="200" y2="210" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6,4" />
                        {/* Área de baliza esquerda */}
                        <rect x="10" y="70" width="55" height="80" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        {/* Área de baliza direita */}
                        <rect x="335" y="70" width="55" height="80" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        {/* Linha 6m esquerda */}
                        <path d="M 10 70 Q 80 110 10 150" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        {/* Linha 6m direita */}
                        <path d="M 390 70 Q 320 110 390 150" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        {/* Linha 9m esquerda */}
                        <path d="M 10 55 Q 110 110 10 165" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="5,4" />
                        {/* Linha 9m direita */}
                        <path d="M 390 55 Q 280 110 390 165" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="5,4" />
                        {/* Círculo central */}
                        <circle cx="200" cy="110" r="28" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        {/* Ponto central */}
                        <circle cx="200" cy="110" r="2.5" fill="#22c55e" />
                        {/* Marca 7m esquerda */}
                        <circle cx="62" cy="110" r="2.5" fill="#22c55e" />
                        {/* Marca 7m direita */}
                        <circle cx="338" cy="110" r="2.5" fill="#22c55e" />
                    </svg>

                    {/* Jogadores */}
                    {players.map((p, idx) => (
                        <div
                            key={`${p.id}-${p.color}`}
                            className={`absolute w-9 h-9 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-lg cursor-move text-xs transition-transform active:scale-110 ${
                                p.color === "blue"
                                    ? "bg-blue-600 text-white"
                                    : "bg-red-600 text-white"
                            }`}
                            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
                            onMouseDown={() => setDragged(idx)}
                            onTouchStart={() => setDragged(idx)}
                        >
                            {p.id}
                        </div>
                    ))}

                    {/* Legenda no campo */}
                    <div className="absolute bottom-2 left-3 flex gap-3 text-[10px] font-semibold pointer-events-none">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Adversário</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Casa</span>
                    </div>
                </div>

                {/* Botões de acção */}
                <div className="flex gap-2">
                    <button
                        onClick={desfazer}
                        className="flex-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 font-bold border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
                    >
                        <span>↩️</span> Repor
                    </button>
                    <button
                        onClick={guardar}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 transition-all text-sm shadow"
                    >
                        <span>💾</span> Guardar
                    </button>
                    <button
                        onClick={() => { setNovoNome(""); setNovoTipo("Personalizada"); setModalNovaJogada(true); }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 transition-all text-sm shadow"
                    >
                        <span>＋</span> Nova
                    </button>
                </div>
            </div>

            {/* ── PAINEL LATERAL ────────────────────────────────────────── */}
            <div className="w-full lg:w-72 flex flex-col gap-3">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex-1 shadow-sm">
                    <div className="font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-base"><span>📑</span> Jogadas</span>
                        <button
                            onClick={pedirLimpar}
                            className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Remover todas"
                        >
                            🧹 Limpar
                        </button>
                    </div>

                    {jogadas.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">
                            Nenhuma jogada. Clique em <strong>Nova</strong> para criar.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                            {jogadas.map((j) => (
                                <div key={j.id} className="flex items-center gap-1">
                                    <button
                                        onClick={() => carregarJogada(j.id)}
                                        className={`flex-1 text-left px-3 py-2 rounded-xl border transition-all text-sm ${
                                            jogadaSelecionada === j.id
                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                        }`}
                                    >
                                        <div className="font-semibold leading-tight truncate">{j.nome}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{j.tipo} · {j.sistema}</div>
                                    </button>
                                    <button
                                        onClick={() => setModalEditar({ id: j.id, nomeAtual: j.nome })}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                        title="Editar nome"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => setModalConfirm({
                                            titulo: "Remover jogada?",
                                            descricao: `"${j.nome}" será eliminada permanentemente.`,
                                            perigo: true,
                                            label: "Remover",
                                            onConfirm: () => { setModalConfirm(null); removerJogada(j.id); },
                                        })}
                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                        title="Remover"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {jogadas.length > 0 && (
                        <button
                            onClick={() => setModalVerTodas(true)}
                            className="w-full text-xs text-indigo-500 dark:text-indigo-400 mt-3 hover:underline text-center"
                        >
                            Ver todas ({jogadas.length}) →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
