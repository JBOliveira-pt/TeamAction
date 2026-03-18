import { createHash } from "crypto";
import { NextResponse } from "next/server";

const HIBP_RANGE_API_URL = "https://api.pwnedpasswords.com/range";

function sha1Uppercase(value: string): string {
    return createHash("sha1").update(value).digest("hex").toUpperCase();
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as { password?: unknown };
        const password = typeof body.password === "string" ? body.password : "";

        if (!password) {
            return NextResponse.json({ breached: false, count: 0 });
        }

        const passwordHash = sha1Uppercase(password);
        const prefix = passwordHash.slice(0, 5);
        const suffix = passwordHash.slice(5);

        const response = await fetch(`${HIBP_RANGE_API_URL}/${prefix}`, {
            headers: {
                "Add-Padding": "true",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Não foi possível verificar a palavra-passe." },
                { status: 502 },
            );
        }

        const bodyText = await response.text();
        const lines = bodyText.split("\n");

        for (const line of lines) {
            const [hashSuffix, occurrences] = line.trim().split(":");
            if (hashSuffix?.toUpperCase() === suffix) {
                return NextResponse.json({
                    breached: true,
                    count: Number(occurrences || 0),
                });
            }
        }

        return NextResponse.json({ breached: false, count: 0 });
    } catch {
        return NextResponse.json(
            { error: "Não foi possível verificar a palavra-passe." },
            { status: 500 },
        );
    }
}
