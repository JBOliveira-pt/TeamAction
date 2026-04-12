// Opções de perfil do treinador: cursos, graus técnicos e países.
import countries from "@/app/lib/countries.json";

export const TRAINER_AMATEUR_COURSE_VALUE = "amador";
export const TRAINER_AMATEUR_COURSE_LABEL = "Treinador amador";

export type SelectOption = {
    value: string;
    label: string;
};

export const COUNTRY_OPTIONS = (countries as string[]).slice();

export function isValidNationality(value: string): boolean {
    const normalized = value.trim().toLowerCase();

    return COUNTRY_OPTIONS.some(
        (countryName) => countryName.trim().toLowerCase() === normalized,
    );
}
