export default function DefinicoesPage() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Definições</h1>
                <p className="text-sm text-slate-400 mt-1">Informações e configurações do clube</p>
            </div>

            {/* Dados do clube */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <h2 className="text-sm font-semibold text-white">🏛️ Dados do Clube</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { label: "Nome do Clube", placeholder: "Ex: Sporting CP Andebol", defaultValue: "Sporting CP Andebol" },
                        { label: "Modalidade", placeholder: "Ex: Andebol", defaultValue: "Andebol" },
                        { label: "Distrito", placeholder: "Ex: Lisboa", defaultValue: "Lisboa" },
                        { label: "Associação", placeholder: "Ex: Federação de Andebol de Portugal", defaultValue: "Federação de Andebol de Portugal" },
                        { label: "Email do Clube", placeholder: "clube@exemplo.pt", defaultValue: "andebol@sporting.pt" },
                        { label: "Telefone", placeholder: "+351 210 000 000", defaultValue: "+351 210 000 000" },
                    ].map((field) => (
                        <div key={field.label} className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">{field.label}</label>
                            <input
                                type="text"
                                defaultValue={field.defaultValue}
                                placeholder={field.placeholder}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                    ))}
                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Morada</label>
                        <input
                            type="text"
                            defaultValue="Rua Professor Fernando da Fonseca, Lisboa"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        Guardar Alterações
                    </button>
                </div>
            </div>

            {/* Época */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-white">📅 Época Atual</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Época", defaultValue: "2024/2025" },
                        { label: "Início", defaultValue: "01/09/2024" },
                        { label: "Fim", defaultValue: "30/06/2025" },
                    ].map((field) => (
                        <div key={field.label} className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">{field.label}</label>
                            <input
                                type="text"
                                defaultValue={field.defaultValue}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        Guardar Alterações
                    </button>
                </div>
            </div>

            {/* Mensalidades */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-white">💶 Valores de Mensalidades</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Seniores", defaultValue: "25" },
                        { label: "Sub-18 / Sub-16", defaultValue: "20" },
                        { label: "Sub-14 / Sub-12", defaultValue: "15" },
                    ].map((field) => (
                        <div key={field.label} className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">{field.label}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                                <input
                                    type="number"
                                    defaultValue={field.defaultValue}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        Guardar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}
