"use client";

import {
    Eye,
    EyeOff,
    Info,
    Loader2,
    Lock,
    Mail,
    Megaphone,
    Shield,
    User,
    Users,
    Volleyball,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
    MIN_PASSWORD_LENGTH,
    PASSWORD_PRECHECK_NOTICE_DURATION_MS,
    validatePasswordPolicy,
} from "@/app/lib/password-policy";
import { PRESIDENT_SPORT_OPTIONS } from "@/app/lib/president-sport-options";
import {
    COUNTRY_OPTIONS,
    type SelectOption,
    TRAINER_AMATEUR_COURSE_LABEL,
    TRAINER_AMATEUR_COURSE_VALUE,
    isValidNationality,
} from "@/app/lib/trainer-profile-options";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_SIGNUP_AGE = 5;
const MIN_ADULT_SIGNUP_AGE = 18;
const MAX_SIGNUP_AGE = 120;
const ADULT_ONLY_ACCOUNT_TYPES: AccountType[] = [
    "presidente",
    "treinador",
    "responsavel",
];
const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;
const PORTUGAL_COUNTRY = "Portugal";
const IBAN_PREFIX = "PT50";
const IBAN_BODY_DIGITS_LENGTH = 21;
const IBAN_FORMATTED_MAX_LENGTH = 31;
const NIPC_DIGITS_LENGTH = 9;
const PHONE_DIGITS_LENGTH = 9;
const PORTUGAL_PHONE_PREFIX = "(351) ";
const WEBSITE_PREFIX = "https://";
const ATHLETE_HEIGHT_MIN_CM = 100;
const ATHLETE_HEIGHT_MAX_CM = 300;
const ATHLETE_WEIGHT_MIN_KG = 10;
const ATHLETE_WEIGHT_MAX_KG = 300;
const ATHLETE_WEIGHT_DECIMALS_REGEX = /^\d+(\.\d{1,2})?$/;
const ATHLETE_WEIGHT_INPUT_REGEX = /^\d{0,3}(\.\d{0,2})?$/;
const BREACHED_PASSWORD_MESSAGE =
    "Password has been found in an online data breach. For account safety, please use a different password.";
const PRECHECK_PENDING_MESSAGE =
    "Verificação prévia: a analisar se a palavra-passe já foi exposta em leaks...";
const PRECHECK_BREACH_MESSAGE =
    "Verificação prévia: esta palavra-passe já apareceu em leaks. Escolha outra.";
const PRECHECK_OK_MESSAGE =
    "Verificação prévia concluída: não foram detetadas exposições conhecidas.";
const PRECHECK_UNAVAILABLE_MESSAGE =
    "Verificação prévia indisponível no momento. Pode continuar e o Clerk fará a validação final.";
type CompleteStage =
    | "form"
    | "president-profile"
    | "trainer-profile"
    | "athlete-profile";

type AthleteLookupOption = {
    value: string;
    label: string;
    email?: string;
};

function formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0];
}

function getBirthDateBounds(minimumAge: number) {
    const today = new Date();
    const maxBirthDate = new Date(today);
    maxBirthDate.setFullYear(today.getFullYear() - minimumAge);

    const minBirthDate = new Date(today);
    minBirthDate.setFullYear(today.getFullYear() - MAX_SIGNUP_AGE);

    return {
        minBirthDate: formatDateForInput(minBirthDate),
        maxBirthDate: formatDateForInput(maxBirthDate),
    };
}

function getMinimumAgeForAccountType(accountType: AccountType | null): number {
    if (!accountType) return MIN_SIGNUP_AGE;

    return ADULT_ONLY_ACCOUNT_TYPES.includes(accountType)
        ? MIN_ADULT_SIGNUP_AGE
        : MIN_SIGNUP_AGE;
}

function calculateAge(birthDateIso: string): number | null {
    const birthDate = new Date(`${birthDateIso}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age -= 1;
    }

    return age;
}

function normalizePostalCode(value: string): string {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 4) {
        return digitsOnly;
    }

    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 7)}`;
}

function extractIbanBodyDigits(value: string): string {
    const normalized = value.toUpperCase().replace(/\s/g, "");
    const withoutPrefix = normalized.startsWith(IBAN_PREFIX)
        ? normalized.slice(IBAN_PREFIX.length)
        : normalized;

    return withoutPrefix.replace(/\D/g, "").slice(0, IBAN_BODY_DIGITS_LENGTH);
}

function normalizeIban(value: string): string {
    const digits = extractIbanBodyDigits(value);
    if (!digits) {
        return "";
    }

    const firstPart = digits.slice(0, 20);
    const lastDigit = digits.slice(20, 21);
    const firstGroups = firstPart.match(/.{1,4}/g) || [];
    const groups = [...firstGroups, lastDigit].filter(Boolean);

    return `${IBAN_PREFIX} ${groups.join(" ")}`;
}

function isIbanEffectivelyEmpty(value: string): boolean {
    return extractIbanBodyDigits(value).length === 0;
}

function extractNipcDigits(value: string): string {
    return value.replace(/\D/g, "").slice(0, NIPC_DIGITS_LENGTH);
}

function formatNipc(value: string): string {
    const digits = extractNipcDigits(value);
    const chunks = digits.match(/.{1,3}/g) || [];
    return chunks.join(" ");
}

function extractPortuguesePhoneDigits(value: string): string {
    const withoutPrefix = value.startsWith(PORTUGAL_PHONE_PREFIX)
        ? value.slice(PORTUGAL_PHONE_PREFIX.length)
        : value.replace(/^\(351\)\s?/, "");

    return withoutPrefix.replace(/\D/g, "").slice(0, PHONE_DIGITS_LENGTH);
}

function formatPortuguesePhone(value: string): string {
    const digits = extractPortuguesePhoneDigits(value);
    const chunks = digits.match(/.{1,3}/g) || [];
    const groupedDigits = chunks.join(" ");

    return groupedDigits ? `${PORTUGAL_PHONE_PREFIX}${groupedDigits}` : "";
}

function normalizeWebsite(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) {
        return "";
    }

    const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
    return `${WEBSITE_PREFIX}${withoutProtocol}`;
}

function isWebsiteEffectivelyEmpty(value: string): boolean {
    const trimmed = value.trim();
    return trimmed.length === 0 || trimmed === WEBSITE_PREFIX;
}

function isValidEmailFormat(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isAthleteDataValid(alturaCm: string, pesoKg: string): boolean {
    const trimmedWeight = pesoKg.trim();
    const alturaNum = Number(alturaCm);
    const pesoNum = Number(pesoKg);

    return (
        alturaCm.trim().length > 0 &&
        trimmedWeight.length > 0 &&
        !Number.isNaN(alturaNum) &&
        alturaNum >= ATHLETE_HEIGHT_MIN_CM &&
        alturaNum <= ATHLETE_HEIGHT_MAX_CM &&
        !Number.isNaN(pesoNum) &&
        pesoNum >= ATHLETE_WEIGHT_MIN_KG &&
        pesoNum <= ATHLETE_WEIGHT_MAX_KG &&
        ATHLETE_WEIGHT_DECIMALS_REGEX.test(trimmedWeight)
    );
}

function normalizeAthleteHeightInput(value: string): string {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 3);
    if (!digitsOnly) return "";

    const numeric = Number(digitsOnly);
    if (numeric > ATHLETE_HEIGHT_MAX_CM) {
        return String(ATHLETE_HEIGHT_MAX_CM);
    }

    return digitsOnly;
}

function normalizeAthleteWeightInput(value: string): string {
    const sanitized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");

    const [integerPartRaw, ...decimalParts] = sanitized.split(".");
    const integerPart = integerPartRaw.slice(0, 3);
    const decimalPart = decimalParts.join("").slice(0, 2);
    const hasDot = sanitized.includes(".");

    let candidate = integerPart;
    if (hasDot) {
        candidate = `${integerPart}.${decimalPart}`;
    }

    if (!ATHLETE_WEIGHT_INPUT_REGEX.test(candidate)) {
        return "";
    }

    if (!integerPart) {
        return hasDot ? "0." : "";
    }

    const numeric = Number(candidate);
    if (!Number.isNaN(numeric) && numeric > ATHLETE_WEIGHT_MAX_KG) {
        return String(ATHLETE_WEIGHT_MAX_KG);
    }

    return candidate;
}

function clampAthleteHeightInput(value: string): string {
    if (!value.trim()) {
        return "";
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return "";
    }

    if (numeric < ATHLETE_HEIGHT_MIN_CM) {
        return String(ATHLETE_HEIGHT_MIN_CM);
    }

    if (numeric > ATHLETE_HEIGHT_MAX_CM) {
        return String(ATHLETE_HEIGHT_MAX_CM);
    }

    return String(Math.trunc(numeric));
}

function clampAthleteWeightInput(value: string): string {
    if (!value.trim()) {
        return "";
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return "";
    }

    const clamped = Math.min(
        ATHLETE_WEIGHT_MAX_KG,
        Math.max(ATHLETE_WEIGHT_MIN_KG, numeric),
    );

    return String(Number(clamped.toFixed(2)));
}

async function fetchCityByPostalCode(
    postalCode: string,
): Promise<string | null> {
    const response = await fetch(`https://api.zippopotam.us/PT/${postalCode}`);

    if (!response.ok) {
        return null;
    }

    const data = (await response.json()) as {
        places?: Array<{ "place name"?: string }>;
    };

    return data.places?.[0]?.["place name"]?.trim() || null;
}

const OPTIONS: {
    value: AccountType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    {
        value: "presidente",
        label: "Presidente",
        description: "Gestao geral do clube e equipa.",
        icon: Shield,
    },
    {
        value: "treinador",
        label: "Treinador",
        description: "Planeamento tecnico e treino.",
        icon: Megaphone,
    },
    {
        value: "atleta",
        label: "Atleta",
        description: "Perfil desportivo e evolucao.",
        icon: Volleyball,
    },
    {
        value: "responsavel",
        label: "Responsável",
        description: "Acompanhamento do atleta.",
        icon: Users,
    },
];

interface CompleteAccountTypeFormProps {
    initialFirstName?: string;
    initialLastName?: string;
    initialEmail?: string;
}

export default function CompleteAccountTypeForm({
    initialFirstName = "",
    initialLastName = "",
    initialEmail = "",
}: CompleteAccountTypeFormProps) {
    const router = useRouter();
    const { signOut } = useClerk();
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [emailAddress] = useState(initialEmail);
    const [birthDate, setBirthDate] = useState("");
    const [password, setPassword] = useState("");
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isCheckingPasswordBreach, setIsCheckingPasswordBreach] =
        useState(false);
    const [isPasswordBreached, setIsPasswordBreached] = useState(false);
    const [passwordPrecheckNotice, setPasswordPrecheckNotice] = useState<
        string | null
    >(null);
    const [selected, setSelected] = useState<AccountType>("presidente");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDisconnectingCredentials, setIsDisconnectingCredentials] =
        useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [alturaCm, setAlturaCm] = useState("");
    const [pesoKg, setPesoKg] = useState("");
    const [stage, setStage] = useState<CompleteStage>("form");
    const [presidentClubName, setPresidentClubName] = useState("");
    const [presidentSport, setPresidentSport] = useState("");
    const [presidentIban, setPresidentIban] = useState("");
    const [presidentNipc, setPresidentNipc] = useState("");
    const [presidentWebsite, setPresidentWebsite] = useState("");
    const [presidentPhone, setPresidentPhone] = useState("");
    const [presidentPostalCode, setPresidentPostalCode] = useState("");
    const [presidentAddress, setPresidentAddress] = useState("");
    const [presidentCity, setPresidentCity] = useState("");
    const [trainerModality, setTrainerModality] = useState("");
    const [trainerNationality, setTrainerNationality] = useState("");
    const [trainerCourseModality, setTrainerCourseModality] = useState(
        TRAINER_AMATEUR_COURSE_VALUE,
    );
    const [trainerTechnicalLevel, setTrainerTechnicalLevel] = useState("");
    const [trainerCourseModalityOptions, setTrainerCourseModalityOptions] =
        useState<SelectOption[]>([]);
    const [
        trainerTechnicalLevelOptionsByModality,
        setTrainerTechnicalLevelOptionsByModality,
    ] = useState<Record<string, SelectOption[]>>({});
    const [trainerPhone, setTrainerPhone] = useState("");
    const [trainerPostalCode, setTrainerPostalCode] = useState("");
    const [trainerAddress, setTrainerAddress] = useState("");
    const [trainerCity, setTrainerCity] = useState("");
    const [athleteClubName, setAthleteClubName] = useState("");
    const [athleteTrainerName, setAthleteTrainerName] = useState("");
    const [athleteTeamName, setAthleteTeamName] = useState("");
    const [athletePostalCode, setAthletePostalCode] = useState("");
    const [athleteAddress, setAthleteAddress] = useState("");
    const [athleteCity, setAthleteCity] = useState("");
    const [athleteResponsibleEmail, setAthleteResponsibleEmail] = useState("");
    const [athleteClubOptions, setAthleteClubOptions] = useState<
        AthleteLookupOption[]
    >([]);
    const [athleteTrainerOptions, setAthleteTrainerOptions] = useState<
        AthleteLookupOption[]
    >([]);
    const [athleteTeamOptions, setAthleteTeamOptions] = useState<
        AthleteLookupOption[]
    >([]);
    const [athleteResponsibleEmailOptions, setAthleteResponsibleEmailOptions] =
        useState<AthleteLookupOption[]>([]);
    const precheckNoticeTimeoutRef = useRef<number | null>(null);
    const pendingNoticeTimeoutRef = useRef<number | null>(null);
    const precheckNoticeLockedUntilRef = useRef(0);

    const showPrecheckNotice = (message: string, persistMs = 0) => {
        if (precheckNoticeTimeoutRef.current) {
            window.clearTimeout(precheckNoticeTimeoutRef.current);
            precheckNoticeTimeoutRef.current = null;
        }

        setPasswordPrecheckNotice(message);

        if (persistMs > 0) {
            precheckNoticeLockedUntilRef.current = Date.now() + persistMs;
            precheckNoticeTimeoutRef.current = window.setTimeout(() => {
                setPasswordPrecheckNotice(null);
                precheckNoticeLockedUntilRef.current = 0;
                precheckNoticeTimeoutRef.current = null;
            }, persistMs);
            return;
        }

        precheckNoticeLockedUntilRef.current = 0;
    };

    const clearPendingNoticeTimeout = () => {
        if (pendingNoticeTimeoutRef.current) {
            window.clearTimeout(pendingNoticeTimeoutRef.current);
            pendingNoticeTimeoutRef.current = null;
        }
    };

    const passwordValidation = useMemo(
        () => validatePasswordPolicy(password),
        [password],
    );

    const passwordStrengthLabel =
        passwordValidation.strength === "fraca"
            ? "Fraca"
            : passwordValidation.strength === "media"
              ? "Média"
              : "Forte";

    const passwordStrengthColorClass =
        passwordValidation.strength === "fraca"
            ? "bg-red-500"
            : passwordValidation.strength === "media"
              ? "bg-amber-500"
              : "bg-emerald-500";

    const accountTypeLabel = useMemo(() => {
        return (
            OPTIONS.find((option) => option.value === selected)?.label ||
            "Conta"
        );
    }, [selected]);

    const minimumAgeForSelectedAccountType = useMemo(
        () => getMinimumAgeForAccountType(selected),
        [selected],
    );

    const { minBirthDate, maxBirthDate } = useMemo(
        () => getBirthDateBounds(minimumAgeForSelectedAccountType),
        [minimumAgeForSelectedAccountType],
    );

    const athleteAge = useMemo(() => {
        if (selected !== "atleta" || !birthDate) {
            return null;
        }

        return calculateAge(birthDate);
    }, [selected, birthDate]);

    const athleteNeedsResponsible = useMemo(() => {
        return athleteAge !== null && athleteAge < MIN_ADULT_SIGNUP_AGE;
    }, [athleteAge]);

    const trainerTechnicalLevelOptions = useMemo(
        () =>
            trainerCourseModality !== TRAINER_AMATEUR_COURSE_VALUE
                ? trainerTechnicalLevelOptionsByModality[
                      trainerCourseModality
                  ] || []
                : [],
        [trainerCourseModality, trainerTechnicalLevelOptionsByModality],
    );

    const selectedAthleteClubOption = useMemo(() => {
        const normalized = athleteClubName.trim().toLowerCase();
        if (!normalized) return null;

        return (
            athleteClubOptions.find(
                (option) => option.label.trim().toLowerCase() === normalized,
            ) || null
        );
    }, [athleteClubName, athleteClubOptions]);

    const selectedAthleteTrainerOption = useMemo(() => {
        const normalized = athleteTrainerName.trim().toLowerCase();
        if (!normalized) return null;

        return (
            athleteTrainerOptions.find(
                (option) => option.label.trim().toLowerCase() === normalized,
            ) || null
        );
    }, [athleteTrainerName, athleteTrainerOptions]);

    const selectedAthleteTeamOption = useMemo(() => {
        const normalized = athleteTeamName.trim().toLowerCase();
        if (!normalized) return null;

        return (
            athleteTeamOptions.find(
                (option) => option.label.trim().toLowerCase() === normalized,
            ) || null
        );
    }, [athleteTeamName, athleteTeamOptions]);

    useEffect(() => {
        let isCancelled = false;

        const loadTrainerOptions = async () => {
            try {
                const response = await fetch("/api/trainer-profile/options");
                if (!response.ok) {
                    if (!isCancelled) {
                        setTrainerCourseModalityOptions([]);
                        setTrainerTechnicalLevelOptionsByModality({});
                    }
                    return;
                }

                const data = (await response.json()) as {
                    courseModalityOptions?: SelectOption[];
                    technicalLevelOptionsByModality?: Record<
                        string,
                        SelectOption[]
                    >;
                };

                if (!isCancelled) {
                    setTrainerCourseModalityOptions(
                        data.courseModalityOptions || [],
                    );
                    setTrainerTechnicalLevelOptionsByModality(
                        data.technicalLevelOptionsByModality || {},
                    );
                }
            } catch {
                if (!isCancelled) {
                    setTrainerCourseModalityOptions([]);
                    setTrainerTechnicalLevelOptionsByModality({});
                }
            }
        };

        void loadTrainerOptions();

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        if (trainerCourseModality === TRAINER_AMATEUR_COURSE_VALUE) {
            if (trainerTechnicalLevel) {
                setTrainerTechnicalLevel("");
            }
            return;
        }

        if (
            trainerTechnicalLevel &&
            !trainerTechnicalLevelOptions.some(
                (option) => option.value === trainerTechnicalLevel,
            )
        ) {
            setTrainerTechnicalLevel("");
        }
    }, [
        trainerCourseModality,
        trainerTechnicalLevel,
        trainerTechnicalLevelOptions,
    ]);

    useEffect(() => {
        let isCancelled = false;

        const loadAthleteOptions = async () => {
            const query = [
                athleteClubName,
                athleteTrainerName,
                athleteTeamName,
                athleteResponsibleEmail,
            ]
                .map((value) => value.trim())
                .sort((a, b) => b.length - a.length)[0];

            if (!query || query.length < 2) {
                if (!isCancelled) {
                    setAthleteClubOptions([]);
                    setAthleteTrainerOptions([]);
                    setAthleteTeamOptions([]);
                    setAthleteResponsibleEmailOptions([]);
                }
                return;
            }

            try {
                const response = await fetch(
                    `/api/athlete-profile/options?query=${encodeURIComponent(query)}`,
                );

                if (!response.ok) {
                    if (!isCancelled) {
                        setAthleteClubOptions([]);
                        setAthleteTrainerOptions([]);
                        setAthleteTeamOptions([]);
                        setAthleteResponsibleEmailOptions([]);
                    }
                    return;
                }

                const data = (await response.json()) as {
                    clubOptions?: AthleteLookupOption[];
                    trainerOptions?: AthleteLookupOption[];
                    teamOptions?: AthleteLookupOption[];
                    responsibleEmailOptions?: AthleteLookupOption[];
                };

                if (!isCancelled) {
                    setAthleteClubOptions(data.clubOptions || []);
                    setAthleteTrainerOptions(data.trainerOptions || []);
                    setAthleteTeamOptions(data.teamOptions || []);
                    setAthleteResponsibleEmailOptions(
                        data.responsibleEmailOptions || [],
                    );
                }
            } catch {
                if (!isCancelled) {
                    setAthleteClubOptions([]);
                    setAthleteTrainerOptions([]);
                    setAthleteTeamOptions([]);
                    setAthleteResponsibleEmailOptions([]);
                }
            }
        };

        void loadAthleteOptions();

        return () => {
            isCancelled = true;
        };
    }, [
        athleteClubName,
        athleteTrainerName,
        athleteTeamName,
        athleteResponsibleEmail,
    ]);

    useEffect(() => {
        const normalizedPostalCode = normalizePostalCode(presidentPostalCode);

        if (presidentPostalCode !== normalizedPostalCode) {
            setPresidentPostalCode(normalizedPostalCode);
            return;
        }

        if (!normalizedPostalCode) {
            setPresidentCity("");
            return;
        }

        if (!POSTAL_CODE_REGEX.test(normalizedPostalCode)) {
            setPresidentCity("");
            return;
        }

        let isCancelled = false;

        const resolveCity = async () => {
            try {
                const city = await fetchCityByPostalCode(normalizedPostalCode);
                if (!isCancelled) {
                    setPresidentCity(city || "");
                }
            } catch {
                if (!isCancelled) {
                    setPresidentCity("");
                }
            }
        };

        void resolveCity();

        return () => {
            isCancelled = true;
        };
    }, [presidentPostalCode]);

    useEffect(() => {
        const normalizedPostalCode = normalizePostalCode(trainerPostalCode);

        if (trainerPostalCode !== normalizedPostalCode) {
            setTrainerPostalCode(normalizedPostalCode);
            return;
        }

        if (!normalizedPostalCode) {
            setTrainerCity("");
            return;
        }

        if (!POSTAL_CODE_REGEX.test(normalizedPostalCode)) {
            setTrainerCity("");
            return;
        }

        let isCancelled = false;

        const resolveCity = async () => {
            try {
                const city = await fetchCityByPostalCode(normalizedPostalCode);
                if (!isCancelled) {
                    setTrainerCity(city || "");
                }
            } catch {
                if (!isCancelled) {
                    setTrainerCity("");
                }
            }
        };

        void resolveCity();

        return () => {
            isCancelled = true;
        };
    }, [trainerPostalCode]);

    useEffect(() => {
        const normalizedPostalCode = normalizePostalCode(athletePostalCode);

        if (athletePostalCode !== normalizedPostalCode) {
            setAthletePostalCode(normalizedPostalCode);
            return;
        }

        if (!normalizedPostalCode) {
            setAthleteCity("");
            return;
        }

        if (!POSTAL_CODE_REGEX.test(normalizedPostalCode)) {
            setAthleteCity("");
            return;
        }

        let isCancelled = false;

        const resolveCity = async () => {
            try {
                const city = await fetchCityByPostalCode(normalizedPostalCode);
                if (!isCancelled) {
                    setAthleteCity(city || "");
                }
            } catch {
                if (!isCancelled) {
                    setAthleteCity("");
                }
            }
        };

        void resolveCity();

        return () => {
            isCancelled = true;
        };
    }, [athletePostalCode]);

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
            if (precheckNoticeTimeoutRef.current) {
                window.clearTimeout(precheckNoticeTimeoutRef.current);
                precheckNoticeTimeoutRef.current = null;
            }
            clearPendingNoticeTimeout();
        };
    }, [photoPreviewUrl]);

    useEffect(() => {
        if (!passwordTouched || !passwordValidation.isValid) {
            setIsCheckingPasswordBreach(false);
            setIsPasswordBreached(false);
            if (Date.now() >= precheckNoticeLockedUntilRef.current) {
                setPasswordPrecheckNotice(null);
            }
            return;
        }

        let isCancelled = false;
        const timeoutId = window.setTimeout(async () => {
            try {
                setIsCheckingPasswordBreach(true);
                pendingNoticeTimeoutRef.current = window.setTimeout(() => {
                    pendingNoticeTimeoutRef.current = null;
                    if (
                        !isCancelled &&
                        Date.now() >= precheckNoticeLockedUntilRef.current
                    ) {
                        showPrecheckNotice(PRECHECK_PENDING_MESSAGE);
                    }
                }, 250);

                const response = await fetch("/api/password-breach-check", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password }),
                });

                clearPendingNoticeTimeout();

                if (!response.ok) {
                    if (!isCancelled) {
                        setIsPasswordBreached(false);
                        showPrecheckNotice(
                            PRECHECK_UNAVAILABLE_MESSAGE,
                            PASSWORD_PRECHECK_NOTICE_DURATION_MS,
                        );
                    }
                    return;
                }

                const data = (await response.json()) as {
                    breached?: boolean;
                };

                if (!isCancelled) {
                    const breached = Boolean(data.breached);
                    setIsPasswordBreached(breached);
                    if (breached) {
                        // Keep the breach warning visible until the password changes.
                        showPrecheckNotice(PRECHECK_BREACH_MESSAGE);
                    } else {
                        showPrecheckNotice(
                            PRECHECK_OK_MESSAGE,
                            PASSWORD_PRECHECK_NOTICE_DURATION_MS,
                        );
                    }
                }
            } catch {
                clearPendingNoticeTimeout();
                if (!isCancelled) {
                    setIsPasswordBreached(false);
                    showPrecheckNotice(
                        PRECHECK_UNAVAILABLE_MESSAGE,
                        PASSWORD_PRECHECK_NOTICE_DURATION_MS,
                    );
                }
            } finally {
                if (!isCancelled) {
                    setIsCheckingPasswordBreach(false);
                }
            }
        }, 500);

        return () => {
            isCancelled = true;
            window.clearTimeout(timeoutId);
            clearPendingNoticeTimeout();
        };
    }, [password, passwordTouched, passwordValidation.isValid]);

    const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (!file) {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
            setProfilePhoto(null);
            setPhotoPreviewUrl(null);
            return;
        }

        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
            setError("Formato de foto inválido. Use JPG, PNG ou WEBP.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_PHOTO_SIZE) {
            setError("A foto deve ter no máximo 5MB.");
            event.target.value = "";
            return;
        }

        setError(null);
        setProfilePhoto(file);

        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }
        setPhotoPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        setSuccessMessage(null);

        if (!firstName.trim()) {
            setError("Informe o primeiro nome.");
            return;
        }

        if (!lastName.trim()) {
            setError("Informe o último nome.");
            return;
        }

        if (!emailAddress.trim()) {
            setError("Email inválido.");
            return;
        }

        if (!birthDate) {
            setError("Informe a data de nascimento.");
            return;
        }

        const age = calculateAge(birthDate);
        if (age === null || age > MAX_SIGNUP_AGE) {
            setError(
                `A idade deve estar entre ${MIN_SIGNUP_AGE} e ${MAX_SIGNUP_AGE} anos.`,
            );
            return;
        }

        if (age < minimumAgeForSelectedAccountType) {
            setError(
                minimumAgeForSelectedAccountType === MIN_ADULT_SIGNUP_AGE
                    ? "Para Presidente, Treinador e Responsável, a idade mínima é 18 anos."
                    : `A idade deve estar entre ${MIN_SIGNUP_AGE} e ${MAX_SIGNUP_AGE} anos.`,
            );
            return;
        }

        if (!passwordValidation.isValid) {
            setError(
                "A palavra-passe deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.",
            );
            return;
        }

        if (isPasswordBreached) {
            setError(BREACHED_PASSWORD_MESSAGE);
            return;
        }

        if (!selected) {
            setError("Selecione um tipo de conta.");
            return;
        }

        if (selected === "presidente" && stage === "form") {
            setError(null);
            setStage("president-profile");
            return;
        }

        if (selected === "treinador" && stage === "form") {
            setError(null);
            setStage("trainer-profile");
            return;
        }

        if (selected === "atleta" && stage === "form") {
            setError(null);
            setStage("athlete-profile");
            return;
        }

        if (selected === "presidente") {
            const normalizedIban = extractIbanBodyDigits(presidentIban);
            if (
                normalizedIban.length > 0 &&
                normalizedIban.length !== IBAN_BODY_DIGITS_LENGTH
            ) {
                setError(
                    `IBAN deve começar com ${IBAN_PREFIX} e conter mais ${IBAN_BODY_DIGITS_LENGTH} dígitos.`,
                );
                return;
            }

            const presidentPhoneDigits =
                extractPortuguesePhoneDigits(presidentPhone);
            if (
                presidentPhoneDigits.length > 0 &&
                presidentPhoneDigits.length !== PHONE_DIGITS_LENGTH
            ) {
                setError(
                    "Telefone deve conter exatamente 9 dígitos após (351).",
                );
                return;
            }

            if (
                !isWebsiteEffectivelyEmpty(presidentWebsite) &&
                (!presidentWebsite.startsWith(WEBSITE_PREFIX) ||
                    !/^https:\/\/.+/i.test(presidentWebsite.trim()))
            ) {
                setError("Website deve começar com https://.");
                return;
            }

            const nipcDigits = extractNipcDigits(presidentNipc);
            if (
                nipcDigits.length > 0 &&
                nipcDigits.length !== NIPC_DIGITS_LENGTH
            ) {
                setError(
                    "NIPC deve conter exatamente 9 dígitos no formato 000 000 000.",
                );
                return;
            }

            if (!presidentClubName.trim()) {
                setError("Nome do clube é obrigatório.");
                return;
            }

            if (!presidentSport.trim()) {
                setError("Modalidade é obrigatória.");
                return;
            }

            if (
                !PRESIDENT_SPORT_OPTIONS.some(
                    (option) => option === presidentSport.trim(),
                )
            ) {
                setError("Selecione uma modalidade válida da lista.");
                return;
            }

            const normalizedPostalCode =
                normalizePostalCode(presidentPostalCode);
            if (
                normalizedPostalCode.length > 0 &&
                !POSTAL_CODE_REGEX.test(normalizedPostalCode)
            ) {
                setError("Código Postal inválido. Use o formato 0000-000.");
                return;
            }

            if (normalizedPostalCode && !presidentCity.trim()) {
                setError(
                    "Código Postal inválido. Informe um Código Postal válido de Portugal.",
                );
                return;
            }
        }

        if (selected === "treinador") {
            if (!trainerModality.trim()) {
                setError("Modalidade é obrigatória.");
                return;
            }

            if (
                !PRESIDENT_SPORT_OPTIONS.some(
                    (option) => option === trainerModality.trim(),
                )
            ) {
                setError("Selecione uma modalidade válida da lista.");
                return;
            }

            if (!trainerNationality.trim()) {
                setError("Nacionalidade é obrigatória.");
                return;
            }

            if (!isValidNationality(trainerNationality)) {
                setError("Selecione uma nacionalidade válida da lista.");
                return;
            }

            if (!trainerCourseModality.trim()) {
                setError("Curso IPJD/PNFT é obrigatório.");
                return;
            }

            if (trainerCourseModality !== TRAINER_AMATEUR_COURSE_VALUE) {
                const selectedCourseModality =
                    trainerCourseModalityOptions.find(
                        (option) => option.value === trainerCourseModality,
                    );

                if (!selectedCourseModality) {
                    setError("Selecione um curso IPJD/PNFT válido.");
                    return;
                }

                if (!trainerTechnicalLevel.trim()) {
                    setError(
                        "Grau Técnico é obrigatório para curso IPJD/PNFT.",
                    );
                    return;
                }

                if (
                    !trainerTechnicalLevelOptions.some(
                        (option) => option.value === trainerTechnicalLevel,
                    )
                ) {
                    setError(
                        "A combinação de curso e grau técnico é inválida.",
                    );
                    return;
                }
            }

            const normalizedPostalCode = normalizePostalCode(trainerPostalCode);
            if (
                normalizedPostalCode.length > 0 &&
                !POSTAL_CODE_REGEX.test(normalizedPostalCode)
            ) {
                setError("Código Postal inválido. Use o formato 0000-000.");
                return;
            }

            if (normalizedPostalCode && !trainerCity.trim()) {
                setError(
                    "Código Postal inválido. Informe um Código Postal válido de Portugal.",
                );
                return;
            }
        }

        if (selected === "atleta") {
            if (!isAthleteDataValid(alturaCm, pesoKg)) {
                setError(
                    "Para atleta, Altura deve estar entre 100 e 300 cm. Peso deve estar entre 10 e 300 kg, com no máximo 2 casas decimais.",
                );
                return;
            }

            const normalizedPostalCode = normalizePostalCode(athletePostalCode);
            if (
                normalizedPostalCode.length > 0 &&
                !POSTAL_CODE_REGEX.test(normalizedPostalCode)
            ) {
                setError("Código Postal inválido. Use o formato 0000-000.");
                return;
            }

            if (normalizedPostalCode && !athleteCity.trim()) {
                setError(
                    "Código Postal inválido. Informe um Código Postal válido de Portugal.",
                );
                return;
            }

            if (
                athleteNeedsResponsible &&
                !isValidEmailFormat(athleteResponsibleEmail)
            ) {
                setError(
                    "Para menores de 18 anos, é obrigatório indicar um e-mail válido de Responsável.",
                );
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = new FormData();
            payload.append("firstName", firstName.trim());
            payload.append("lastName", lastName.trim());
            payload.append("email", emailAddress.trim());
            payload.append("birthDate", birthDate);
            payload.append("password", password);
            payload.append("accountType", selected);
            if (profilePhoto) {
                payload.append("profilePhoto", profilePhoto);
            }

            if (selected === "atleta") {
                payload.append("altura_cm", alturaCm);
                payload.append("peso_kg", pesoKg);
                payload.append("athlete_club_name", athleteClubName.trim());
                payload.append(
                    "athlete_trainer_name",
                    athleteTrainerName.trim(),
                );
                payload.append("athlete_team_name", athleteTeamName.trim());
                payload.append(
                    "athlete_postal_code",
                    normalizePostalCode(athletePostalCode),
                );
                payload.append("athlete_address", athleteAddress.trim());
                payload.append("athlete_city", athleteCity.trim());
                payload.append("athlete_country", PORTUGAL_COUNTRY);
                payload.append(
                    "athlete_responsible_email",
                    athleteNeedsResponsible
                        ? athleteResponsibleEmail.trim()
                        : "",
                );
                payload.append(
                    "athlete_club_pending_approval",
                    String(Boolean(selectedAthleteClubOption)),
                );
                payload.append(
                    "athlete_trainer_pending_approval",
                    String(Boolean(selectedAthleteTrainerOption)),
                );
                payload.append(
                    "athlete_team_pending_approval",
                    String(Boolean(selectedAthleteTeamOption)),
                );
                payload.append(
                    "athlete_responsible_pending_approval",
                    String(
                        athleteNeedsResponsible &&
                            athleteResponsibleEmail.trim().length > 0,
                    ),
                );
            }
            if (selected === "presidente") {
                payload.append("president_club_name", presidentClubName.trim());
                payload.append("president_sport", presidentSport.trim());
                payload.append(
                    "president_iban",
                    isIbanEffectivelyEmpty(presidentIban)
                        ? ""
                        : normalizeIban(presidentIban),
                );
                payload.append(
                    "president_nipc",
                    extractNipcDigits(presidentNipc).length > 0
                        ? formatNipc(presidentNipc)
                        : "",
                );
                payload.append(
                    "president_website",
                    isWebsiteEffectivelyEmpty(presidentWebsite)
                        ? ""
                        : presidentWebsite.trim(),
                );
                payload.append(
                    "president_phone",
                    extractPortuguesePhoneDigits(presidentPhone).length > 0
                        ? presidentPhone.trim()
                        : "",
                );
                payload.append(
                    "president_postal_code",
                    normalizePostalCode(presidentPostalCode),
                );
                payload.append("president_address", presidentAddress.trim());
                payload.append("president_city", presidentCity.trim());
                payload.append("president_country", PORTUGAL_COUNTRY);
            }
            if (selected === "treinador") {
                payload.append("trainer_modality", trainerModality.trim());
                payload.append(
                    "trainer_nationality",
                    trainerNationality.trim(),
                );
                payload.append(
                    "trainer_course_modality_id",
                    trainerCourseModality,
                );
                payload.append(
                    "trainer_technical_level_id",
                    trainerTechnicalLevel,
                );
                payload.append("trainer_phone", trainerPhone.trim());
                payload.append(
                    "trainer_postal_code",
                    normalizePostalCode(trainerPostalCode),
                );
                payload.append("trainer_address", trainerAddress.trim());
                payload.append("trainer_city", trainerCity.trim());
                payload.append("trainer_country", PORTUGAL_COUNTRY);
            }

            const response = await fetch("/api/account-type", {
                method: "POST",
                body: payload,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(
                    data?.error || "Nao foi possivel guardar o tipo de conta.",
                );
            }

            setSuccessMessage(
                "Perfil concluído com sucesso. A redirecionar...",
            );
            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 1000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao guardar.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDisconnectCredentials = async () => {
        if (isSubmitting || isDisconnectingCredentials) {
            return;
        }

        setError(null);
        setSuccessMessage(null);
        setIsDisconnectingCredentials(true);

        try {
            await signOut({ redirectUrl: "/login" });
        } catch {
            setError(
                "Nao foi possivel desassociar as credenciais agora. Tente novamente.",
            );
            setIsDisconnectingCredentials(false);
        }
    };

    return (
        <div className="w-full max-w-2xl">
            <div className="space-y-8 rounded-3xl border border-blue-200/20 bg-slate-950/60 p-6 backdrop-blur-xl backdrop-saturate-150 md:p-8">
                <div className="flex items-center gap-3 border-b border-blue-200/20 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-blue-200/30 bg-slate-950/70 shadow-[0_10px_30px_rgba(15,23,42,0.65)]">
                        <Image
                            src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-logo-white.png"
                            width={48}
                            height={48}
                            alt="TeamAction"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            Criar Conta{" "}
                            <span className="font-bold">TeamAction</span>
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-300">
                            Escolha o tipo de conta e complete o registo
                        </p>
                    </div>
                </div>

                {stage === "form" ? (
                    <>
                        <div className="grid gap-6 md:grid-cols-2">
                            {OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const active = selected === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            setSelected(option.value)
                                        }
                                        className={`text-left rounded-lg border p-4 transition-colors ${
                                            active
                                                ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon className="h-5 w-5 mt-0.5 text-emerald-500" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-300 dark:text-white">
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Primeiro Nome
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(event) =>
                                            setFirstName(event.target.value)
                                        }
                                        className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="Primeiro nome"
                                    />
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Último Nome
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(event) =>
                                            setLastName(event.target.value)
                                        }
                                        className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="Último nome"
                                    />
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={emailAddress}
                                        readOnly
                                        aria-readonly="true"
                                        className="peer block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                    />
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Data de Nascimento
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={birthDate}
                                    onChange={(event) =>
                                        setBirthDate(event.target.value)
                                    }
                                    min={minBirthDate}
                                    max={maxBirthDate}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                Palavra-passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={MIN_PASSWORD_LENGTH}
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        if (!passwordTouched) {
                                            setPasswordTouched(true);
                                        }
                                    }}
                                    onBlur={() => setPasswordTouched(true)}
                                    className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 py-3 pl-10 pr-12 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Minimo de 8 caracteres"
                                />
                                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray dark:text-gray-500" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((value) => !value)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Ocultar palavra-passe"
                                            : "Mostrar palavra-passe"
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-200"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {passwordTouched &&
                                password.length > 0 &&
                                !passwordValidation.isValid && (
                                    <p className="text-xs text-red-400">
                                        A palavra-passe deve cumprir todos os
                                        critérios abaixo.
                                    </p>
                                )}
                            {passwordTouched && passwordPrecheckNotice && (
                                <p
                                    className={`text-xs ${
                                        isCheckingPasswordBreach
                                            ? "text-slate-300"
                                            : isPasswordBreached
                                              ? "text-red-400"
                                              : passwordPrecheckNotice ===
                                                  PRECHECK_UNAVAILABLE_MESSAGE
                                                ? "text-amber-300"
                                                : "text-emerald-400"
                                    } flex items-start gap-1.5`}
                                >
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{passwordPrecheckNotice}</span>
                                </p>
                            )}
                            {(passwordTouched || password.length > 0) && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-300">
                                            Força da palavra-passe
                                        </span>
                                        <span className="font-semibold text-slate-200">
                                            {passwordStrengthLabel}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/70">
                                        <div
                                            className={`h-full transition-all duration-300 ${passwordStrengthColorClass}`}
                                            style={{
                                                width: `${(passwordValidation.score / 5) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-1 text-xs sm:grid-cols-2">
                                        <p
                                            className={
                                                passwordValidation.hasMinLength
                                                    ? "text-emerald-400"
                                                    : "text-slate-400"
                                            }
                                        >
                                            Min. {MIN_PASSWORD_LENGTH}{" "}
                                            caracteres
                                        </p>
                                        <p
                                            className={
                                                passwordValidation.hasUppercase
                                                    ? "text-emerald-400"
                                                    : "text-slate-400"
                                            }
                                        >
                                            1 letra maiúscula
                                        </p>
                                        <p
                                            className={
                                                passwordValidation.hasLowercase
                                                    ? "text-emerald-400"
                                                    : "text-slate-400"
                                            }
                                        >
                                            1 letra minúscula
                                        </p>
                                        <p
                                            className={
                                                passwordValidation.hasNumber
                                                    ? "text-emerald-400"
                                                    : "text-slate-400"
                                            }
                                        >
                                            1 número
                                        </p>
                                        <p
                                            className={
                                                passwordValidation.hasSpecialChar
                                                    ? "text-emerald-400"
                                                    : "text-slate-400"
                                            }
                                        >
                                            1 caractere especial
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-3 md:items-start">
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Foto de perfil (opcional)
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        id="complete-account-profile-photo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="complete-account-profile-photo"
                                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-700/35 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
                                    >
                                        Escolher ficheiro
                                    </label>
                                    <span className="max-w-full truncate text-sm text-gray-300">
                                        {profilePhoto?.name ||
                                            "Nenhum ficheiro selecionado"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-400">
                                    Tipos permitidos: JPG, PNG, WEBP. Tamanho
                                    máximo: 5MB.
                                </p>
                            </div>

                            <div className="md:col-span-1">
                                <p className="text-xs text-gray-400 dark:text-gray-400 mb-2">
                                    Preview
                                </p>
                                <div className="flex justify-center">
                                    {photoPreviewUrl ? (
                                        <img
                                            src={photoPreviewUrl}
                                            alt="Preview da foto"
                                            className="h-16 w-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-gray-400/70 dark:border-gray-600 bg-slate-900/30">
                                            <User className="h-7 w-7 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : stage === "president-profile" ? (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-blue-200/20 bg-slate-900/50 p-4">
                            <p className="text-sm font-semibold text-white">
                                Presidente - Dados do Clube
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                Complete os dados para criar o perfil do clube.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={presidentClubName}
                                    onChange={(event) =>
                                        setPresidentClubName(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Nome do clube"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Modalidade
                                </label>
                                <select
                                    required
                                    value={presidentSport}
                                    onChange={(event) =>
                                        setPresidentSport(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                >
                                    <option value="">
                                        Selecione uma modalidade
                                    </option>
                                    {PRESIDENT_SPORT_OPTIONS.map((sport) => (
                                        <option key={sport} value={sport}>
                                            {sport}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    IBAN (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentIban}
                                    onChange={(event) =>
                                        setPresidentIban(
                                            normalizeIban(event.target.value),
                                        )
                                    }
                                    maxLength={IBAN_FORMATTED_MAX_LENGTH}
                                    inputMode="numeric"
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="PT50 0000 0000 0000 0000 0000 0"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    NIPC (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentNipc}
                                    onChange={(event) =>
                                        setPresidentNipc(
                                            formatNipc(event.target.value),
                                        )
                                    }
                                    maxLength={11}
                                    inputMode="numeric"
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Ex: 501 234 567"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Website (opcional)
                                </label>
                                <input
                                    type="url"
                                    value={presidentWebsite}
                                    onChange={(event) =>
                                        setPresidentWebsite(
                                            normalizeWebsite(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="https://www.exemplo.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Telefone (opcional)
                                </label>
                                <input
                                    type="tel"
                                    value={presidentPhone}
                                    onChange={(event) =>
                                        setPresidentPhone(
                                            formatPortuguesePhone(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    maxLength={17}
                                    inputMode="numeric"
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Ex: (351) 912 345 678"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Morada (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentAddress}
                                    onChange={(event) =>
                                        setPresidentAddress(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Rua, número, complemento..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Código Postal (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={presidentPostalCode}
                                    onChange={(event) =>
                                        setPresidentPostalCode(
                                            normalizePostalCode(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    maxLength={8}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="0000-000"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={presidentCity}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                    placeholder="Preenchida automaticamente"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    País
                                </label>
                                <input
                                    type="text"
                                    value={PORTUGAL_COUNTRY}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                ) : stage === "athlete-profile" ? (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-blue-200/20 bg-slate-900/50 p-4">
                            <p className="text-sm font-semibold text-white">
                                Atleta - Dados Desportivos
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                Preencha os dados para criar o perfil de atleta.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Altura (cm)
                                </label>
                                <input
                                    type="number"
                                    min={ATHLETE_HEIGHT_MIN_CM}
                                    max={ATHLETE_HEIGHT_MAX_CM}
                                    step="1"
                                    required
                                    value={alturaCm}
                                    onChange={(event) =>
                                        setAlturaCm(
                                            normalizeAthleteHeightInput(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    onBlur={(event) =>
                                        setAlturaCm(
                                            clampAthleteHeightInput(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Ex: 172"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Peso (kg)
                                </label>
                                <input
                                    type="number"
                                    min={ATHLETE_WEIGHT_MIN_KG}
                                    max={ATHLETE_WEIGHT_MAX_KG}
                                    step="0.01"
                                    required
                                    value={pesoKg}
                                    onChange={(event) =>
                                        setPesoKg(
                                            normalizeAthleteWeightInput(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    onBlur={(event) =>
                                        setPesoKg(
                                            clampAthleteWeightInput(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Ex: 63.5"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Clube (opcional)
                                </label>
                                <input
                                    type="text"
                                    list="athlete-club-options"
                                    value={athleteClubName}
                                    onChange={(event) =>
                                        setAthleteClubName(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Pesquisar clube"
                                />
                                <datalist id="athlete-club-options">
                                    {athleteClubOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.label}
                                        />
                                    ))}
                                </datalist>
                                {athleteClubName.trim().length > 0 &&
                                    !selectedAthleteClubOption && (
                                        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                            Não existe clube cadastrado com esse
                                            nome.
                                        </p>
                                    )}
                                {selectedAthleteClubOption && (
                                    <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                        Pendente de aprovação do clube (
                                        {selectedAthleteClubOption.label})
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Treinador (opcional)
                                </label>
                                <input
                                    type="text"
                                    list="athlete-trainer-options"
                                    value={athleteTrainerName}
                                    onChange={(event) =>
                                        setAthleteTrainerName(
                                            event.target.value,
                                        )
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Pesquisar treinador"
                                />
                                <datalist id="athlete-trainer-options">
                                    {athleteTrainerOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.label}
                                        />
                                    ))}
                                </datalist>
                                {athleteTrainerName.trim().length > 0 &&
                                    !selectedAthleteTrainerOption && (
                                        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                            Não existe treinador cadastrado com
                                            esse nome.
                                        </p>
                                    )}
                                {selectedAthleteTrainerOption && (
                                    <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                        Pendente de aprovação do treinador (
                                        {selectedAthleteTrainerOption.label})
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Equipa (opcional)
                                </label>
                                <input
                                    type="text"
                                    list="athlete-team-options"
                                    value={athleteTeamName}
                                    onChange={(event) =>
                                        setAthleteTeamName(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Pesquisar equipa"
                                />
                                <datalist id="athlete-team-options">
                                    {athleteTeamOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.label}
                                        />
                                    ))}
                                </datalist>
                                {athleteTeamName.trim().length > 0 &&
                                    !selectedAthleteTeamOption && (
                                        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                            Não existe equipa cadastrada com
                                            esse nome.
                                        </p>
                                    )}
                                {selectedAthleteTeamOption && (
                                    <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                        Pendente de aprovação da equipa (
                                        {selectedAthleteTeamOption.label})
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Morada (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={athleteAddress}
                                    onChange={(event) =>
                                        setAthleteAddress(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Rua, número, complemento..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Código Postal (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={athletePostalCode}
                                    onChange={(event) =>
                                        setAthletePostalCode(
                                            normalizePostalCode(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    maxLength={8}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="0000-000"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={athleteCity}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                    placeholder="Preenchida automaticamente"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    País
                                </label>
                                <input
                                    type="text"
                                    value={PORTUGAL_COUNTRY}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                />
                            </div>
                        </div>

                        {athleteNeedsResponsible && (
                            <div className="space-y-1 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
                                <label className="block text-sm font-medium text-red-200">
                                    Responsável (e-mail obrigatório para menor)
                                </label>
                                <input
                                    type="email"
                                    required
                                    list="athlete-responsible-email-options"
                                    value={athleteResponsibleEmail}
                                    onChange={(event) =>
                                        setAthleteResponsibleEmail(
                                            event.target.value,
                                        )
                                    }
                                    className="block w-full rounded-lg border border-red-400/40 bg-slate-900/60 px-3 py-3 text-sm text-white outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300 transition-all"
                                    placeholder="email do responsável"
                                />
                                <datalist id="athlete-responsible-email-options">
                                    {athleteResponsibleEmailOptions.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.label}
                                            />
                                        ),
                                    )}
                                </datalist>
                                {athleteResponsibleEmail.trim().length > 0 && (
                                    <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                        Pendente de aprovação do responsável de
                                        e-mail{" "}
                                        <strong>
                                            {athleteResponsibleEmail.trim()}
                                        </strong>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-blue-200/20 bg-slate-900/50 p-4">
                            <p className="text-sm font-semibold text-white">
                                Treinador - Dados Profissionais
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                Complete os dados para criar o perfil de
                                treinador.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Modalidade
                                </label>
                                <select
                                    required
                                    value={trainerModality}
                                    onChange={(event) =>
                                        setTrainerModality(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                >
                                    <option value="">
                                        Selecione uma modalidade
                                    </option>
                                    {PRESIDENT_SPORT_OPTIONS.map((sport) => (
                                        <option key={sport} value={sport}>
                                            {sport}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Nacionalidade
                                </label>
                                <select
                                    required
                                    value={trainerNationality}
                                    onChange={(event) =>
                                        setTrainerNationality(
                                            event.target.value,
                                        )
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                >
                                    <option value="">Selecione um país</option>
                                    {COUNTRY_OPTIONS.map((country) => (
                                        <option key={country} value={country}>
                                            {country}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Cursos IPJD/PNFT
                                </label>
                                <select
                                    required
                                    value={trainerCourseModality}
                                    onChange={(event) =>
                                        setTrainerCourseModality(
                                            event.target.value,
                                        )
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                >
                                    <option
                                        value={TRAINER_AMATEUR_COURSE_VALUE}
                                    >
                                        {TRAINER_AMATEUR_COURSE_LABEL}
                                    </option>
                                    {trainerCourseModalityOptions.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {trainerCourseModality !==
                                TRAINER_AMATEUR_COURSE_VALUE && (
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                        Grau Técnico
                                    </label>
                                    <select
                                        required
                                        value={trainerTechnicalLevel}
                                        onChange={(event) =>
                                            setTrainerTechnicalLevel(
                                                event.target.value,
                                            )
                                        }
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    >
                                        <option value="">
                                            Selecione o grau técnico
                                        </option>
                                        {trainerTechnicalLevelOptions.map(
                                            (option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Morada (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={trainerAddress}
                                    onChange={(event) =>
                                        setTrainerAddress(event.target.value)
                                    }
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Rua, número, complemento..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Código Postal (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={trainerPostalCode}
                                    onChange={(event) =>
                                        setTrainerPostalCode(
                                            normalizePostalCode(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    maxLength={8}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/30 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="0000-000"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={trainerCity}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                    placeholder="Preenchida automaticamente"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 dark:text-gray-300">
                                    País
                                </label>
                                <input
                                    type="text"
                                    value={PORTUGAL_COUNTRY}
                                    readOnly
                                    aria-readonly="true"
                                    className="block w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-emerald-50/20 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-300 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                        {error}
                    </p>
                )}

                {successMessage && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
                        {successMessage}
                    </p>
                )}

                <div
                    className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
                        stage === "form"
                            ? "sm:justify-between"
                            : "sm:justify-between"
                    }`}
                >
                    {stage === "form" && (
                        <button
                            type="button"
                            onClick={handleDisconnectCredentials}
                            disabled={
                                isSubmitting || isDisconnectingCredentials
                            }
                            className="text-left text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 disabled:opacity-60"
                        >
                            <span className="block">Ja tenho conta</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                (desassociar credenciais)
                            </span>
                        </button>
                    )}
                    {stage !== "form" && (
                        <button
                            type="button"
                            onClick={() => setStage("form")}
                            disabled={
                                isSubmitting || isDisconnectingCredentials
                            }
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 disabled:opacity-60"
                        >
                            Voltar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            isDisconnectingCredentials ||
                            Boolean(successMessage)
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/35 transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
                    >
                        {isDisconnectingCredentials
                            ? "A desassociar..."
                            : isSubmitting
                              ? "A guardar..."
                              : stage === "president-profile"
                                ? "Concluir perfil"
                                : stage === "trainer-profile"
                                  ? "Concluir perfil"
                                  : stage === "athlete-profile"
                                    ? "Concluir perfil"
                                    : `Continuar como ${accountTypeLabel}`}
                    </button>
                </div>
            </div>

            {isSubmitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                    <div
                        role="status"
                        aria-live="polite"
                        className="mx-4 w-full max-w-sm rounded-2xl border border-blue-200/20 bg-slate-900/95 p-6 text-center shadow-2xl"
                    >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-300" />
                        </div>
                        <p className="text-base font-semibold text-white">
                            Estamos a verificar os seus dados
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                            Aguarde um momento para concluir a criação da conta.
                        </p>
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/70">
                            <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-400" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
