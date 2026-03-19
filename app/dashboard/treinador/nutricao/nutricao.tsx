"use client";
import React, { useState } from "react";
import CardPlano from "./components/CardPlano";
import CardMacro from "./components/CardMacro";
import DonutChart from "./ui/DonutChart";

// ── Tipos ────────────────────────────────────────────────────────
type Meal = {
    id: number;
    type: "Pequeno-almoço" | "Almoço" | "Jantar" | "Snack";
    foods: {
        name: string;
        kcal: number;
        proteina: number;
        hidratos: number;
        gordura: number;
    }[];
};

export type NutritionPlan = {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    macros: { proteina: string; hidratos: string; gordura: string };
    objetivo?: string;
    observacoes?: string;
};

// ── Dados iniciais ────────────────────────────────────────────────
const initialMeals: Meal[] = [
    {
        id: 1,
        type: "Pequeno-almoço",
        foods: [
            { name: "Aveia", kcal: 150, proteina: 5, hidratos: 27, gordura: 3 },
            { name: "Leite", kcal: 90, proteina: 6, hidratos: 9, gordura: 3 },
        ],
    },
    {
        id: 2,
        type: "Almoço",
        foods: [
            {
                name: "Frango grelhado",
                kcal: 200,
                proteina: 30,
                hidratos: 0,
                gordura: 5,
            },
            { name: "Arroz", kcal: 180, proteina: 4, hidratos: 38, gordura: 1 },
        ],
    },
    {
        id: 3,
        type: "Jantar",
        foods: [
            {
                name: "Salmão",
                kcal: 220,
                proteina: 25,
                hidratos: 0,
                gordura: 14,
            },
            {
                name: "Batata",
                kcal: 120,
                proteina: 2,
                hidratos: 27,
                gordura: 0,
            },
        ],
    },
];

const initialPlans: NutritionPlan[] = [
    {
        id: 1,
        name: "Pré-Jogo",
        description: "Plano focado em energia para o jogo.",
        createdAt: "2026-03-10",
        macros: { proteina: "160g", hidratos: "320g", gordura: "60g" },
    },
    {
        id: 2,
        name: "Recuperação",
        description: "Plano para recuperação pós-jogo.",
        createdAt: "2026-03-12",
        macros: { proteina: "180g", hidratos: "250g", gordura: "70g" },
    },
];

const macrosData = [
    { label: "Proteína", value: "165g / 180g", percent: 91, color: "#fb923c" },
    { label: "Hidratos", value: "280g / 320g", percent: 87, color: "#fbbf24" },
    { label: "Gordura", value: "62g / 70g", percent: 88, color: "#f59e0b" },
];

const mealIcons: Record<string, string> = {
    "Pequeno-almoço": "🌅",
    Almoço: "☀️",
    Jantar: "🌙",
    Snack: "🍎",
};

const inputCls =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-rose-400 transition-all text-sm";

// ── Componente principal ──────────────────────────────────────────
export default function Nutrition() {
    const [meals, setMeals] = useState<Meal[]>(initialMeals);
    const [newFood, setNewFood] = useState({
        name: "",
        kcal: 0,
        proteina: 0,
        hidratos: 0,
        gordura: 0,
    });
    const [selectedMeal, setSelectedMeal] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [planName, setPlanName] = useState("");
    const [planDesc, setPlanDesc] = useState("");
    const [plans, setPlans] = useState<NutritionPlan[]>(initialPlans);
    const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(
        null,
    );
    const [macroProteina, setMacroProteina] = useState("");
    const [macroHidratos, setMacroHidratos] = useState("");
    const [macroGordura, setMacroGordura] = useState("");
    const [objetivo, setObjetivo] = useState("");
    const [observacoes, setObservacoes] = useState("");

    // ── Handlers ────────────────────────────────────────────────
    const handleOpenModal = () => {
        setShowModal(true);
        setSelectedPlan(null);
        setPlanName("");
        setPlanDesc("");
        setMacroProteina("");
        setMacroHidratos("");
        setMacroGordura("");
        setObjetivo("");
        setObservacoes("");
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedPlan(null);
        setPlanName("");
        setPlanDesc("");
        setMacroProteina("");
        setMacroHidratos("");
        setMacroGordura("");
        setObjetivo("");
        setObservacoes("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (planName && planDesc) {
            setPlans([
                {
                    id: Date.now(),
                    name: planName,
                    description: planDesc,
                    createdAt: new Date().toISOString().slice(0, 10),
                    macros: {
                        proteina: macroProteina || "0g",
                        hidratos: macroHidratos || "0g",
                        gordura: macroGordura || "0g",
                    },
                    objetivo,
                    observacoes,
                },
                ...plans,
            ]);
        }
        handleCloseModal();
    };

    const handleViewPlan = (plan: NutritionPlan) => {
        setSelectedPlan(plan);
        setShowModal(false);
    };
    const handleEditPlan = (plan: NutritionPlan) => {
        setSelectedPlan(plan);
        setPlanName(plan.name);
        setPlanDesc(plan.description);
        setShowModal(true);
    };
    const handleExportPlan = (plan: NutritionPlan) => {
        const a = document.createElement("a");
        a.href =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(plan, null, 2));
        a.download = `${plan.name.replace(/\s+/g, "_")}_plano.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };
    const handleSharePlan = (plan: NutritionPlan) => {
        navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
        alert("Plano copiado para a área de transferência!");
    };

    const handleAddFood = (mealId: number) => {
        if (!newFood.name) return;
        setMeals((meals) =>
            meals.map((m) =>
                m.id === mealId
                    ? { ...m, foods: [...m.foods, { ...newFood }] }
                    : m,
            ),
        );
        setNewFood({ name: "", kcal: 0, proteina: 0, hidratos: 0, gordura: 0 });
        setSelectedMeal(null);
    };

    // ── Totais do dia ────────────────────────────────────────────
    const totalMacros = meals.reduce(
        (acc, meal) => {
            meal.foods.forEach((f) => {
                acc.kcal += f.kcal;
                acc.proteina += f.proteina;
                acc.hidratos += f.hidratos;
                acc.gordura += f.gordura;
            });
            return acc;
        },
        { kcal: 0, proteina: 0, hidratos: 0, gordura: 0 },
    );

    // ── Recomendações ────────────────────────────────────────────
    const recomendacoes: string[] = [];
    if (totalMacros.proteina < 140)
        recomendacoes.push(
            "Aumente a ingestão de proteína para suportar a recuperação muscular.",
        );
    else if (totalMacros.proteina > 200)
        recomendacoes.push(
            "A proteína está acima do recomendado. Ajuste para evitar sobrecarga renal.",
        );
    else recomendacoes.push("Ingestão de proteína adequada para o objetivo.");

    if (totalMacros.hidratos < 220)
        recomendacoes.push(
            "Aumente os hidratos para garantir energia suficiente nos treinos/jogos.",
        );
    else if (totalMacros.hidratos > 350)
        recomendacoes.push("Reduza os hidratos para evitar excesso calórico.");
    else recomendacoes.push("Bons níveis de hidratos para performance.");

    if (totalMacros.gordura < 50)
        recomendacoes.push(
            "Inclua fontes saudáveis de gordura (ex: azeite, frutos secos).",
        );
    else if (totalMacros.gordura > 90)
        recomendacoes.push(
            "A gordura está elevada. Prefira gorduras insaturadas.",
        );
    else recomendacoes.push("Gordura dentro dos valores recomendados.");

    if (totalMacros.kcal < 1800)
        recomendacoes.push(
            "A ingestão calórica está baixa. Avalie se corresponde ao objetivo.",
        );
    else if (totalMacros.kcal > 3000)
        recomendacoes.push(
            "A ingestão calórica está elevada. Ajuste conforme o objetivo.",
        );
    else recomendacoes.push("Ingestão calórica equilibrada.");

    // ── Render ───────────────────────────────────────────────────
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col gap-8">
            {/* ── MODAL NOVO / EDITAR PLANO ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-blue-100 dark:border-blue-900 max-h-[90vh] overflow-y-auto">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={handleCloseModal}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-rose-500 text-4xl mb-2">
                                🍽️
                            </span>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                {selectedPlan
                                    ? "Editar Plano"
                                    : "Novo Plano Nutricional"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Defina os macros e objetivo do plano
                            </p>
                        </div>
                        <form
                            className="flex flex-col gap-5"
                            onSubmit={handleSubmit}
                        >
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Nome do Plano
                                </label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    placeholder="Ex: Plano Pré-Jogo"
                                    value={planName}
                                    onChange={(e) =>
                                        setPlanName(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Descrição
                                </label>
                                <textarea
                                    className={inputCls}
                                    placeholder="Descreva o objetivo e detalhes do plano"
                                    value={planDesc}
                                    onChange={(e) =>
                                        setPlanDesc(e.target.value)
                                    }
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Proteína (g)
                                    </label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        placeholder="Ex: 160g"
                                        value={macroProteina}
                                        onChange={(e) =>
                                            setMacroProteina(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Hidratos (g)
                                    </label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        placeholder="Ex: 320g"
                                        value={macroHidratos}
                                        onChange={(e) =>
                                            setMacroHidratos(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Gordura (g)
                                    </label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        placeholder="Ex: 60g"
                                        value={macroGordura}
                                        onChange={(e) =>
                                            setMacroGordura(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Objetivo
                                </label>
                                <select
                                    className={inputCls}
                                    value={objetivo}
                                    onChange={(e) =>
                                        setObjetivo(e.target.value)
                                    }
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Manutenção">
                                        Manutenção
                                    </option>
                                    <option value="Ganho de Massa">
                                        Ganho de Massa
                                    </option>
                                    <option value="Perda de Peso">
                                        Perda de Peso
                                    </option>
                                    <option value="Performance">
                                        Performance
                                    </option>
                                    <option value="Recuperação">
                                        Recuperação
                                    </option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Observações
                                </label>
                                <textarea
                                    className={inputCls}
                                    placeholder="Notas adicionais, restrições, etc."
                                    value={observacoes}
                                    onChange={(e) =>
                                        setObservacoes(e.target.value)
                                    }
                                    rows={2}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold text-base shadow transition-all"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>💾</span>{" "}
                                    {selectedPlan
                                        ? "Guardar Alterações"
                                        : "Guardar Plano"}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL VER PLANO ── */}
            {selectedPlan && !showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-blue-100 dark:border-blue-900">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition-all"
                            onClick={handleCloseModal}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-rose-500 text-4xl mb-2">
                                🍽️
                            </span>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                {selectedPlan.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
                                {selectedPlan.description}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[
                                {
                                    label: "Proteína",
                                    val: selectedPlan.macros.proteina,
                                    color: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
                                },
                                {
                                    label: "Hidratos",
                                    val: selectedPlan.macros.hidratos,
                                    color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
                                },
                                {
                                    label: "Gordura",
                                    val: selectedPlan.macros.gordura,
                                    color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
                                },
                            ].map((m) => (
                                <div
                                    key={m.label}
                                    className={`rounded-xl p-3 flex flex-col items-center ${m.color}`}
                                >
                                    <span className="text-xs font-semibold opacity-70">
                                        {m.label}
                                    </span>
                                    <span className="text-lg font-extrabold mt-0.5">
                                        {m.val}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {selectedPlan.objetivo && (
                            <div className="mb-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Objetivo:</span>{" "}
                                {selectedPlan.objetivo}
                            </div>
                        )}
                        {selectedPlan.observacoes && (
                            <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">
                                    Observações:
                                </span>{" "}
                                {selectedPlan.observacoes}
                            </div>
                        )}
                        <div className="text-xs text-gray-400 mb-5">
                            Criado em: {selectedPlan.createdAt}
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 font-bold transition-all"
                                onClick={() => handleEditPlan(selectedPlan)}
                            >
                                ✏️ Editar
                            </button>
                            <button
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl py-2.5 font-bold hover:bg-gray-300 transition-all"
                                onClick={handleCloseModal}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CABEÇALHO ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-400 flex items-center gap-3">
                        <span>🍽️</span> Nutrição
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestão de planos alimentares e registo nutricional
                    </p>
                </div>
                <button
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow transition-all flex items-center gap-2"
                    onClick={handleOpenModal}
                >
                    <span>＋</span> Novo Plano
                </button>
            </div>

            {/* ── RESUMO DO DIA ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Calorias",
                        value: `${totalMacros.kcal} kcal`,
                        icon: "🔥",
                        color: "border-rose-200 dark:border-rose-800",
                        text: "text-rose-600 dark:text-rose-400",
                    },
                    {
                        label: "Proteína",
                        value: `${totalMacros.proteina}g`,
                        icon: "💪",
                        color: "border-orange-200 dark:border-orange-800",
                        text: "text-orange-600 dark:text-orange-400",
                    },
                    {
                        label: "Hidratos",
                        value: `${totalMacros.hidratos}g`,
                        icon: "⚡",
                        color: "border-yellow-200 dark:border-yellow-800",
                        text: "text-yellow-600 dark:text-yellow-400",
                    },
                    {
                        label: "Gordura",
                        value: `${totalMacros.gordura}g`,
                        icon: "🫙",
                        color: "border-amber-200 dark:border-amber-800",
                        text: "text-amber-600 dark:text-amber-400",
                    },
                ].map((c) => (
                    <div
                        key={c.label}
                        className={`bg-white dark:bg-gray-800 rounded-xl border ${c.color} p-4 flex flex-col gap-1 shadow-sm`}
                    >
                        <span className="text-xl">{c.icon}</span>
                        <span className={`text-2xl font-extrabold ${c.text}`}>
                            {c.value}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {c.label} do dia
                        </span>
                    </div>
                ))}
            </div>

            {/* ── ANÁLISE DE MACROS ── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                    <span>📊</span> Análise de Macronutrientes
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex flex-col items-center shrink-0">
                        <DonutChart
                            data={[
                                {
                                    label: "Proteína",
                                    value: 165,
                                    color: "#fb923c",
                                },
                                {
                                    label: "Hidratos",
                                    value: 280,
                                    color: "#fbbf24",
                                },
                                {
                                    label: "Gordura",
                                    value: 62,
                                    color: "#f59e0b",
                                },
                            ]}
                        />
                        <div className="flex gap-4 mt-3">
                            {[
                                ["#fb923c", "Proteína"],
                                ["#fbbf24", "Hidratos"],
                                ["#f59e0b", "Gordura"],
                            ].map(([c, l]) => (
                                <div
                                    key={l}
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ background: c }}
                                    />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {l}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {macrosData.map((macro, idx) => (
                            <CardMacro
                                key={idx}
                                label={macro.label}
                                value={macro.value}
                                percent={macro.percent}
                                color={macro.color}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── REFEIÇÕES DO DIA ── */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🥗</span> Refeições do Dia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {meals.map((meal) => {
                        const mealTotal = meal.foods.reduce(
                            (a, f) => ({
                                kcal: a.kcal + f.kcal,
                                proteina: a.proteina + f.proteina,
                                hidratos: a.hidratos + f.hidratos,
                                gordura: a.gordura + f.gordura,
                            }),
                            { kcal: 0, proteina: 0, hidratos: 0, gordura: 0 },
                        );
                        return (
                            <div
                                key={meal.id}
                                className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-xl p-4 shadow-sm flex flex-col gap-3"
                            >
                                {/* Cabeçalho refeição */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">
                                        {mealIcons[meal.type]}
                                    </span>
                                    <span className="font-bold text-orange-700 dark:text-orange-300 text-base">
                                        {meal.type}
                                    </span>
                                </div>

                                {/* Alimentos */}
                                <ul className="flex flex-col gap-1">
                                    {meal.foods.map((food, idx) => (
                                        <li
                                            key={idx}
                                            className="flex justify-between items-center text-sm py-1.5 border-b border-dashed border-orange-100 dark:border-orange-900/50 last:border-0"
                                        >
                                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                                                {food.name}
                                            </span>
                                            <span className="text-orange-600 dark:text-orange-400 font-semibold text-xs">
                                                {food.kcal} kcal
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Total da refeição */}
                                <div className="grid grid-cols-4 gap-1 text-center">
                                    {[
                                        { l: "kcal", v: mealTotal.kcal },
                                        { l: "P", v: `${mealTotal.proteina}g` },
                                        { l: "H", v: `${mealTotal.hidratos}g` },
                                        { l: "G", v: `${mealTotal.gordura}g` },
                                    ].map((x) => (
                                        <div
                                            key={x.l}
                                            className="bg-orange-50 dark:bg-orange-900/20 rounded-lg py-1"
                                        >
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                                {x.l}
                                            </div>
                                            <div className="text-xs font-bold text-orange-700 dark:text-orange-300">
                                                {x.v}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Adicionar alimento */}
                                {selectedMeal === meal.id ? (
                                    <form
                                        className="flex flex-col gap-2 border-t border-orange-100 dark:border-orange-900 pt-3"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleAddFood(meal.id);
                                        }}
                                    >
                                        <input
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-2 py-1.5 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-orange-400"
                                            placeholder="Nome do alimento"
                                            value={newFood.name}
                                            onChange={(e) =>
                                                setNewFood((f) => ({
                                                    ...f,
                                                    name: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                        <div className="grid grid-cols-4 gap-1">
                                            {[
                                                {
                                                    ph: "kcal",
                                                    key: "kcal" as const,
                                                },
                                                {
                                                    ph: "P(g)",
                                                    key: "proteina" as const,
                                                },
                                                {
                                                    ph: "H(g)",
                                                    key: "hidratos" as const,
                                                },
                                                {
                                                    ph: "G(g)",
                                                    key: "gordura" as const,
                                                },
                                            ].map(({ ph, key }) => (
                                                <input
                                                    key={key}
                                                    type="number"
                                                    className="rounded-lg border border-gray-300 dark:border-gray-700 px-1.5 py-1.5 bg-gray-50 dark:bg-gray-900 text-xs text-center focus:ring-2 focus:ring-orange-400"
                                                    placeholder={ph}
                                                    value={newFood[key]}
                                                    onChange={(e) =>
                                                        setNewFood((f) => ({
                                                            ...f,
                                                            [key]: Number(
                                                                e.target.value,
                                                            ),
                                                        }))
                                                    }
                                                    required
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-1.5 text-xs font-bold transition-all"
                                            >
                                                Adicionar
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg py-1.5 text-xs font-bold transition-all"
                                                onClick={() =>
                                                    setSelectedMeal(null)
                                                }
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <button
                                        className="w-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg py-1.5 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all"
                                        onClick={() => setSelectedMeal(meal.id)}
                                    >
                                        + Adicionar alimento
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── HISTÓRICO DE PLANOS ── */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📋</span> Histórico de Planos
                </h3>
                {plans.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        Nenhum plano registado.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <CardPlano
                                key={plan.id}
                                plan={plan}
                                onView={handleViewPlan}
                                onEdit={handleEditPlan}
                                onExport={handleExportPlan}
                                onShare={handleSharePlan}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── RECOMENDAÇÕES + ALERTAS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recomendações */}
                <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>💡</span> Recomendações Personalizadas
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {recomendacoes.map((dica, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200"
                            >
                                <span className="text-orange-500 mt-0.5 shrink-0">
                                    •
                                </span>
                                {dica}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                        Baseado nos totais do dia. Ajustável conforme o perfil
                        do atleta.
                    </p>
                </div>

                {/* Alertas */}
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>⚠️</span> Alertas & Dicas Rápidas
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {[
                            "Hidrate-se ao longo do dia, especialmente antes e após treinos/jogos.",
                            "Prefira alimentos frescos e minimamente processados.",
                            "Planeie as refeições com antecedência para evitar escolhas menos saudáveis.",
                            "Inclua vegetais em todas as refeições para garantir micronutrientes.",
                            "Evite grandes períodos em jejum — faça snacks saudáveis se necessário.",
                        ].map((dica, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-orange-800 dark:text-orange-200"
                            >
                                <span className="text-orange-500 mt-0.5 shrink-0">
                                    •
                                </span>
                                {dica}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        Dicas gerais adaptáveis à rotina do atleta.
                    </p>
                </div>
            </div>
        </div>
    );
}
