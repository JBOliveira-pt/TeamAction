import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const equipas = [
    {
        id: 1,
        nome: "Seniores M",
        escalao: "Seniores",
        atletas: 18,
        treinador: "Carlos Ferreira",
        treinos: "4x/sem",
        estado: "Ativa",
        horario: "Seg, Qua, Sex, Sáb — 19h00",
        campo: "Campo Principal",
        vitorias: 8,
        derrotas: 3,
        empates: 2,
        golosMarcados: 24,
        golosSofridos: 14,
    },
    {
        id: 2,
        nome: "Sub-18 M",
        escalao: "Sub-18",
        atletas: 16,
        treinador: "Pedro Sousa",
        treinos: "3x/sem",
        estado: "Ativa",
        horario: "Ter, Qui, Sáb — 18h00",
        campo: "Campo 2",
        vitorias: 6,
        derrotas: 4,
        empates: 1,
        golosMarcados: 18,
        golosSofridos: 12,
    },
    {
        id: 3,
        nome: "Sub-16 F",
        escalao: "Sub-16",
        atletas: 14,
        treinador: "Ana Martins",
        treinos: "2x/sem",
        estado: "Ativa",
        horario: "Qua, Sáb — 17h00",
        campo: "Campo 2",
        vitorias: 5,
        derrotas: 2,
        empates: 3,
        golosMarcados: 15,
        golosSofridos: 9,
    },
    {
        id: 4,
        nome: "Sub-14 M",
        escalao: "Sub-14",
        atletas: 12,
        treinador: "João Silva",
        treinos: "2x/sem",
        estado: "Período Off",
        horario: "Ter, Sex — 17h30",
        campo: "Campo 3",
        vitorias: 4,
        derrotas: 5,
        empates: 2,
        golosMarcados: 12,
        golosSofridos: 16,
    },
    {
        id: 5,
        nome: "Sub-12 M",
        escalao: "Sub-12",
        atletas: 10,
        treinador: "Rui Costa",
        treinos: "2x/sem",
        estado: "Inativa",
        horario: "Sáb — 10h00",
        campo: "Campo 3",
        vitorias: 2,
        derrotas: 6,
        empates: 1,
        golosMarcados: 8,
        golosSofridos: 20,
    },
];

const atletasMock = [
    { id: 1, nome: "Miguel Santos", posicao: "Guarda-redes", idade: 22, estado: "Ativo" },
    { id: 2, nome: "André Lima", posicao: "Defesa Central", idade: 24, estado: "Ativo" },
    { id: 3, nome: "Tiago Ferreira", posicao: "Defesa Central", idade: 21, estado: "Ativo" },
    { id: 4, nome: "Bruno Alves", posicao: "Lateral Direito", idade: 23, estado: "Ativo" },
    { id: 5, nome: "Diogo Costa", posicao: "Lateral Esquerdo", idade: 20, estado: "Lesionado" },
    { id: 6, nome: "Ricardo Pinto", posicao: "Médio Defensivo", idade: 25, estado: "Ativo" },
    { id: 7, nome: "Hugo Mendes", posicao: "Médio Central", idade: 22, estado: "Ativo" },
    { id: 8, nome: "Fábio Rocha", posicao: "Médio Ofensivo", idade: 23, estado: "Ativo" },
];

const jogosMock = [
    { id: 1, adversario: "FC Vizela", data: "2025-03-15", hora: "15h00", local: "Casa", resultado: null },
    { id: 2, adversario: "SC Braga B", data: "2025-03-22", hora: "16h00", local: "Fora", resultado: null },
    { id: 3, adversario: "FC Porto B", data: "2025-03-08", hora: "15h00", local: "Casa", resultado: "2-1" },
    { id: 4, adversario: "Boavista FC", data: "2025-03-01", hora: "16h00", local: "Fora", resultado: "0-0" },
];

const estadoStyle: Record<string, string> = {
    "Ativa": "bg-emerald-500/10 text-emerald-400",
    "Período Off": "bg-amber-500/10 text-amber-400",
    "Inativa": "bg-red-500/10 text-red-400",
};

const atletaEstadoStyle: Record<string, string> = {
    "Ativo": "bg-emerald-500/10 text-emerald-400",
    "Lesionado": "bg-red-500/10 text-red-400",
    "Suspenso": "bg-amber-500/10 text-amber-400",
};

export default async function EquipaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const equipa = equipas.find((e) => e.id === Number(id));

    if (!equipa) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-slate-400 text-lg">Equipa não encontrada.</p>
                <Link
                    href="/dashboard/presidente/equipas"
                    className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                    ← Voltar às Equipas
                </Link>
            </div>
        );
    }

    const totalJogos = equipa.vitorias + equipa.derrotas + equipa.empates;
    const pontosPerc = totalJogos > 0 ? Math.round((equipa.vitorias / totalJogos) * 100) : 0;

    return (
        <div className="p-6 space-y-6">

            {/* Voltar + Cabeçalho */}
            <div>
                <Link
                    href="/dashboard/presidente/equipas"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Voltar às Equipas
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{equipa.nome}</h1>
                        <p className="text-sm text-slate-400 mt-1">{equipa.escalao} · {equipa.campo}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${estadoStyle[equipa.estado]}`}>
                        {equipa.estado}
                    </span>
                </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vitórias</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{equipa.vitorias}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empates</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{equipa.empates}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Derrotas</p>
                    <p className="text-3xl font-bold text-red-400 mt-2">{equipa.derrotas}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">% Vitórias</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{pontosPerc}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna esquerda — Info + Jogos */}
                <div className="space-y-4">

                    {/* Info da equipa */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-white">Informações</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Treinador</p>
                                <p className="text-sm font-medium text-white mt-0.5">{equipa.treinador}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Treinos</p>
                                <p className="text-sm font-medium text-white mt-0.5">{equipa.treinos}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Horário</p>
                                <p className="text-sm font-medium text-white mt-0.5">{equipa.horario}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Campo</p>
                                <p className="text-sm font-medium text-white mt-0.5">{equipa.campo}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Golos Marcados / Sofridos</p>
                                <p className="text-sm font-medium text-white mt-0.5">
                                    {equipa.golosMarcados} <span className="text-slate-500">/</span> {equipa.golosSofridos}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Próximos jogos */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-white">Jogos</h2>
                        {jogosMock.map((jogo) => (
                            <div key={jogo.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-white">{jogo.adversario}</p>
                                    <p className="text-xs text-slate-500">{jogo.data} · {jogo.hora} · {jogo.local}</p>
                                </div>
                                {jogo.resultado ? (
                                    <span className="text-sm font-bold text-cyan-400">{jogo.resultado}</span>
                                ) : (
                                    <span className="text-xs text-slate-500 italic">A jogar</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coluna direita — Atletas */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <h2 className="text-sm font-semibold text-white">Atletas ({equipa.atletas})</h2>
                            <button className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                + Adicionar Atleta
                            </button>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                                    <th className="text-left px-6 py-3">Nome</th>
                                    <th className="text-left px-6 py-3">Posição</th>
                                    <th className="text-left px-6 py-3">Idade</th>
                                    <th className="text-left px-6 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {atletasMock.map((atleta) => (
                                    <tr key={atleta.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3 font-medium text-white">{atleta.nome}</td>
                                        <td className="px-6 py-3 text-slate-400">{atleta.posicao}</td>
                                        <td className="px-6 py-3 text-slate-400">{atleta.idade}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${atletaEstadoStyle[atleta.estado]}`}>
                                                {atleta.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
