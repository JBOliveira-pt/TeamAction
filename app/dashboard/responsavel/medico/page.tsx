import { fetchRegistosMedicosResponsavel } from "@/app/lib/data";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResponsavelMedicoPage() {
    const registos = await fetchRegistosMedicosResponsavel();

    const ativos = registos.filter((r) => r.estado === "ativo");
    const resolvidos = registos.filter((r) => r.estado !== "ativo");

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Médico
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Lesões, doenças e histórico médico do educando.
                    </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full font-medium">
                    Só leitura
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Status médico</span>
                    <span className={`text-2xl font-bold ${ativos.length === 0 ? "text-emerald-500" : "text-amber-500"}`}>
                        {ativos.length === 0 ? "Disponível" : "Em tratamento"}
                    </span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Lesões ativas</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{ativos.length}</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Histórico</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{resolvidos.length}</span>
                    <span className="text-xs text-gray-400">resolvido{resolvidos.length !== 1 ? "s" : ""}</span>
                </div>
            </div>

            <div className="space-y-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Registos ({registos.length})
                </span>
                {registos.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                            <ShieldCheck size={28} className="text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-base">
                                Nenhuma lesão ou doença registada
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                O educando está sem registos médicos e disponível para todas as atividades.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {registos.map((r) => (
                            <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.tipo} — {r.descricao}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Início: {new Date(r.data_inicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                                        {r.data_prevista_retorno && ` · Retorno previsto: ${new Date(r.data_prevista_retorno).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}`}
                                    </p>
                                    {r.observacoes && <p className="text-xs text-gray-400 mt-1">{r.observacoes}</p>}
                                </div>
                                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${r.estado === "ativo" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                                    {r.estado === "ativo" ? "Ativo" : "Resolvido"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
