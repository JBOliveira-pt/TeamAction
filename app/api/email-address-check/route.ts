// Rota API email-address-check: verifica se um e-mail e valido no Clerk.
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function getClerkErrorMessage(error: unknown): string {
    if (
        error &&
        typeof error === "object" &&
        "errors" in error &&
        Array.isArray((error as { errors?: unknown[] }).errors)
    ) {
        const firstError = (error as { errors: any[] }).errors[0];
        return (
            firstError?.longMessage ||
            firstError?.message ||
            "Não foi possível validar o e-mail no Clerk."
        );
    }

    return "Não foi possível validar o e-mail no Clerk.";
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as { email?: unknown };
        const email = typeof body.email === "string" ? body.email.trim() : "";

        if (!email) {
            return NextResponse.json(
                {
                    valid: false,
                    message: "Email address must be a valid email address.",
                },
                { status: 400 },
            );
        }

        const client = await clerkClient();
        await client.users.getUserList({
            emailAddress: [email],
            limit: 1,
        });

        return NextResponse.json({ valid: true });
    } catch (error) {
        const message = getClerkErrorMessage(error);
        if (message.toLowerCase().includes("valid email address")) {
            return NextResponse.json(
                {
                    valid: false,
                    message: "Email address must be a valid email address.",
                },
                { status: 400 },
            );
        }

        return NextResponse.json(
            {
                valid: false,
                message: "Não foi possível validar o e-mail no Clerk.",
            },
            { status: 502 },
        );
    }
}
