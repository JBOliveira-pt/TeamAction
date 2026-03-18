"use client";
import CardPlano from "./components/CardPlano";
import CardMacro from "./components/CardMacro";
/**
 * Dashboard de Nutrição - TeamAction
 *
 * Funcionalidades premium para gestão de planos alimentares, refeições, macros, recomendações e alertas.
 *
 * Componentes principais:
 *  - Histórico de planos nutricionais (CRUD)
 *  - Visualização gráfica de macronutrientes (DonutChart)
 *  - Registo e gestão de refeições do dia
 *  - Recomendações e alertas
 *  - Exportação e partilha de planos
 *  - Modal avançado para planos (macros, objetivo, observações)
 *
 * Organização:
 *  - Tipos e dados iniciais
 *  - Componentes UI (DonutChart, Cards, Modais)
 *  - Estado e lógica principal
 *  - Renderização e layout
 */

// Tipos e dados iniciais
// ...existing code...
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
import React, { useState } from "react";
import DonutChart from "./ui/DonutChart";
// UI: DonutChart será extraído para componente próprio
// Estrutura de exemplo para histórico de planos nutricionais
export type NutritionPlan = {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    macros: { proteina: string; hidratos: string; gordura: string };
    objetivo?: string;
    observacoes?: string;
};

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

// =====================
// Componente principal
// =====================
export default function Nutrition() {
    // Estado principal
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
    // Campos avançados do modal
    const [macroProteina, setMacroProteina] = useState("");
    const [macroHidratos, setMacroHidratos] = useState("");
    const [macroGordura, setMacroGordura] = useState("");
    const [objetivo, setObjetivo] = useState("");
    const [observacoes, setObservacoes] = useState("");

    const handleOpenModal = () => {
        setShowModal(true);
        setSelectedPlan(null);
        setMacroProteina("");
        setMacroHidratos("");
        setMacroGordura("");
        setObjetivo("");
        setObservacoes("");
    };

    // Exportar plano como JSON
    const handleExportPlan = (plan: NutritionPlan) => {
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(plan, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute(
            "download",
            `${plan.name.replace(/\s+/g, "_")}_plano.json`,
        );
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Partilhar plano (copiar JSON para clipboard)
    const handleSharePlan = (plan: NutritionPlan) => {
        navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
        alert("Plano copiado para a área de transferência!");
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setPlanName("");
        setPlanDesc("");
        setMacroProteina("");
        setMacroHidratos("");
        setMacroGordura("");
        setObjetivo("");
        setObservacoes("");
        setSelectedPlan(null);
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (planName && planDesc) {
            const newPlan: NutritionPlan = {
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
            };
            setPlans([newPlan, ...plans]);
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

    // Função para adicionar alimento a uma refeição
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

    // Totais do dia
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

    // =====================
    // Renderização principal
    // =====================
    return (
        <div className="w-full min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col p-6">
            {/* Modal Novo Plano */}
            {showModal && (
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
                            <span className="text-blue-600 text-4xl mb-2">
                                🍽️
                            </span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedPlan
                                    ? "Editar Plano"
                                    : "Novo Plano Nutricional"}
                            </h3>
                        </div>
                        <form
                            className="flex flex-col gap-4"
                            onSubmit={handleSubmit}
                        >
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Nome do Plano
                                </span>
                                <input
                                    type="text"
                                    className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    placeholder="Ex: Plano Pré-Jogo"
                                    value={planName}
                                    onChange={(e) =>
                                        setPlanName(e.target.value)
                                    }
                                    required
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Descrição
                                </span>
                                <textarea
                                    className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    placeholder="Descreva o objetivo e detalhes do plano"
                                    value={planDesc}
                                    onChange={(e) =>
                                        setPlanDesc(e.target.value)
                                    }
                                    rows={3}
                                    required
                                />
                            </label>
                            <div className="flex gap-2">
                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Proteína alvo (g)
                                    </span>
                                    <input
                                        type="text"
                                        className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder="Ex: 160g"
                                        value={macroProteina}
                                        onChange={(e) =>
                                            setMacroProteina(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Hidratos alvo (g)
                                    </span>
                                    <input
                                        type="text"
                                        className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder="Ex: 320g"
                                        value={macroHidratos}
                                        onChange={(e) =>
                                            setMacroHidratos(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Gordura alvo (g)
                                    </span>
                                    <input
                                        type="text"
                                        className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder="Ex: 60g"
                                        value={macroGordura}
                                        onChange={(e) =>
                                            setMacroGordura(e.target.value)
                                        }
                                    />
                                </label>
                            </div>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Objetivo do Plano
                                </span>
                                <select
                                    className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Observações
                                </span>
                                <textarea
                                    className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    placeholder="Notas adicionais, restrições, etc."
                                    value={observacoes}
                                    onChange={(e) =>
                                        setObservacoes(e.target.value)
                                    }
                                    rows={2}
                                />
                            </label>
                            <button
                                type="submit"
                                className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-6 rounded-xl shadow transition-all"
                            >
                                {selectedPlan
                                    ? "Guardar Alterações"
                                    : "Guardar Plano"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Visualizar Plano */}
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
                            <span className="text-blue-600 text-4xl mb-2">
                                🍽️
                            </span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedPlan.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
                                {selectedPlan.description}
                            </p>
                            <div className="flex gap-4 mt-4">
                                <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                    Proteína: {selectedPlan.macros.proteina}
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                    Hidratos: {selectedPlan.macros.hidratos}
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                    Gordura: {selectedPlan.macros.gordura}
                                </div>
                            </div>
                            {selectedPlan.objetivo && (
                                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                    Objetivo:{" "}
                                    <span className="font-normal">
                                        {selectedPlan.objetivo}
                                    </span>
                                </div>
                            )}
                            {selectedPlan.observacoes && (
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 text-center">
                                    <span className="font-semibold">
                                        Observações:
                                    </span>{" "}
                                    {selectedPlan.observacoes}
                                </div>
                            )}
                            <div className="text-xs text-gray-400 mt-2">
                                Criado em: {selectedPlan.createdAt}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
                                onClick={() => handleEditPlan(selectedPlan)}
                            >
                                Editar
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg font-semibold"
                                onClick={handleCloseModal}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Cabeçalho premium normalizado */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-400 flex items-center gap-3 mb-1">
                            <span>🍽️</span> Nutrição
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Gestão de planos alimentares e registo nutricional.
                        </p>
                    </div>
                </div>
                <button
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-base shadow transition-all flex items-center gap-2"
                    onClick={handleOpenModal}
                >
                    <span className="text-xl">＋</span> Novo Plano
                </button>
            </div>

            {/* Histórico de Planos Nutricionais */}
            <div className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📋</span> Histórico de Planos
                </h3>
                {plans.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
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
            {/* Visualização gráfica de macronutrientes */}
            <div className="mb-10 flex flex-col md:flex-row items-center gap-8 justify-center">
                <div className="flex flex-col items-center">
                    <DonutChart
                        data={[
                            { label: "Proteína", value: 165, color: "#fb923c" },
                            { label: "Hidratos", value: 280, color: "#fbbf24" },
                            { label: "Gordura", value: 62, color: "#f59e0b" },
                        ]}
                    />
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-1">
                            <span
                                className="w-3 h-3 rounded-full inline-block"
                                style={{ background: "#fb923c" }}
                            ></span>{" "}
                            <span className="text-xs">Proteína</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span
                                className="w-3 h-3 rounded-full inline-block"
                                style={{ background: "#fbbf24" }}
                            ></span>{" "}
                            <span className="text-xs">Hidratos</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span
                                className="w-3 h-3 rounded-full inline-block"
                                style={{ background: "#f59e0b" }}
                            ></span>{" "}
                            <span className="text-xs">Gordura</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
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
            {/* Secção de refeições do dia */}
            <div className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🍽️</span> Refeições do Dia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {meals.map((meal) => (
                        <div
                            key={meal.id}
                            className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-xl p-5 shadow flex flex-col gap-2"
                        >
                            <div className="font-bold text-orange-700 dark:text-orange-300 text-lg mb-2">
                                {meal.type}
                            </div>
                            <ul className="mb-2">
                                {meal.foods.map((food, idx) => (
                                    <li
                                        key={idx}
                                        className="flex justify-between text-sm py-1 border-b border-dashed border-orange-100 dark:border-orange-900 last:border-0"
                                    >
                                        <span>{food.name}</span>
                                        <span className="flex gap-2">
                                            <span className="text-orange-700">
                                                {food.kcal} kcal
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                P:{food.proteina}g
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                H:{food.hidratos}g
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                G:{food.gordura}g
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {selectedMeal === meal.id ? (
                                <form
                                    className="flex flex-col gap-2 mt-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleAddFood(meal.id);
                                    }}
                                >
                                    <input
                                        className="border rounded px-2 py-1 text-sm"
                                        placeholder="Alimento"
                                        value={newFood.name}
                                        onChange={(e) =>
                                            setNewFood((f) => ({
                                                ...f,
                                                name: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-16 text-sm"
                                            placeholder="kcal"
                                            value={newFood.kcal}
                                            onChange={(e) =>
                                                setNewFood((f) => ({
                                                    ...f,
                                                    kcal: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            required
                                        />
                                        <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-12 text-sm"
                                            placeholder="P"
                                            value={newFood.proteina}
                                            onChange={(e) =>
                                                setNewFood((f) => ({
                                                    ...f,
                                                    proteina: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            required
                                        />
                                        <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-12 text-sm"
                                            placeholder="H"
                                            value={newFood.hidratos}
                                            onChange={(e) =>
                                                setNewFood((f) => ({
                                                    ...f,
                                                    hidratos: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            required
                                        />
                                        <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-12 text-sm"
                                            placeholder="G"
                                            value={newFood.gordura}
                                            onChange={(e) =>
                                                setNewFood((f) => ({
                                                    ...f,
                                                    gordura: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            type="submit"
                                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold"
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            type="button"
                                            className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded text-xs font-semibold"
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
                                    className="mt-2 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-xs font-semibold"
                                    onClick={() => setSelectedMeal(meal.id)}
                                >
                                    + Adicionar alimento
                                </button>
                            )}
                            {/* Totais da refeição */}
                            <div className="mt-2 text-xs text-gray-500 flex gap-2">
                                <span>Total:</span>
                                <span className="text-orange-700">
                                    {meal.foods.reduce((a, f) => a + f.kcal, 0)}{" "}
                                    kcal
                                </span>
                                <span>
                                    P:
                                    {meal.foods.reduce(
                                        (a, f) => a + f.proteina,
                                        0,
                                    )}
                                    g
                                </span>
                                <span>
                                    H:
                                    {meal.foods.reduce(
                                        (a, f) => a + f.hidratos,
                                        0,
                                    )}
                                    g
                                </span>
                                <span>
                                    G:
                                    {meal.foods.reduce(
                                        (a, f) => a + f.gordura,
                                        0,
                                    )}
                                    g
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Totais do dia */}
                <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-center">
                    <div className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-xl px-6 py-3 font-bold text-lg shadow">
                        Total do Dia: {totalMacros.kcal} kcal | P:
                        {totalMacros.proteina}g H:{totalMacros.hidratos}g G:
                        {totalMacros.gordura}g
                    </div>
                </div>

                {/* Recomendações personalizadas */}
                <div className="mt-8 mb-10 w-full max-w-3xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">💡</span> Recomendações
                        Personalizadas
                    </h3>
                    <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-xl p-6 shadow flex flex-col gap-3">
                        {/* Lógica simples de recomendações baseada nos totais do dia */}
                        {(() => {
                            const dicas = [];
                            if (totalMacros.proteina < 140) {
                                dicas.push(
                                    "Aumente a ingestão de proteína para suportar a recuperação muscular.",
                                );
                            } else if (totalMacros.proteina > 200) {
                                dicas.push(
                                    "A ingestão de proteína está acima do recomendado. Ajuste para evitar sobrecarga renal.",
                                );
                            } else {
                                dicas.push(
                                    "Ingestão de proteína adequada para o objetivo.",
                                );
                            }
                            if (totalMacros.hidratos < 220) {
                                dicas.push(
                                    "Considere aumentar os hidratos para garantir energia suficiente nos treinos/jogos.",
                                );
                            } else if (totalMacros.hidratos > 350) {
                                dicas.push(
                                    "Reduza um pouco os hidratos para evitar excesso calórico.",
                                );
                            } else {
                                dicas.push(
                                    "Bons níveis de hidratos para performance.",
                                );
                            }
                            if (totalMacros.gordura < 50) {
                                dicas.push(
                                    "Inclua fontes saudáveis de gordura (ex: azeite, frutos secos).",
                                );
                            } else if (totalMacros.gordura > 90) {
                                dicas.push(
                                    "A ingestão de gordura está elevada. Prefira gorduras insaturadas.",
                                );
                            } else {
                                dicas.push(
                                    "Gordura dentro dos valores recomendados.",
                                );
                            }
                            if (totalMacros.kcal < 1800) {
                                dicas.push(
                                    "A ingestão calórica está baixa. Avalie se corresponde ao objetivo do atleta.",
                                );
                            } else if (totalMacros.kcal > 3000) {
                                dicas.push(
                                    "A ingestão calórica está elevada. Ajuste conforme o objetivo (ganho de massa/peso).",
                                );
                            } else {
                                dicas.push("Ingestão calórica equilibrada.");
                            }
                            return (
                                <ul className="list-disc pl-6 space-y-1">
                                    {dicas.map((dica, idx) => (
                                        <li
                                            key={idx}
                                            className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2"
                                        >
                                            <span className="text-orange-500">
                                                •
                                            </span>{" "}
                                            {dica}
                                        </li>
                                    ))}
                                </ul>
                            );
                        })()}
                        <div className="mt-4 text-xs text-gray-400">
                            As recomendações são baseadas nos totais do dia e
                            podem ser ajustadas conforme o perfil e objetivo do
                            atleta.
                        </div>
                    </div>
                </div>

                {/* Alertas e dicas rápidas */}
                <div className="mb-10 w-full max-w-3xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">⚠️</span> Alertas & Dicas
                        Rápidas
                    </h3>
                    <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-xl p-6 shadow flex flex-col gap-3">
                        <ul className="list-disc pl-6 space-y-1">
                            <li className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                <span className="text-orange-500">•</span>{" "}
                                Hidrate-se ao longo do dia, especialmente antes
                                e após treinos/jogos.
                            </li>
                            <li className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                <span className="text-orange-500">•</span>{" "}
                                Prefira alimentos frescos e minimamente
                                processados.
                            </li>
                            <li className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                <span className="text-orange-500">•</span>{" "}
                                Planeie as refeições com antecedência para
                                evitar escolhas menos saudáveis.
                            </li>
                            <li className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                <span className="text-orange-500">•</span>{" "}
                                Inclua vegetais em todas as refeições para
                                garantir micronutrientes essenciais.
                            </li>
                            <li className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                <span className="text-orange-500">•</span> Evite
                                grandes períodos em jejum, faça snacks saudáveis
                                se necessário.
                            </li>
                        </ul>
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            Estas dicas são gerais e podem ser adaptadas
                            conforme a rotina e necessidades do atleta.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
