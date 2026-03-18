export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_PRECHECK_NOTICE_DURATION_MS = 2000;

export type PasswordStrength = "fraca" | "media" | "forte";

export type PasswordValidation = {
    hasMinLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    score: number;
    strength: PasswordStrength;
    isValid: boolean;
};

const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export function validatePasswordPolicy(password: string): PasswordValidation {
    const hasMinLength = password.length >= MIN_PASSWORD_LENGTH;
    const hasLowercase = LOWERCASE_REGEX.test(password);
    const hasUppercase = UPPERCASE_REGEX.test(password);
    const hasNumber = NUMBER_REGEX.test(password);
    const hasSpecialChar = SPECIAL_CHAR_REGEX.test(password);

    const score = [
        hasMinLength,
        hasLowercase,
        hasUppercase,
        hasNumber,
        hasSpecialChar,
    ].filter(Boolean).length;

    const strength: PasswordStrength =
        score <= 2 ? "fraca" : score <= 4 ? "media" : "forte";

    return {
        hasMinLength,
        hasLowercase,
        hasUppercase,
        hasNumber,
        hasSpecialChar,
        score,
        strength,
        isValid:
            hasMinLength &&
            hasLowercase &&
            hasUppercase &&
            hasNumber &&
            hasSpecialChar,
    };
}
