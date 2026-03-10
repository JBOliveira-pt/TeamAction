const notificacoes = [
    { id: 1, titulo: "Mensalidade em atraso", descricao: "Rui Ferreira (Seniores M) tem mensalidade de Março em atraso.", tipo: "Alerta", data: "Hoje", lida: false },
    { id: 2, titulo: "Mensalidade em atraso", descricao: "André Costa (Seniores M) tem mensalidade de Março em atraso.", tipo: "Alerta", data: "Hoje", lida: false },
    { id: 3, titulo: "Novo atleta registado", descricao: "Tiago Martins criou o seu perfil de atleta no Sub-18 M.", tipo: "Info", data: "Ontem", lida: false },
    { id: 4, titulo: "Jogo agendado", descricao: "Jogo vs Sporting CP marcado para 15 Mar às 16h00.", tipo: "Info", data: "09 Mar", lida: true },
    { id: 5, titulo: "Treino cancelado", descricao: "O treinador Carlos Ferreira cancelou o treino de 8 Mar.", tipo: "Aviso", data: "08 Mar", lida: true },
];

const tipoStyle: Record<string, { badge: string; icon: string }> = {
    "Alerta": { badge: "bg-red-500/10 text-red-400", icon: "🔴" },
    "Aviso": { badge: "bg-amber-500/10 text-amber-400", icon: "🟡" },
    "Info": { badge: "bg-cyan-500/10 text-cyan-400", icon: "🔵" },
};

export default function NotificacoesPage() {
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Notificações</h1>
                    <p className="text-sm text-slate-400 mt-1">{naoLidas} não lidas</p>
                </div>
                <button className="text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-2 rounded-lg transition-colors">
                    Marcar todas como lidas
                </button>
            </div>

            <div className="space-y-3">
                {notificacoes.map((n) => (
                    <div
                        key={n.id}
                        className={`bg-slate-900 border rounded-xl p-5 flex items-start gap-4 transition-colors ${
                            n.lida ? "border-slate-800 opacity-60" : "border-slate-700"
                        }`}
                    >
                        <span className="text-lg mt-0.5">{tipoStyle[n.tipo].icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-white">{n.titulo}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoStyle[n.tipo].badge}`}>
                                    {n.tipo}
                                </span>
                                {!n.lida && (
                                    <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                                )}
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{n.descricao}</p>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{n.data}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
