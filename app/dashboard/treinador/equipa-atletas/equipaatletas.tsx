"use client";
import React, { useState } from "react";

type Atleta = {
    id: number;
    nome: string;
    posicao: string;
    numero: number;
    idade: number;
    estado: string;
    altura: string;
    peso: string;
    naturalidade: string;
    epoca: string;
};

const atletasIniciais: Atleta[] = [
    { id: 1, nome: "Carlos Silva", posicao: "Guarda-Redes", numero: 1, idade: 26, estado: "Disponível", altura: "1.92m", peso: "88kg", naturalidade: "Porto", epoca: "3ª época" },
    { id: 2, nome: "Miguel Costa", posicao: "Ponta Direita", numero: 7, idade: 22, estado: "Disponível", altura: "1.78m", peso: "74kg", naturalidade: "Lisboa", epoca: "1ª época" },
    { id: 3, nome: "Rui Santos", posicao: "Central", numero: 10, idade: 28, estado: "Disponível", altura: "1.85m", peso: "82kg", naturalidade: "Braga", epoca: "5ª época" },
    { id: 4, nome: "Bruno Dias", posicao: "Pivot", numero: 14, idade: 24, estado: "Lesionado", altura: "1.88m", peso: "90kg", naturalidade: "Coimbra", epoca: "2ª época" },
    { id: 5, nome: "João Ferreira", posicao: "Ala Esquerdo", numero: 11, idade: 21, estado: "Disponível", altura: "1.80m", peso: "77kg", naturalidade: "Faro", epoca: "1ª época" },
    { id: 6, nome: "André Matos", posicao: "Ponta Esquerda", numero: 9, idade: 25, estado: "Suspenso", altura: "1.76m", peso: "72kg", naturalidade: "Setúbal", epoca: "4ª época" },
    { id: 7, nome: "Tiago Sousa", posicao: "Central", numero: 5, idade: 27, estado: "Disponível", altura: "1.87m", peso: "85kg", naturalidade: "Aveiro", epoca: "3ª época" },
    { id: 8, nome: "Luís Neves", posicao: "Defesa", numero: 3, idade: 23, estado: "Disponível", altura: "1.83m", peso: "80kg", naturalidade: "Porto", epoca: "2ª época" },
    { id: 9, nome: "Pedro Gomes", posicao: "Guarda-Redes", numero: 16, idade: 20, estado: "Disponível", altura: "1.90m", peso: "86kg", naturalidade: "Viseu", epoca: "1ª época" },
    { id: 10, nome: "Diogo Alves", posicao: "Ala Direito", numero: 6, idade: 29, estado: "Disponível", altura: "1.79m", peso: "76kg", naturalidade: "Lisboa", epoca: "6ª época" },
    { id: 11, nome: "Fábio Cunha", posicao: "Pivot", numero: 13, idade: 22, estado: "Disponível", altura: "1.86m", peso: "89kg", naturalidade: "Guimarães", epoca: "1ª época" },
    { id: 12, nome: "Sérgio Lima", posicao: "Central", numero: 8, idade: 26, estado: "Lesionado", altura: "1.84m", peso: "83kg", naturalidade: "Barcelos", epoca: "4ª época" },
];

const posicoesList = ["Guarda-Redes", "Central", "Ala Esquerdo", "Ala Direito", "Ponta Esquerda", "Ponta Direita", "Pivot", "Defesa"];
const posicoesFiltro = ["Todas", ...posicoesList];
const estadosList = ["Disponível", "Lesionado", "Suspenso"];

const estadoCor: Record<string, string> = {
    "Disponível": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "Lesionado":  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "Suspenso":   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition";

type ModalTipo = "ver" | "editar" | "criar";

const atletaVazio: Omit<Atleta, "id"> = {
    nome: "", posicao: "Guarda-Redes", numero: 0, idade: 0,
    estado: "Disponível", altura: "", peso: "", naturalidade: "", epoca: "",
};

export default function EquipaAtletas() {
    const [atletas, setAtletas] = useState<Atleta[]>(atletasIniciais);
    const [search, setSearch] = useState("");
    const [posicaoFiltro, setPosicaoFiltro] = useState("Todas");
    const [modalTipo, setModalTipo] = useState<ModalTipo | null>(null);
    const [atletaModal, setAtletaModal] = useState<Atleta | null>(null);
    const [form, setForm] = useState<Omit<Atleta, "id">>(atletaVazio);
    const [nextId, setNextId] = useState(atletasIniciais.length + 1);

    const filtrados = atletas.filter((a) => {
        const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase());
        const matchPosicao = posicaoFiltro === "Todas" || a.posicao === posicaoFiltro;
        return matchSearch && matchPosicao;
    });

    function abrirVer(atleta: Atleta) {
        setAtletaModal(atleta);
        setModalTipo("ver");
    }
    function abrirEditar(atleta: Atleta) {
        setAtletaModal(atleta);
        setForm({ ...atleta });
        setModalTipo("editar");
    }
    function abrirCriar() {
        setAtletaModal(null);
        setForm({ ...atletaVazio });
        setModalTipo("criar");
    }
    function fecharModal() {
        setModalTipo(null);
        setAtletaModal(null);
    }
    function guardarEdicao() {
        if (!atletaModal) return;
        setAtletas((prev) => prev.map((a) => a.id === atletaModal.id ? { ...form, id: atletaModal.id } : a));
        fecharModal();
    }
    function guardarNovo() {
        if (!form.nome.trim()) return;
        setAtletas((prev) => [...prev, { ...form, id: nextId }]);
        setNextId((n) => n + 1);
        fecharModal();
    }
    function removerAtleta(id: number) {
        if (!confirm("Remover atleta?")) return;
        setAtletas((prev) => prev.filter((a) => a.id !== id));
        fecharModal();
    }

    const disponiveis = atletas.filter((a) => a.estado === "Disponível").length;
    const lesionados  = atletas.filter((a) => a.estado === "Lesionado").length;
    const suspensos   = atletas.filter((a) => a.estado === "Suspenso").length;

    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">

            {/* ── MODAL ── */}
            {modalTipo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

                        {/* Header do modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                {modalTipo === "criar" && (
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">＋</span>
                                    </div>
                                )}
                                {(modalTipo === "ver" || modalTipo === "editar") && atletaModal && (
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-extrabold text-base">
                                        {atletaModal.nome.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                        {modalTipo === "criar" ? "Novo Atleta" : modalTipo === "editar" ? "Editar Atleta" : atletaModal?.nome}
                                    </h3>
                                    {(modalTipo === "ver" || modalTipo === "editar") && atletaModal && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500">#{atletaModal.numero} · {atletaModal.posicao}</p>
                                    )}
                                </div>
                            </div>
                            <button onClick={fecharModal} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {/* Corpo */}
                        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
                            {modalTipo === "ver" && atletaModal && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoCor[atletaModal.estado]}`}>{atletaModal.estado}</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">{atletaModal.epoca}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Nº Camisola", value: `#${atletaModal.numero}` },
                                            { label: "Posição", value: atletaModal.posicao },
                                            { label: "Idade", value: `${atletaModal.idade} anos` },
                                            { label: "Naturalidade", value: atletaModal.naturalidade },
                                            { label: "Altura", value: atletaModal.altura },
                                            { label: "Peso", value: atletaModal.peso },
                                        ].map((item) => (
                                            <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(modalTipo === "editar" || modalTipo === "criar") && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Nome completo</label>
                                            <input className={inputClass} placeholder="Nome do atleta" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Posição</label>
                                            <select className={inputClass} value={form.posicao} onChange={(e) => setForm((f) => ({ ...f, posicao: e.target.value }))}>
                                                {posicoesList.map((p) => <option key={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Nº Camisola</label>
                                            <input className={inputClass} type="number" min={1} placeholder="Ex: 10" value={form.numero || ""} onChange={(e) => setForm((f) => ({ ...f, numero: Number(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Idade</label>
                                            <input className={inputClass} type="number" min={14} placeholder="Ex: 22" value={form.idade || ""} onChange={(e) => setForm((f) => ({ ...f, idade: Number(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Estado</label>
                                            <select className={inputClass} value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
                                                {estadosList.map((e) => <option key={e}>{e}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Altura</label>
                                            <input className={inputClass} placeholder="Ex: 1.85m" value={form.altura} onChange={(e) => setForm((f) => ({ ...f, altura: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Peso</label>
                                            <input className={inputClass} placeholder="Ex: 80kg" value={form.peso} onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Naturalidade</label>
                                            <input className={inputClass} placeholder="Ex: Porto" value={form.naturalidade} onChange={(e) => setForm((f) => ({ ...f, naturalidade: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Época no clube</label>
                                            <input className={inputClass} placeholder="Ex: 2ª época" value={form.epoca} onChange={(e) => setForm((f) => ({ ...f, epoca: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer do modal */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                            {modalTipo === "ver" && atletaModal && (
                                <>
                                    <button
                                        onClick={() => removerAtleta(atletaModal.id)}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-all"
                                    >
                                        Remover
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={fecharModal} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                                            Fechar
                                        </button>
                                        <button onClick={() => abrirEditar(atletaModal)} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow transition-all flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.914l-3 1 1-3a4 4 0 01.914-1.414z"/></svg>
                                            Editar
                                        </button>
                                    </div>
                                </>
                            )}
                            {modalTipo === "editar" && atletaModal && (
                                <>
                                    <button onClick={() => abrirVer(atletaModal)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                                        Cancelar
                                    </button>
                                    <button onClick={guardarEdicao} disabled={!form.nome.trim()} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-all">
                                        Guardar alterações
                                    </button>
                                </>
                            )}
                            {modalTipo === "criar" && (
                                <>
                                    <button onClick={fecharModal} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                                        Cancelar
                                    </button>
                                    <button onClick={guardarNovo} disabled={!form.nome.trim()} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-all flex items-center gap-1.5">
                                        <span>＋</span> Adicionar Atleta
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3">
                        <span>👥</span> Equipa de Atletas
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Seniores Masculinos · {atletas.length} atletas inscritos
                    </p>
                </div>
                <button
                    onClick={abrirCriar}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    Adicionar Atleta
                </button>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total", value: atletas.length, color: "text-blue-600", border: "border-blue-200 dark:border-blue-700" },
                    { label: "Disponíveis", value: disponiveis, color: "text-green-600", border: "border-green-200 dark:border-green-700" },
                    { label: "Lesionados", value: lesionados, color: "text-red-600", border: "border-red-200 dark:border-red-700" },
                    { label: "Suspensos", value: suspensos, color: "text-yellow-600", border: "border-yellow-200 dark:border-yellow-700" },
                ].map((s) => (
                    <div key={s.label} className={`bg-white dark:bg-gray-800 rounded-xl p-4 border ${s.border} shadow-sm flex flex-col`}>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</span>
                        <span className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Pesquisa e filtros */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Pesquisar atleta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[180px] px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex flex-wrap gap-1.5">
                    {posicoesFiltro.map((p) => (
                        <button
                            key={p}
                            onClick={() => setPosicaoFiltro(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                posicaoFiltro === p
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            }`}
                        >{p}</button>
                    ))}
                </div>
            </div>

            {/* Grelha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtrados.map((atleta) => (
                    <div
                        key={atleta.id}
                        onClick={() => abrirVer(atleta)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xl font-extrabold flex-shrink-0 group-hover:scale-105 transition-transform">
                                {atleta.nome.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{atleta.nome}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{atleta.posicao}</div>
                            </div>
                            <span className="ml-auto text-lg font-extrabold text-gray-200 dark:text-gray-700">#{atleta.numero}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${estadoCor[atleta.estado]}`}>{atleta.estado}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{atleta.epoca}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2">
                            <span>{atleta.idade} anos</span><span>·</span>
                            <span>{atleta.altura}</span><span>·</span>
                            <span>{atleta.peso}</span>
                        </div>
                    </div>
                ))}
                {filtrados.length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-400 dark:text-gray-600 text-sm">
                        Nenhum atleta encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
