import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const atletas = [
    { id: 1, nome: "João Silva", posicao: "Pivot", numero: 9, equipa: "Seniores M", estado: "Ativo", assiduidade: 93, mensalidade: "Pago", idade: 24, email: "joao.silva@clube.pt", telemovel: "912 345 678", peso: 78, altura: 182, nif: "123 456 789", morada: "Rua das Flores, 12, Porto" },
    { id: 2, nome: "Miguel Santos", posicao: "Lateral Direito", numero: 7, equipa: "Seniores M", estado: "Ativo", assiduidade: 88, mensalidade: "Pago", idade: 22, email: "miguel.santos@clube.pt", telemovel: "913 456 789", peso: 74, altura: 178, nif: "234 567 890", morada: "Av. da República, 45, Gaia" },
    { id: 3, nome: "Rui Ferreira", posicao: "Guarda-Redes", numero: 1, equipa: "Seniores M", estado: "Ativo", assiduidade: 100, mensalidade: "Em Atraso", idade: 26, email: "rui.ferreira@clube.pt", telemovel: "914 567 890", peso: 82, altura: 186, nif: "345 678 901", morada: "Rua do Comércio, 8, Porto" },
    { id: 4, nome: "André Costa", posicao: "Extremo Esquerdo", numero: 11, equipa: "Seniores M", estado: "Suspenso", assiduidade: 60, mensalidade: "Em Atraso", idade: 21, email: "andre.costa@clube.pt", telemovel: "915 678 901", peso: 70, altura: 174, nif: "456 789 012", morada: "Rua Nova, 3, Matosinhos" },
    { id: 5, nome: "Pedro Oliveira", posicao: "Central", numero: 5, equipa: "Sub-18 M", estado: "Ativo", assiduidade: 95, mensalidade: "Pago", idade: 17, email: "pedro.oliveira@clube.pt", telemovel: "916 789 012", peso: 68, altura: 176, nif: "567 890 123", morada: "Rua da Paz, 22, Porto" },
    { id: 6, nome: "Tiago Martins", posicao: "Lateral Esquerdo", numero: 6, equipa: "Sub-18 M", estado: "Ativo", assiduidade: 78, mensalidade: "Pendente", idade: 17, email: "tiago.martins@clube.pt", telemovel: "917 890 123", peso: 65, altura: 172, nif: "678 901 234", morada: "Rua Central, 5, Gaia" },
    { id: 7, nome: "Sofia Rodrigues", posicao: "Pivot", numero: 14, equipa: "Sub-16 F", estado: "Ativo", assiduidade: 91, mensalidade: "Pago", idade: 15, email: "sofia.rodrigues@clube.pt", telemovel: "918 901 234", peso: 55, altura: 165, nif: "789 012 345", morada: "Av. do Mar, 10, Porto" },
    { id: 8, nome: "Beatriz Lima", posicao: "Extremo Direito", numero: 10, equipa: "Sub-16 F", estado: "Ativo", assiduidade: 85, mensalidade: "Pago", idade: 15, email: "beatriz.lima@clube.pt", telemovel: "919 012 345", peso: 52, altura: 162, nif: "890 123 456", morada: "Rua das Oliveiras, 7, Gaia" },
];

const estatisticasMock = [
    { label: "Jogos", valor: 18 },
    { label: "Golos", valor: 7 },
    { label: "Assistências", valor: 4 },
    { label: "Cartões Amarelos", valor: 2 },
    { label: "Cartões Vermelhos", valor: 0 },
    { label: "Minutos Jogados", valor: 1420 },
];

const estadoStyle: Record<string, string> = {
    "Ativo": "bg-emerald-500/10 text-emerald-400",
    "Suspenso": "bg-red-500/10 text-red-400",
    "Inativo": "bg-slate-500/10 text-slate-400",
};

const mensalidadeStyle: Record<string, { badge: string }> = {
    "Pago": { badge: "bg-emerald-500/10 text-emerald-400" },
    "Em Atraso": { badge: "bg-red-500/10 text-red-400" },
    "Pendente": { badge: "bg-amber-500/10 text-amber-400" },
};

export default async function AtletaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const atleta = atletas.find((a) => a.id === Number(id));

    if (!atleta) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-slate-400 text-lg">Atleta não encontrado.</p>
                <Link
                    href="/dashboard/presidente/atletas"
                    className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                    ← Voltar aos Atletas
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">

            {/* Voltar + Cabeçalho */}
            <div>
                <Link
                    href="/dashboard/presidente/atletas"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Voltar aos Atletas
                </Link>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Avatar com número */}
                        <div className="relative w-16 h-16 rounded-full bg-violet-600/20 border-2 border-violet-500/30 flex items-center justify-center">
                            <span className="text-2xl font-bold text-violet-400">#{atleta.numero}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{atleta.nome}</h1>
                            <p className="text-sm text-slate-400 mt-1">{atleta.posicao} · {atleta.equipa}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${estadoStyle[atleta.estado]}`}>
                            {atleta.estado}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mensalidadeStyle[atleta.mensalidade].badge}`}>
                            {atleta.mensalidade}
                        </span>
                    </div>
                </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {estatisticasMock.map((stat) => (
                    <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{stat.label}</p>
                        <p className="text-2xl font-bold text-cyan-400 mt-2">{stat.valor}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna esquerda */}
                <div className="space-y-4">

                    {/* Dados pessoais */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-white">Dados Pessoais</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Idade</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.idade} anos</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">NIF</p>
                                <p className="text-sm font-medium text-white mt-0.5 font-mono">{atleta.nif}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Morada</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.morada}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-white">Contacto</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Telemóvel</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.telemovel}</p>
                            </div>
                        </div>
                    </div>

                    {/* Físico */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-white">Dados Físicos</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-slate-500">Peso</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.peso} kg</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Altura</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.altura} cm</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna direita */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Assiduidade */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Assiduidade</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-400 rounded-full transition-all"
                                    style={{ width: `${atleta.assiduidade}%` }}
                                />
                            </div>
                            <span className="text-lg font-bold text-cyan-400 w-14 text-right">{atleta.assiduidade}%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {atleta.assiduidade >= 90 ? "✅ Excelente assiduidade" : atleta.assiduidade >= 75 ? "⚠️ Assiduidade razoável" : "🔴 Assiduidade baixa"}
                        </p>
                    </div>

                    {/* Desporto */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Informações Desportivas</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Equipa</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.equipa}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Posição</p>
                                <p className="text-sm font-medium text-white mt-0.5">{atleta.posicao}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Número</p>
                                <p className="text-sm font-medium text-white mt-0.5">#{atleta.numero}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Estado</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-0.5 ${estadoStyle[atleta.estado]}`}>
                                    {atleta.estado}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mensalidade */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Mensalidade</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">Estado atual</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold mt-1 ${mensalidadeStyle[atleta.mensalidade].badge}`}>
                                    {atleta.mensalidade}
                                </span>
                            </div>
                            <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors">
                                Registar Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
