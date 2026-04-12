/**
 * Regras de compatibilidade entre grau técnico do treinador e escalões de equipa (clube).
 *
 * Grau 1 (Iniciação)                → até Sub-14
 * Grau 2 (Desenvolvimento)          → até Sub-18
 * Grau 3 (Alto Rendimento Intermédio) → até Sub-20 / Juniores
 * Grau 4 (Alto Rendimento)          → tudo (incluindo Seniores)
 */

const ESCALOES_ORDENADOS = [
    "Sub-8",
    "Sub-10",
    "Sub-12",
    "Sub-14",
    "Sub-16",
    "Sub-18",
    "Sub-20",
    "Juniores",
    "Seniores",
] as const;

// Índice máximo (inclusive) de ESCALOES_ORDENADOS permitido por grau técnico
const GRAU_MAX_INDEX: Record<number, number> = {
    1: 3, // Sub-14  (idx 3)
    2: 5, // Sub-18  (idx 5)
    3: 7, // Juniores (idx 7)
    4: 8, // Seniores (idx 8) — tudo
};

export type GrauTecnico = {
    id: number;
    code: string;
    name: string;
    description: string;
};

export const GRAUS_TECNICOS: GrauTecnico[] = [
    { id: 1, code: "G1", name: "Grau I", description: "Iniciação" },
    { id: 2, code: "G2", name: "Grau II", description: "Desenvolvimento" },
    {
        id: 3,
        code: "G3",
        name: "Grau III",
        description: "Alto Rendimento Intermédio",
    },
    { id: 4, code: "G4", name: "Grau IV", description: "Alto Rendimento" },
];

/** Retorna os nomes de escalões que um treinador com o dado grau pode treinar. */
export function getEscaloesPermitidos(grauId: number): string[] {
    const maxIdx = GRAU_MAX_INDEX[grauId];
    if (maxIdx === undefined) return [];
    return ESCALOES_ORDENADOS.slice(0, maxIdx + 1) as unknown as string[];
}

/** Verifica se um escalão é permitido para um determinado grau técnico. */
export function isEscalaoPermitido(
    grauId: number,
    escalaoNome: string,
): boolean {
    return getEscaloesPermitidos(grauId).includes(escalaoNome);
}

// ── Regras de idade por escalão ──

/** Idade máxima (exclusiva) para cada escalão. null = sem limite. */
const ESCALAO_IDADE_MAX: Record<string, number | null> = {
    "Sub-8": 8,
    "Sub-10": 10,
    "Sub-12": 12,
    "Sub-14": 14,
    "Sub-16": 16,
    "Sub-18": 18,
    "Sub-20": 20,
    Juniores: 21,
    Seniores: null,
};

/** Retorna a idade máxima exclusiva para um escalão, ou null (sem limite). */
export function getIdadeMaximaEscalao(escalao: string): number | null {
    return ESCALAO_IDADE_MAX[escalao] ?? null;
}

/** Verifica se uma idade é permitida para o escalão (idade < limite). */
export function isIdadePermitidaEscalao(
    idade: number,
    escalao: string,
): boolean {
    const limite = getIdadeMaximaEscalao(escalao);
    if (limite === null) return true; // Seniores — sem limite
    return idade < limite;
}

/** Limites de composição de equipa. */
export const MAX_ATLETAS_POR_EQUIPA = 14;
export const MIN_JOGADORES_CAMPO = 6;
export const MIN_GUARDA_REDES = 1;
