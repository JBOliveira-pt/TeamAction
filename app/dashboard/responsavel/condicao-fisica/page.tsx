import { fetchCondicaoFisicaResponsavel, fetchAtletaDoResponsavel } from "@/app/lib/data";

export const dynamic = "force-dynamic";

export default async function ResponsavelCondicaoFisicaPage() {
    const [medidas, dadosAtleta] = await Promise.all([
        fetchCondicaoFisicaResponsavel(),
        fetchAtletaDoResponsavel(),
    ]);

    const ultima = medidas.length > 0 ? medidas[medidas.length - 1] : null;
    const primeira = medidas.length > 0 ? medidas[0] : null;
    const cfAltura = ultima?.altura ?? null;
    const cfPeso = ultima?.peso ?? null;
    const cfIMC =
        cfAltura && cfPeso && cfAltura > 0
            ? (cfPeso / (cfAltura / 100) ** 2).toFixed(1)
            : null;
    const variacaoPeso =
        primeira && ultima ? (ultima.peso - primeira.peso).toFixed(1) : null;

    const ultimaData = ultima?.data_registo
        ? new Date(ultima.data_registo).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : null;

    const nomeEducando = dadosAtleta?.atleta?.nome ?? "educando";

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Condição Física
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Evolução de peso e altura de {nomeEducando}.
                </p>
            </div>

            {medidas.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-10 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="text-3xl">💪</span>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Sem registos
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Ainda não existem registos de condição física.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Altura atual"
                            value={cfAltura ? `${cfAltura} cm` : "—"}
                            sub={ultimaData ? `Atualizado em ${ultimaData}` : ""}
                        />
                        <StatCard
                            label="Peso atual"
                            value={cfPeso ? `${cfPeso} kg` : "—"}
                            sub={ultimaData ? `Atualizado em ${ultimaData}` : ""}
                        />
                        <StatCard
                            label="IMC"
                            value={cfIMC ?? "—"}
                            sub={cfIMC ? (Number(cfIMC) < 18.5 ? "Abaixo do peso" : Number(cfIMC) < 25 ? "Peso normal" : "Acima do peso") : ""}
                        />
                        <StatCard
                            label="Variação peso"
                            value={variacaoPeso ? `${Number(variacaoPeso) >= 0 ? "+" : ""}${variacaoPeso} kg` : "—"}
                            sub="Desde o primeiro registo"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Altura</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Peso</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">IMC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {[...medidas].reverse().map((m) => {
                                    const imc = m.altura > 0 ? (m.peso / (m.altura / 100) ** 2).toFixed(1) : "—";
                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                                                {new Date(m.data_registo).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">{m.altura} cm</td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">{m.peso} kg</td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">{imc}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </div>
    );
}
