import { CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function ReciboStatus({ status }: { status: string }) {
    return (
        <span
            className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                {
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20":
                        status === "pendente_envio",
                    "bg-green-500/10 text-green-400 border-green-500/20":
                        status === "enviado_atleta",
                },
            )}
        >
            {status === "pendente_envio" ? (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    Pendente de envio
                </>
            ) : null}
            {status === "enviado_atleta" ? (
                <>
                    <CheckIcon className="w-3.5 h-3.5" />
                    Enviado ao atleta
                </>
            ) : null}
        </span>
    );
}
