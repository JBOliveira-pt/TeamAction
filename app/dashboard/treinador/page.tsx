const sidebarNav = [
    {
        section: "Principal",
        items: [
            { icon: "🏠", label: "Dashboard", active: true },
            { icon: "📅", label: "Calendário" },
        ],
    },
    {
        section: "Treino",
        items: [
            { icon: "📝", label: "Sessões" },
            { icon: "🎯", label: "Exercícios" },
            { icon: "✅", label: "Assiduidade" },
        ],
    },
    {
        section: "Tático",
        items: [
            { icon: "🗺️", label: "Quadro Tático" },
            { icon: "📚", label: "Biblioteca" },
        ],
    },
    {
        section: "Jogo",
        items: [
            { icon: "🏅", label: "Jogos" },
            { icon: "🔴", label: "Live Stats" },
        ],
    },
    {
        section: "Atletas",
        items: [
            { icon: "💪", label: "Condição Física" },
            { icon: "🥗", label: "Nutrição" },
        ],
    },
];

export default function TreinadorDashboard() {
    return (
        <main className="main">
            <div className="page-header">
                <div>
                    <div className="page-title">Painel do Treinador</div>
                    <div className="page-subtitle">
                        Seniores Masculinos · 18 atletas
                    </div>
                </div>
                <button className="btn btn-primary">＋ Nova Sessão</button>
            </div>
            <div className="section">
                <div className="grid grid-4">
                    <div className="card card-accent">
                        <div className="card-title">Próximo Treino</div>
                        <div
                            className="card-value"
                            style={{ color: "var(--accent)", fontSize: "16px" }}
                        >
                            {/* ...existing code... */}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
