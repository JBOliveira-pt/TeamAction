import { fetchStaff, fetchEquipas } from "@/app/lib/data";
import AdicionarMembroModal from "./_components/AdicionarMembroModal.client";
import EditarMembroModal from "./_components/EditarMembroModal.client";
import RemoverMembroModal from "./_components/RemoverMembroModal.client";

export const dynamic = 'force-dynamic';

const funcaoStyle: Record<string, string> = {
    "treinador":         "bg-violet-500/10 text-violet-400",
    "treinador_adjunto": "bg-blue-500/10 text-blue-400",
    "fisioterapeuta":    "bg-cyan-500/10 text-cyan-400",
    "medico":            "bg-emerald-500/10 text-emerald-400",
    "preparador_fisico": "bg-amber-500/10 text-amber-400",
};

const funcaoLabel: Record<string, string> = {
    "treinador":         "Treinador Principal",
    "treinador_adjunto": "Treinador Adjunto",
    "fisioterapeuta":    "Fisioterapeuta",
    "medico":            "Equipa Médica",
    "preparador_fisico": "Preparador Físico",
};

export default async function StaffPage() {
    const [staff, equipas] = await Promise.all([
        fetchStaff(),
        fetchEquipas(),
    ]);

    const treinadores = staff.filter(s => s.funcao === "treinador" || s.funcao === "treinador_adjunto").length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{staff.length} membros na equipa técnica</p>
                </div>
                <AdicionarMembroModal equipas={equipas.map(e => ({ id: e.id, nome: e.nome }))} />
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Staff</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{staff.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-violet-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Treinadores</p>
                    <p className="text-3xl font-bold text-violet-400 mt-2">{treinadores}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Equipas Cobertas</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">
                        {new Set(staff.filter(s => s.equipa_id).map(s => s.equipa_id)).size}
                    </p>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {staff.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
                        Nenhum membro de staff registado ainda.
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">Nome</th>
                                <th className="text-left px-6 py-4">Função</th>
                                <th className="text-left px-6 py-4">Equipa</th>
                                <th className="text-left px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s) => (
                                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{s.nome}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${funcaoStyle[s.funcao] ?? "bg-slate-500/10 text-slate-400"}`}>
                                            {funcaoLabel[s.funcao] ?? s.funcao}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{s.equipa_nome ?? "Todos"}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <EditarMembroModal
                                                membro={{
                                                    id:        s.id,
                                                    nome:      s.nome,
                                                    funcao:    s.funcao,
                                                    equipa_id: s.equipa_id,
                                                }}
                                                equipas={equipas.map(e => ({ id: e.id, nome: e.nome }))}
                                            />
                                            <RemoverMembroModal id={s.id} nome={s.nome} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}



