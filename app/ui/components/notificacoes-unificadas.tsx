// Componente notificacoes unificadas.
import { fetchNotificacoes } from "@/app/lib/data";
import ToggleLidaButton from "./notificacoes/toggle-lida-button";
import MarcarLidasButton from "./notificacoes/marcar-lidas-button";

export const dynamic = "force-dynamic";

const tipoStyle: Record<string, { badge: string; icon: string }> = {
    Alerta: { badge: "bg-red-500/10 text-red-400", icon: "🔴" },
    Aviso: { badge: "bg-amber-500/10 text-amber-400", icon: "🟡" },
    Info: { badge: "bg-cyan-500/10 text-cyan-400", icon: "🔵" },
};

const formatData = (dateStr: string) => {
    const date = new Date(dateStr);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);

    if (date.toDateString() === hoje.toDateString()) return "Hoje";
    if (date.toDateString() === ontem.toDateString()) return "Ontem";
    return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
    });
};

export default async function NotificacoesUnificadas() {
    const notificacoes = await fetchNotificacoes();
    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Notificações
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {naoLidas} não lida{naoLidas !== 1 ? "s" : ""}
                    </p>
                </div>
                {naoLidas > 0 && <MarcarLidasButton />}
            </div>

            <div className="space-y-3">
                {notificacoes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-12 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            Nenhuma notificação ainda.
                        </p>
                    </div>
                ) : (
                    notificacoes.map((n) => (
                        <div
                            key={n.id}
                            className={`bg-white dark:bg-gray-900 border rounded-xl p-5 flex items-start gap-4 transition-colors ${
                                n.lida
                                    ? "border-gray-200 dark:border-gray-800 opacity-60"
                                    : "border-gray-300 dark:border-gray-700"
                            }`}
                        >
                            <span className="text-lg mt-0.5">
                                {tipoStyle[n.tipo]?.icon ?? "🔵"}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {n.titulo}
                                    </p>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoStyle[n.tipo]?.badge ?? "bg-cyan-500/10 text-cyan-400"}`}
                                    >
                                        {n.tipo}
                                    </span>
                                    {!n.lida && (
                                        <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {n.descricao}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatData(n.created_at)}
                                </span>
                                <ToggleLidaButton id={n.id} lida={n.lida} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
