"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

/* ── Tipos ─────────────────────────────────────────────────────────────── */
type Player = { id: string; color: "blue" | "red"; x: number; y: number };
type Arrow  = { id: string; x1: number; y1: number; x2: number; y2: number };

type Jogada = {
    id: string;
    nome: string;
    tipo: string;
    sistema: string;
    posicoes: Player[];
    setas: Arrow[];
    descricao: string;
    created_at: string;
};

/* ── Formações defensivas (equipa vermelha) ────────────────────────────── */
const FORMACOES: Record<string, Player[]> = {
    "6-0": [
        { id: "1", color: "red", x: 78, y: 20 },
        { id: "2", color: "red", x: 78, y: 32 },
        { id: "3", color: "red", x: 78, y: 44 },
        { id: "4", color: "red", x: 78, y: 56 },
        { id: "5", color: "red", x: 78, y: 68 },
        { id: "6", color: "red", x: 78, y: 80 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "5-1": [
        { id: "1", color: "red", x: 78, y: 20 },
        { id: "2", color: "red", x: 78, y: 35 },
        { id: "3", color: "red", x: 78, y: 50 },
        { id: "4", color: "red", x: 78, y: 65 },
        { id: "5", color: "red", x: 78, y: 80 },
        { id: "6", color: "red", x: 65, y: 50 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "3-2-1": [
        { id: "1", color: "red", x: 78, y: 28 },
        { id: "2", color: "red", x: 78, y: 50 },
        { id: "3", color: "red", x: 78, y: 72 },
        { id: "4", color: "red", x: 67, y: 38 },
        { id: "5", color: "red", x: 67, y: 62 },
        { id: "6", color: "red", x: 57, y: 50 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "4-2": [
        { id: "1", color: "red", x: 78, y: 26 },
        { id: "2", color: "red", x: 78, y: 42 },
        { id: "3", color: "red", x: 78, y: 58 },
        { id: "4", color: "red", x: 78, y: 74 },
        { id: "5", color: "red", x: 67, y: 38 },
        { id: "6", color: "red", x: 67, y: 62 },
        { id: "GR", color: "red", x: 90, y: 50 },
    ],
    "3-3": [
        { id: "1", color: "red", x: 78, y: 28 },
        { id: "2", color: "red", x: 78, y: 50 },
        { id: "3", color: "red", x: 78, y: 72 },
        { id: "4", color: "red", x: 65, y: 22 },
        { id: "5", color: "red", x: 65, y: 50 },
        { id: "6", color: "red", x: 65, y: 78 },
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
                        <div key={j.id} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{j.nome}</p>
                            <p className="text-xs text-gray-400">{j.tipo} · Sistema {j.sistema}</p>
                            {j.descricao && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{j.descricao}</p>
                            )}
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

/* ── Modal editar jogada (nome + descrição) ────────────────────────────── */
function ModalEditarJogada({ id, nomeAtual, descricaoAtual, onConfirm, onCancel }: {
    id: string;
    nomeAtual: string;
    descricaoAtual: string;
    onConfirm: (id: string, nome: string, descricao: string) => void;
    onCancel: () => void;
}) {
    const [nome, setNome] = useState(nomeAtual);
    const [descricao, setDescricao] = useState(descricaoAtual);
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Editar Jogada</h3>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nome <span className="text-red-500">*</span></label>
                    <input
                        autoFocus
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        maxLength={80}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Descrição</label>
                    <textarea
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none text-sm"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        rows={3}
                        maxLength={300}
                        placeholder="Descreve a jogada, objetivos, movimentos chave..."
                    />
                    <p className="text-xs text-gray-400 text-right">{descricao.length}/300</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => nome.trim().length >= 2 && onConfirm(id, nome.trim(), descricao.trim())}
                        disabled={nome.trim().length < 2}
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
    const [mode, setMode] = useState<"move" | "arrow">("move");
    const [arrows, setArrows] = useState<Arrow[]>([]);
    const [drawingArrow, setDrawingArrow] = useState<{ x1: number; y1: number } | null>(null);
    const [arrowPreview, setArrowPreview] = useState<{ x: number; y: number } | null>(null);
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
    const [novaDescricao, setNovaDescricao] = useState("");
    const [savingNova, setSavingNova] = useState(false);

    const [modalConfirm, setModalConfirm] = useState<{ titulo: string; descricao?: string; onConfirm: () => void; perigo?: boolean; label?: string } | null>(null);
    const [modalEditar, setModalEditar] = useState<{ id: string; nomeAtual: string; descricaoAtual: string } | null>(null);
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
                    const { players: p, sistema: s, arrows: a } = JSON.parse(cached);
                    if (Array.isArray(p)) setPlayers(p);
                    if (s) setSistema(s);
                    if (Array.isArray(a)) setArrows(a);
                } catch { /* ignorar */ }
            }, 0);
        }
    }, []);

    // Guardar board no localStorage quando muda
    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify({ players, sistema, arrows }));
    }, [players, sistema, arrows]);

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

    // Converte clientX/Y para % relativa ao campo
    function toFieldPct(clientX: number, clientY: number) {
        if (!fieldRef.current) return { x: 0, y: 0 };
        const rect = fieldRef.current.getBoundingClientRect();
        return {
            x: Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)),
            y: Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100)),
        };
    }

    // Mouse: mover jogador ou actualizar preview de seta
    function onMouseMove(e: React.MouseEvent) {
        if (!fieldRef.current) return;
        if (mode === "move" && dragged !== null) {
            const { x, y } = toFieldPct(e.clientX, e.clientY);
            setPlayers((prev) => prev.map((p, idx) => idx === dragged ? { ...p, x, y } : p));
        } else if (mode === "arrow" && drawingArrow) {
            const { x, y } = toFieldPct(e.clientX, e.clientY);
            setArrowPreview({ x, y });
        }
    }

    // Mouse: iniciar seta no campo vazio
    function onFieldMouseDown(e: React.MouseEvent) {
        if (mode !== "arrow") return;
        const { x, y } = toFieldPct(e.clientX, e.clientY);
        setDrawingArrow({ x1: x, y1: y });
        setArrowPreview({ x, y });
    }

    // Mouse: finalizar seta
    function onMouseUp(e: React.MouseEvent) {
        if (mode === "move") {
            setDragged(null);
            return;
        }
        if (mode === "arrow" && drawingArrow) {
            const { x, y } = toFieldPct(e.clientX, e.clientY);
            const dx = x - drawingArrow.x1;
            const dy = y - drawingArrow.y1;
            if (Math.sqrt(dx * dx + dy * dy) > 3) {
                setArrows((prev) => [
                    ...prev,
                    { id: Date.now().toString(), x1: drawingArrow.x1, y1: drawingArrow.y1, x2: x, y2: y },
                ]);
            }
            setDrawingArrow(null);
            setArrowPreview(null);
        }
    }

    // Touch: mover jogador ou actualizar preview de seta
    function onTouchMove(e: React.TouchEvent) {
        if (!fieldRef.current) return;
        const touch = e.touches[0];
        if (mode === "move" && dragged !== null) {
            const { x, y } = toFieldPct(touch.clientX, touch.clientY);
            setPlayers((prev) => prev.map((p, idx) => idx === dragged ? { ...p, x, y } : p));
        } else if (mode === "arrow" && drawingArrow) {
            const { x, y } = toFieldPct(touch.clientX, touch.clientY);
            setArrowPreview({ x, y });
        }
    }

    // Touch: finalizar seta
    function onTouchEnd(e: React.TouchEvent) {
        if (mode === "move") {
            setDragged(null);
            return;
        }
        if (mode === "arrow" && drawingArrow) {
            const touch = e.changedTouches[0];
            const { x, y } = toFieldPct(touch.clientX, touch.clientY);
            const dx = x - drawingArrow.x1;
            const dy = y - drawingArrow.y1;
            if (Math.sqrt(dx * dx + dy * dy) > 3) {
                setArrows((prev) => [
                    ...prev,
                    { id: Date.now().toString(), x1: drawingArrow.x1, y1: drawingArrow.y1, x2: x, y2: y },
                ]);
            }
            setDrawingArrow(null);
            setArrowPreview(null);
        }
    }

    // Touch: iniciar seta no campo vazio
    function onFieldTouchStart(e: React.TouchEvent) {
        if (mode !== "arrow") return;
        const touch = e.touches[0];
        const { x, y } = toFieldPct(touch.clientX, touch.clientY);
        setDrawingArrow({ x1: x, y1: y });
        setArrowPreview({ x, y });
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
            body: JSON.stringify({ nome: jogada.nome, tipo: jogada.tipo, sistema, posicoes: players, setas: arrows, descricao: jogada.descricao }),
        });
        if (res.ok) {
            setJogadas((prev) => prev.map((j) => j.id === jogadaSelecionada ? { ...j, sistema, posicoes: players, setas: arrows } : j));
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
            body: JSON.stringify({ nome: novoNome.trim(), tipo: novoTipo, sistema, posicoes: players, setas: arrows, descricao: novaDescricao.trim() }),
        });
        setSavingNova(false);
        if (res.ok) {
            const nova: Jogada = await res.json();
            setJogadas((prev) => [nova, ...prev]);
            setJogadaSelecionada(nova.id);
            setModalNovaJogada(false);
            setNovoNome("");
            setNovoTipo("Personalizada");
            setNovaDescricao("");
            showToast("Jogada criada!");
        } else {
            showToast(await res.text(), "erro");
        }
    }

    // Editar nome e descrição da jogada
    async function editarJogada(id: string, novoNomeValor: string, novaDescricaoValor: string) {
        const jogada = jogadas.find((j) => j.id === id);
        if (!jogada) return;
        const res = await fetch(`/api/jogadas-taticas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: novoNomeValor, tipo: jogada.tipo, sistema: jogada.sistema, posicoes: jogada.posicoes, setas: jogada.setas, descricao: novaDescricaoValor }),
        });
        if (res.ok) {
            setJogadas((prev) => prev.map((j) => j.id === id ? { ...j, nome: novoNomeValor, descricao: novaDescricaoValor } : j));
            showToast("Jogada actualizada!");
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
        if (!j) return;
        const posicoes: Player[] = Array.isArray(j.posicoes)
            ? j.posicoes
            : typeof j.posicoes === "string"
                ? JSON.parse(j.posicoes)
                : [];
        if (posicoes.length) {
            setPlayers(posicoes);
            setSistema(j.sistema);
        }
        const setas: Arrow[] = Array.isArray(j.setas)
            ? j.setas
            : typeof j.setas === "string"
                ? JSON.parse(j.setas)
                : [];
        setArrows(setas);
    }

    // Desfazer → repor posições iniciais do sistema actual
    function desfazer() {
        const azuis = JOGADORES_ATAQUE_INICIAL;
        const vermelhos = FORMACOES[sistema] ?? FORMACOES["6-0"];
        setPlayers([...azuis, ...vermelhos]);
        setArrows([]);
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
        <div className="w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6 flex flex-col lg:flex-row gap-4">

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
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Descrição</label>
                            <textarea
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none text-sm"
                                placeholder="Descreve a jogada, objetivos, movimentos chave..."
                                value={novaDescricao}
                                onChange={(e) => setNovaDescricao(e.target.value)}
                                rows={3}
                                maxLength={300}
                            />
                            <p className="text-xs text-gray-400 text-right">{novaDescricao.length}/300</p>
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

            {/* ── MODAL EDITAR JOGADA ───────────────────────────────────── */}
            {modalEditar && (
                <ModalEditarJogada
                    id={modalEditar.id}
                    nomeAtual={modalEditar.nomeAtual}
                    descricaoAtual={modalEditar.descricaoAtual}
                    onConfirm={editarJogada}
                    onCancel={() => setModalEditar(null)}
                />
            )}

            {/* ── MODAL VER TODAS ───────────────────────────────────────── */}
            {modalVerTodas && (
                <ModalVerTodas jogadas={jogadas} onClose={() => setModalVerTodas(false)} />
            )}

            {/* ── ÁREA PRINCIPAL ────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-0">
                <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2 mb-2">
                    <span>📋</span> Quadro Tático
                </h2>

                {/* Barra única: sistemas + ferramentas */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {SISTEMAS.map((s) => (
                        <button
                            key={s}
                            onClick={() => mudarSistema(s)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-sm border-2 transition-all shadow-sm ${
                                sistema === s
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            }`}
                            title={`Formação defensiva ${s}`}
                        >
                            🧩 {s}
                        </button>
                    ))}
                    <span className="flex-1" />
                    <button
                        onClick={() => setMode("move")}
                        className={`px-3 py-1.5 rounded-lg font-bold text-sm border-2 transition-all flex items-center gap-1.5 ${
                            mode === "move"
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-indigo-50"
                        }`}
                        title="Mover jogadores"
                    >
                        🖐 Mover
                    </button>
                    <button
                        onClick={() => setMode("arrow")}
                        className={`px-3 py-1.5 rounded-lg font-bold text-sm border-2 transition-all flex items-center gap-1.5 ${
                            mode === "arrow"
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-50"
                        }`}
                        title="Desenhar seta de movimento"
                    >
                        ➡️ Seta
                    </button>
                    {arrows.length > 0 && (
                        <button
                            onClick={() => setArrows([])}
                            className="px-3 py-1.5 rounded-lg font-bold text-sm border-2 border-red-200 bg-white dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-1.5"
                            title="Apagar todas as setas"
                        >
                            🗑 Setas
                        </button>
                    )}
                    {mode === "arrow" && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold ml-1">
                            Clica e arrasta no campo para desenhar setas
                        </span>
                    )}
                </div>

                {/* Campo de andebol */}
                <div
                    ref={fieldRef}
                    className={`relative flex-1 min-h-0 rounded-2xl border-2 overflow-hidden w-full shadow-lg select-none mb-2 ${
                        mode === "arrow"
                            ? "border-amber-400 dark:border-amber-500 cursor-crosshair"
                            : "border-green-700 dark:border-green-800"
                    }`}
                    style={{ background: "#1a4731" }}
                    onMouseDown={onFieldMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={() => { setDragged(null); setDrawingArrow(null); setArrowPreview(null); }}
                    onTouchStart={onFieldTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Campo de andebol + Setas SVG */}
                    <svg viewBox="0 0 400 220" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
                            </marker>
                            <marker id="arrowhead-preview" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" opacity="0.6" />
                            </marker>
                        </defs>

                        {/* ── Fundo do campo ── */}
                        <rect x="0" y="0" width="400" height="220" fill="#1a4731" />
                        <rect x="10" y="10" width="380" height="200" fill="#2d6a4f" />

                        {/* ── Balizas (fora da linha de fundo) ── */}
                        {/* Baliza esquerda: 3m = 30u, profundidade 2m = 19u */}
                        <rect x="0" y="95" width="10" height="30" fill="none" stroke="white" strokeWidth="2.5" />
                        {/* Baliza direita */}
                        <rect x="390" y="95" width="10" height="30" fill="none" stroke="white" strokeWidth="2.5" />

                        {/* ── Limite exterior ── */}
                        <rect x="10" y="10" width="380" height="200" fill="none" stroke="white" strokeWidth="2.5" />

                        {/* ── Área de baliza — linha 6m (arco real, raio=57u) ── */}
                        {/* Esquerda: semicírculo centrado em (10,110) */}
                        <path d="M 10 53 A 57 57 0 0 1 10 167" fill="none" stroke="white" strokeWidth="2" />
                        {/* Direita: semicírculo centrado em (390,110) */}
                        <path d="M 390 53 A 57 57 0 0 0 390 167" fill="none" stroke="white" strokeWidth="2" />

                        {/* Linhas retas da zona de 6m (a partir dos postes) */}
                        <line x1="10" y1="53" x2="10" y2="53" stroke="white" strokeWidth="2" />

                        {/* ── Linha 9m (tracejada, raio=85.5u) ── */}
                        {/* Esquerda */}
                        <path d="M 10 24.5 A 85.5 85.5 0 0 1 10 195.5" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="7,5" opacity="0.85" />
                        {/* Direita */}
                        <path d="M 390 24.5 A 85.5 85.5 0 0 0 390 195.5" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="7,5" opacity="0.85" />

                        {/* ── Linha central (sólida) ── */}
                        <line x1="200" y1="10" x2="200" y2="210" stroke="white" strokeWidth="2" />

                        {/* ── Círculo central — raio 3m = 28.5u ── */}
                        <circle cx="200" cy="110" r="28.5" fill="none" stroke="white" strokeWidth="1.5" />
                        {/* Ponto central */}
                        <circle cx="200" cy="110" r="2.5" fill="white" />

                        {/* ── Marca 7m (traço curto) ── */}
                        {/* Esquerda: 7m = 66.5u de x=10 → x=76.5 */}
                        <line x1="76.5" y1="106" x2="76.5" y2="114" stroke="white" strokeWidth="2.5" />
                        {/* Direita: x=390-66.5=323.5 */}
                        <line x1="323.5" y1="106" x2="323.5" y2="114" stroke="white" strokeWidth="2.5" />

                        {/* ── Marcas de substituição (linha central, 4.5m = 42.75u de cada lado) ── */}
                        <line x1="195" y1="10" x2="205" y2="10" stroke="white" strokeWidth="2.5" />
                        <line x1="195" y1="210" x2="205" y2="210" stroke="white" strokeWidth="2.5" />

                        {arrows.map((a) => (
                            <line
                                key={a.id}
                                x1={(a.x1 / 100) * 400} y1={(a.y1 / 100) * 220}
                                x2={(a.x2 / 100) * 400} y2={(a.y2 / 100) * 220}
                                stroke="#f59e0b" strokeWidth="2.5"
                                markerEnd="url(#arrowhead)"
                            />
                        ))}

                        {/* Preview da seta a ser desenhada */}
                        {drawingArrow && arrowPreview && (
                            <line
                                x1={(drawingArrow.x1 / 100) * 400} y1={(drawingArrow.y1 / 100) * 220}
                                x2={(arrowPreview.x / 100) * 400} y2={(arrowPreview.y / 100) * 220}
                                stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8,4" opacity="0.7"
                                markerEnd="url(#arrowhead-preview)"
                            />
                        )}
                    </svg>

                    {/* Jogadores */}
                    {players.map((p, idx) => (
                        <div
                            key={`${p.id}-${p.color}`}
                            className={`absolute w-9 h-9 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-lg text-xs transition-transform active:scale-110 ${
                                p.color === "blue"
                                    ? "bg-blue-600 text-white"
                                    : "bg-red-600 text-white"
                            } ${mode === "move" ? "cursor-move" : "cursor-crosshair"}`}
                            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
                            onMouseDown={(e) => {
                                if (mode === "move") {
                                    setDragged(idx);
                                } else {
                                    e.stopPropagation();
                                    setDrawingArrow({ x1: p.x, y1: p.y });
                                    setArrowPreview({ x: p.x, y: p.y });
                                }
                            }}
                            onTouchStart={(e) => {
                                if (mode === "move") {
                                    setDragged(idx);
                                } else {
                                    e.stopPropagation();
                                    setDrawingArrow({ x1: p.x, y1: p.y });
                                    setArrowPreview({ x: p.x, y: p.y });
                                }
                            }}
                        >
                            {p.id.replace(/^A(\d+)$/, "$1")}
                        </div>
                    ))}

                    {/* Legenda no campo */}
                    <div className="absolute bottom-2 left-3 flex gap-3 text-[10px] font-semibold pointer-events-none text-white/80">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-white/30" /> Adversário</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block border border-white/30" /> Casa</span>
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
            <div className="w-full lg:w-72 flex flex-col gap-3 min-h-0">
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
                                        {j.descricao && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{j.descricao}</div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setModalEditar({ id: j.id, nomeAtual: j.nome, descricaoAtual: j.descricao ?? "" })}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                        title="Editar jogada"
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
