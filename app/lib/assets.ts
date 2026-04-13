// Mapeamento central de URLs de imagens e vídeos (Cloudflare R2).
const BASE = process.env.NEXT_PUBLIC_R2_IMAGES_URL;
const VIDEOS_BASE = process.env.NEXT_PUBLIC_R2_IMAGES_URL?.replace(
    "teamaction-images",
    "teamaction-videos",
);

export const ASSETS = {
    logoFullWhiteNoBg: `${BASE}/LogoTeamAction-Full-White-Nobg.png`,
    logoFullWhiteNoBgShadow: `${BASE}/LogoTeamAction-Full-White-Nobg-WithShadow.png`,
    logoWhite: `${BASE}/teamaction-logo-white.png`,
    logoBlack: `${BASE}/teamaction-logo-black.png`,
    logoFullWhite: `${BASE}/teamaction-logofull-white.png`,
    logoFullBlack: `${BASE}/teamaction-logofull-black.png`,
    loginBackground: `${BASE}/teamaction-login-background.png`,
    faviconWhite: `${BASE}/teamaction-favicon-white.ico`,
    faviconBlack: `${BASE}/teamaction-favicon-black.ico`,
    heroVideo: `${VIDEOS_BASE}/quadra-andebol-loop.mp4`,
    mosaicoFotos: `${BASE}/mosaico-fotosevideo.png`,
    mosaicoVideo: `${VIDEOS_BASE}/segurandobola-andebol.mp4`,
};

const PROFILE_PLACEHOLDERS: Record<string, string> = {
    presidente: `${BASE}/presidente-photo-placeholder.jpg`,
    treinador: `${BASE}/treinador-photo-placeholder.jpg`,
    atleta: `${BASE}/atleta-photo-placeholder.jpg`,
    responsavel: `${BASE}/responsavel-photo-placeholder.jpg`,
};

export function getProfilePlaceholder(accountType?: string | null): string {
    return (
        (accountType && PROFILE_PLACEHOLDERS[accountType]) ||
        PROFILE_PLACEHOLDERS.atleta
    );
}
