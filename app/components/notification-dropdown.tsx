"use client";

import { Bell, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/button";
import { useRouter } from "next/dist/client/components/navigation";

interface Notificacao {
    id: string;
    titulo: string;
    descricao: string;
    tipo: string;
    lida: boolean;
    created_at: string;
}

const tipoStyle: Record<string, { badge: string; icon: string }> = {
    "Alerta": { badge: "bg-red-500/10 text-red-400",    icon: "🔴" },
    "Aviso":  { badge: "bg-amber-500/10 text-amber-400", icon: "🟡" },
    "Info":   { badge: "bg-cyan-500/10 text-cyan-400",  icon: "🔵" },
};

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [positionAbove, setPositionAbove] = useState(false);
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notificacoes");
            const data = await res.json();
            setNotificacoes(data.notificacoes || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setPositionAbove(spaceBelow < 400);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen) fetchData();
        setIsOpen(!isOpen);
    };

    const handleVerTodas = () => {
        setIsOpen(false);
        router.push("/dashboard/presidente/notificacoes");
    };

    const showBadge = !loading && total > 0;

    return (
        <div className="relative" ref={containerRef}>
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative cursor-pointer"
                onClick={handleToggle}
            >
                <Bell size={20} />
                {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {total > 99 ? "99+" : total}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div
                    className={`absolute ${positionAbove ? "bottom-12" : "top-12"} right-0 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Notificações
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {total} não lida{total !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Carregando...
                            </div>
                        ) : notificacoes.length > 0 ? (
                            notificacoes.map((n) => (
                                <div
                                    key={n.id}
                                    className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-base mt-0.5">
                                            {tipoStyle[n.tipo]?.icon ?? "🔵"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {n.titulo}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoStyle[n.tipo]?.badge ?? "bg-cyan-500/10 text-cyan-400"}`}>
                                                    {n.tipo}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {n.descricao}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Nenhuma notificação não lida
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                        <Button
                            variant="outline"
                            className="w-full text-xs cursor-pointer"
                            onClick={handleVerTodas}
                        >
                            Ver todas as notificações
                        </Button>
                    </div>
                </div>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}


