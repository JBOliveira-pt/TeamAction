"use client";

import { registarMedidaCondicaoFisica } from "@/app/lib/actions";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type Medida = {
    id: string;
    altura: number;
    peso: number;
    data_registo: string;
};

function calcularImc(altura: number, peso: number): number {
    const alturaM = altura / 100;
    return Math.round((peso / (alturaM * alturaM)) * 10) / 10;
}

function classificarImc(imc: number): string {
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Peso normal";
    if (imc < 30) return "Excesso de peso";
    return "Obesidade";
}

function formatData(data: string): string {
    const [ano, mes] = data.split("-");
    const meses = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
}

function ChartCard({
    title,
    data,
    color,
    unit,
}: {
    title: string;
    data: { label: string; valor: number }[];
    color: string;
    unit: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {title}
            </span>
            {data.length < 2 ? (
                <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
                    S&atilde;o precisos pelo menos 2 registos para mostrar o
                    gr&aacute;fico.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart
                        data={data}
                        margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                            unit={unit}
                        />
                        <Tooltip
                            formatter={(v) => [`${v}${unit}`, title]}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                fontSize: "12px",
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="valor"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 4, fill: color }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
            </span>
            <span className="text-xs text-gray-400">{sub}</span>
        </div>
    );
}

export default function CondicaoFisicaClient({
    medidas,
    contaPendente,
    alturaInicial,
    pesoInicial,
}: {
    medidas: Medida[];
    contaPendente: boolean;
    alturaInicial: number | null;
    pesoInicial: number | null;
}) {
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const ultima = medidas[medidas.length - 1] ?? null;
    const primeira = medidas[0] ?? null;

    const alturaAtual = ultima ? ultima.altura : alturaInicial;
    const pesoAtual = ultima ? ultima.peso : pesoInicial;
    const imc =
        alturaAtual && pesoAtual ? calcularImc(alturaAtual, pesoAtual) : null;
    const variacaoPeso =
        ultima && primeira && ultima.id !== primeira.id
            ? Math.round((ultima.peso - primeira.peso) * 10) / 10
            : null;

    const dataAtualizado = ultima
        ? new Date(ultima.data_registo).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : null;

    const dadosImc = medidas.map((m) => ({
        label: formatData(m.data_registo),
        valor: calcularImc(m.altura, m.peso),
    }));
    const dadosPeso = medidas.map((m) => ({
        label: formatData(m.data_registo),
        valor: m.peso,
    }));

    function handleSave(formData: FormData) {
        if (contaPendente) {
            setError(
                "Conta de atleta menor pendente de validação do responsável.",
            );
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await registarMedidaCondicaoFisica(null, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setShowModal(false);
                router.refresh();
            }
        });
    }

    return (
        <main className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Condi&ccedil;&atilde;o F&iacute;sica
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Evolu&ccedil;&atilde;o do teu peso e altura.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    disabled={contaPendente}
                    title={
                        contaPendente
                            ? "Conta pendente de validação do responsável"
                            : undefined
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Pencil size={14} />
                    Registar medidas
                </button>
            </div>

            {contaPendente && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    Conta pendente: aguarda validação do responsável para
                    registar ou alterar dados.
                </p>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Altura atual"
                    value={alturaAtual ? `${alturaAtual} cm` : "—"}
                    sub={
                        dataAtualizado
                            ? `Atualizado em ${dataAtualizado}`
                            : "Sem registos"
                    }
                />
                <StatCard
                    label="Peso atual"
                    value={pesoAtual ? `${pesoAtual} kg` : "—"}
                    sub={
                        dataAtualizado
                            ? `Atualizado em ${dataAtualizado}`
                            : "Sem registos"
                    }
                />
                <StatCard
                    label="IMC"
                    value={imc ? `${imc}` : "—"}
                    sub={imc ? classificarImc(imc) : "Sem dados"}
                />
                <StatCard
                    label="Varia&ccedil;&atilde;o peso"
                    value={
                        variacaoPeso !== null
                            ? `${variacaoPeso > 0 ? "+" : ""}${variacaoPeso} kg`
                            : "—"
                    }
                    sub="Desde o primeiro registo"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                    title="Evolu&ccedil;&atilde;o do IMC"
                    data={dadosImc}
                    color="#8b5cf6"
                    unit=""
                />
                <ChartCard
                    title="Evolu&ccedil;&atilde;o do peso (kg)"
                    data={dadosPeso}
                    color="#10b981"
                    unit=" kg"
                />
            </div>

            {/* Modal */}
            {showModal && !contaPendente && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Registar medidas
                        </h2>
                        <form action={handleSave} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Altura (cm)
                                </label>
                                <input
                                    name="altura"
                                    type="number"
                                    step="0.1"
                                    min="50"
                                    max="250"
                                    placeholder="ex: 172"
                                    defaultValue={alturaAtual ?? ""}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Peso (kg)
                                </label>
                                <input
                                    name="peso"
                                    type="number"
                                    step="0.1"
                                    min="20"
                                    max="300"
                                    placeholder="ex: 64"
                                    defaultValue={pesoAtual ?? ""}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Data do registo
                                </label>
                                <input
                                    name="data_registo"
                                    type="date"
                                    defaultValue={
                                        new Date().toISOString().split("T")[0]
                                    }
                                    max={new Date().toISOString().split("T")[0]}
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {error && (
                                <p className="text-xs text-red-500">{error}</p>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError(null);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                    {isPending ? "A guardar…" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
