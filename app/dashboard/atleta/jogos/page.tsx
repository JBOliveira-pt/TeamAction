import { fetchJogosAtleta } from "@/app/lib/data";

export const dynamic = "force-dynamic";

export default async function JogosAtletaPage() {
    const jogos = await fetchJogosAtleta();

    const agora = new Date();

    const proximosJogos = jogos
        .filter((j) => {
            const d = new Date(j.data);
            return (
                Number.isFinite(d.getTime()) &&
                d.getTime() >= agora.getTime() &&
                j.estado === "agendado"
            );
        })
        .sort(
            (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
        );

    const jogosPassados = jogos
        .filter((j) => {
            const d = new Date(j.data);
            return (
                Number.isFinite(d.getTime()) &&
                (d.getTime() < agora.getTime() || j.estado !== "agendado")
            );
        })
        .sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
        );

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Jogos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {jogos.length > 0
                        ? `${proximosJogos.length} agendado${proximosJogos.length !== 1 ? "s" : ""} · ${jogosPassados.length} realizado${jogosPassados.length !== 1 ? "s" : ""}`
                        : "Sem jogos registados para a tua equipa."}
                </p>
            </div>

            {jogos.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-10 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="text-3xl">🤾</span>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Sem jogos
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Ainda não existem jogos registados para a tua equipa.
                    </p>
                </div>
            ) : (
                <>
                    {proximosJogos.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                Próximos jogos
                            </h2>
                            <div className="grid gap-3">
                                {proximosJogos.map((j) => (
                                    <JogoCard key={j.id} jogo={j} />
                                ))}
                            </div>
                        </section>
                    )}

                    {jogosPassados.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                Histórico
                            </h2>
                            <div className="grid gap-3">
                                {jogosPassados.map((j) => (
                                    <JogoCard key={j.id} jogo={j} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

function JogoCard({
    jogo,
}: {
    jogo: {
        id: string;
        adversario: string;
        data: string;
        casa_fora: string;
        resultado_nos: number | null;
        resultado_adv: number | null;
        estado: string;
        equipa_nome: string;
    };
}) {
    const data = new Date(jogo.data);
    const dataFormatada = Number.isFinite(data.getTime())
        ? data.toLocaleDateString("pt-PT", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "—";

    const realizado = jogo.estado === "realizado";
    const temResultado =
        realizado && jogo.resultado_nos !== null && jogo.resultado_adv !== null;

    let resultadoTexto = "";
    let resultadoCor = "";
    if (temResultado) {
        const nos = jogo.resultado_nos!;
        const adv = jogo.resultado_adv!;
        resultadoTexto = `${nos} - ${adv}`;
        if (nos > adv) resultadoCor = "text-emerald-500";
        else if (nos < adv) resultadoCor = "text-red-500";
        else resultadoCor = "text-amber-500";
    }

    const estadoBadge = (() => {
        switch (jogo.estado) {
            case "agendado":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
            case "realizado":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
            case "cancelado":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
        }
    })();

    const estadoLabel = (() => {
        switch (jogo.estado) {
            case "agendado":
                return "Agendado";
            case "realizado":
                return "Realizado";
            case "cancelado":
                return "Cancelado";
            default:
                return jogo.estado;
        }
    })();

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="shrink-0 text-center w-14">
                {temResultado ? (
                    <p className={`text-2xl font-bold ${resultadoCor}`}>
                        {resultadoTexto}
                    </p>
                ) : (
                    <span className="text-2xl">🤾</span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    vs {jogo.adversario}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {dataFormatada} ·{" "}
                    {jogo.casa_fora === "casa" ? "Em Casa" : "Fora"} ·{" "}
                    {jogo.equipa_nome}
                </p>
            </div>

            <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${estadoBadge}`}
            >
                {estadoLabel}
            </span>
        </div>
    );
}
