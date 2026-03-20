import crypto from "node:crypto";

const TOKEN_EXPIRY_HOURS = 72;

function getSecret(): string {
    const secret =
        process.env.INVITE_TOKEN_SECRET || process.env.CLERK_SECRET_KEY;
    if (!secret) {
        throw new Error("INVITE_TOKEN_SECRET or CLERK_SECRET_KEY must be set");
    }
    return secret;
}

export interface InvitePayload {
    /** DB UUID of the athlete in `users` table */
    athleteUserId: string;
    /** Athlete display name */
    athleteName: string;
    /** Email of the responsible person */
    responsibleEmail: string;
    /** 6-digit verification code */
    code: string;
    /** Expiry timestamp (ms) */
    exp: number;
}

function sign(payload: InvitePayload): string {
    const json = JSON.stringify(payload);
    const base64 = Buffer.from(json).toString("base64url");
    const signature = crypto
        .createHmac("sha256", getSecret())
        .update(base64)
        .digest("base64url");
    return `${base64}.${signature}`;
}

function verify(token: string): InvitePayload | null {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return null;

    const base64 = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);
    if (!base64 || !signature) return null;

    const expected = crypto
        .createHmac("sha256", getSecret())
        .update(base64)
        .digest("base64url");

    if (
        signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
        return null;
    }

    try {
        const payload = JSON.parse(
            Buffer.from(base64, "base64url").toString(),
        ) as InvitePayload;

        if (
            typeof payload.athleteUserId !== "string" ||
            typeof payload.responsibleEmail !== "string" ||
            typeof payload.code !== "string" ||
            typeof payload.exp !== "number"
        ) {
            return null;
        }

        if (Date.now() > payload.exp) return null;

        return payload;
    } catch {
        return null;
    }
}

function generateCode(): string {
    return crypto.randomInt(100_000, 999_999).toString();
}

export function createInviteToken(
    athleteUserId: string,
    athleteName: string,
    responsibleEmail: string,
): { token: string; code: string } {
    const code = generateCode();
    const exp = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
    const token = sign({
        athleteUserId,
        athleteName,
        responsibleEmail,
        code,
        exp,
    });
    return { token, code };
}

export function verifyInviteToken(token: string): InvitePayload | null {
    return verify(token);
}
