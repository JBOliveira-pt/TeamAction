import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

const ADMIN_COOKIE_NAME = "teamaction_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

type AdminSessionPayload = {
    exp: number;
    nonce: string;
};

function getAdminSessionSecret(): string {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
    }
    return secret;
}

function sign(payload: AdminSessionPayload): string {
    const content = `${payload.exp}.${payload.nonce}`;
    return crypto
        .createHmac("sha256", getAdminSessionSecret())
        .update(content)
        .digest("hex");
}

export function createAdminSessionToken(): string {
    const payload: AdminSessionPayload = {
        exp: Date.now() + SESSION_DURATION_MS,
        nonce: crypto.randomBytes(16).toString("hex"),
    };

    return `${payload.exp}.${payload.nonce}.${sign(payload)}`;
}

export function isAdminSessionTokenValid(token: string | undefined): boolean {
    if (!token) return false;

    const [expRaw, nonce, signature] = token.split(".");
    if (!expRaw || !nonce || !signature) return false;

    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || exp < Date.now()) return false;

    const expectedSignature = sign({ exp, nonce });

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature),
        );
    } catch {
        return false;
    }
}

export async function getAdminSessionFromCookie(): Promise<string | undefined> {
    const store = await cookies();
    return store.get(ADMIN_COOKIE_NAME)?.value;
}

export async function requireAdminSession(): Promise<void> {
    const token = await getAdminSessionFromCookie();
    if (!isAdminSessionTokenValid(token)) {
        redirect("/admin-login");
    }
}

export async function setAdminSessionCookie(token: string): Promise<void> {
    const store = await cookies();
    store.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DURATION_MS / 1000,
    });
}

export async function clearAdminSessionCookie(): Promise<void> {
    const store = await cookies();
    store.delete(ADMIN_COOKIE_NAME);
}
