// Opções de modalidades desportivas disponíveis para o presidente.
export const PRESIDENT_SPORT_OPTIONS = [
    "Basquetebol",
    "Andebol",
    "Futsal",
    "Voleibol",
    "Ténis",
    "Ténis de mesa",
    "Badminton",
    "Padel",
    "Pickleball",
    "Squash",
    "Racquetball",
    "Hóquei em patins",
    "Floorball",
    "Corfebol",
    "Voleibol sentado",
    "Basquetebol em cadeira de rodas",
    "Andebol em cadeira de rodas",
    "Goalball",
    "Hóquei indoor",
] as const;

/** Modalidades atualmente habilitadas na plataforma. */
export const ENABLED_SPORTS: ReadonlySet<string> = new Set(["Andebol"]);

export type PresidentSportOption = (typeof PRESIDENT_SPORT_OPTIONS)[number];

export function normalizePresidentSport(
    sport: string,
): PresidentSportOption | null {
    const normalizedInput = sport.trim().toLowerCase();
    const matchedOption = PRESIDENT_SPORT_OPTIONS.find(
        (option) => option.toLowerCase() === normalizedInput,
    );

    return matchedOption ?? null;
}
