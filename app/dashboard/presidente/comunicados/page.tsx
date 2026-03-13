import { fetchComunicados } from "@/app/lib/data";
import ComunicadoForm from "./_components/ComunicadoForm";

export const dynamic = 'force-dynamic';

const destinatariosStyle: Record<string, string> = {
    "todos":        "bg-violet-500/10 text-violet-400",
    "atletas":      "bg-cyan-500/10 text-cyan-400",
    "treinadores":  "bg-emerald-500/10 text-emerald-400",
    "staff":        "bg-amber-500/10 text-amber-400",
    "pais":         "bg-blue-500/10 text-blue-400",
};

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit", month: "short", year: "numeric",
    });

export default async function ComunicadosPage() {
    const comunicados = await fetchComunicados();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comunicados</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {comunicados.length} comunicado{comunicados.length !== 1 ? "s" : ""} enviado{comunicados.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Formulário */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Novo Comunicado</h2>
                <ComunicadoForm />
            </div>

            {/* Lista */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {comunicados.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum comunicado enviado ainda.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">Título</th>
                                <th className="text-left px-6 py-4">Destinatários</th>
                                <th className="text-left px-6 py-4">Conteúdo</th>
                                <th className="text-left px-6 py-4">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comunicados.map((c) => (
                                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                        {c.titulo}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${destinatariosStyle[c.destinatarios] ?? "bg-gray-500/10 text-gray-400"}`}>
                                            {c.destinatarios}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {c.conteudo}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {formatData(c.created_at)}
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

