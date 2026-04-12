// Página de documentos do presidente.
import { fetchDocumentos } from "@/app/lib/data";
import DocumentoUpload from "./_components/DocumentoUpload.client";

export const dynamic = "force-dynamic";

const tipoIcon: Record<string, string> = {
    PDF: "📄",
    XLSX: "📊",
    DOCX: "📝",
};

const formatData = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

export default async function DocumentosPage() {
    const documentos = await fetchDocumentos();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Documentos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {documentos.length} documento
                    {documentos.length !== 1 ? "s" : ""} guardado
                    {documentos.length !== 1 ? "s" : ""}
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Carregar Documento
                </h2>
                <DocumentoUpload />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {documentos.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            Nenhum documento carregado ainda.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left px-6 py-4">
                                    Documento
                                </th>
                                <th className="text-left px-6 py-4">Data</th>
                                <th className="text-left px-6 py-4">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documentos.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span>
                                                {tipoIcon[d.tipo] ?? "📄"}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {d.nome}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {d.tipo}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {formatData(d.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a
                                            href={d.url_r2}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={d.nome}
                                            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                                        >
                                            Descarregar ↓
                                        </a>
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
