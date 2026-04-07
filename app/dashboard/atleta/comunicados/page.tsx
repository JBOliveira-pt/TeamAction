import { fetchComunicados } from "@/app/lib/data";
import { Bell } from "lucide-react";
import { getOrganizationId } from "@/app/lib/data/_shared";

export const dynamic = "force-dynamic";

export default async function AtletaComunicadosPage() {
    let semClube = false;
    let comunicados: {
        id: string;
        titulo: string;
        conteudo: string;
        destinatarios: string;
        criado_por: string;
        created_at: string;
    }[] = [];

    try {
        await getOrganizationId();
        const todos = await fetchComunicados();
        comunicados = todos.filter(
            (c) => c.destinatarios === "todos" || c.destinatarios === "atletas",
        );
    } catch {
        semClube = true;
    }

    if (semClube) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Comunicados
                    </h1>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 flex flex-col items-center gap-4 text-center">
                    <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <Bell size={28} className="text-yellow-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                            Sem clube associado
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ainda não estás associado a nenhum clube. Quando
                            fizeres parte de um clube, os comunicados aparecerão
                            aqui.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Comunicados
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Avisos e notícias do clube.
                </p>
            </div>

            <div className="space-y-3">
                {comunicados.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 flex flex-col items-center gap-4 text-center">
                        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                            <Bell size={28} className="text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Nenhum comunicado
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Os comunicados do clube aparecerão aqui.
                            </p>
                        </div>
                    </div>
                ) : (
                    comunicados.map((c) => (
                        <div
                            key={c.id}
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-2"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {c.titulo}
                                </span>
                                {c.destinatarios && (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {c.destinatarios}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {c.conteudo}
                            </p>
                            <span className="text-xs text-gray-400 mt-1">
                                {new Date(c.created_at).toLocaleDateString(
                                    "pt-PT",
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    },
                                )}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
