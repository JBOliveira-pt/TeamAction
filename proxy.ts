import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

function normalizeAccountType(value: unknown): AccountType | null {
    if (typeof value !== "string") return null;

    const normalized = value.toLowerCase();
    if (
        normalized === "presidente" ||
        normalized === "treinador" ||
        normalized === "atleta" ||
        normalized === "responsavel"
    ) {
        return normalized;
    }

    return null;
}

function defaultDashboardPath(accountType: AccountType): string {
    if (accountType === "presidente") return "/dashboard/presidente";
    if (accountType === "treinador") return "/dashboard/treinador";
    if (accountType === "atleta") return "/dashboard/utilizador/perfil";
    return "/dashboard";
}

function isPathAllowedForAccountType(
    path: string,
    accountType: AccountType,
): boolean {
    if (accountType === "presidente") {
        return path.startsWith("/dashboard/presidente");
    }

    if (accountType === "treinador") {
        return path.startsWith("/dashboard/treinador");
    }

    if (accountType === "atleta") {
        return path.startsWith("/dashboard/utilizador");
    }

    if (accountType === "responsavel") {
        return path === "/dashboard";
    }

    return true;
}

const isPublicRoute = createRouteMatcher([
    "/",
    "/login(.*)",
    "/signup(.*)",
    "/onboarding(.*)",
    "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);

    if (!isPublicRoute(request)) {
        await auth.protect();
    }

    const path = request.nextUrl.pathname;

    if (path.startsWith("/dashboard")) {
        const { sessionClaims } = await auth();
        const metadata = (sessionClaims?.metadata || {}) as {
            accountType?: unknown;
        };
        const accountType = normalizeAccountType(metadata.accountType);

        if (accountType) {
            const targetPath = defaultDashboardPath(accountType);

            if (path === "/dashboard") {
                if (targetPath !== "/dashboard") {
                    return NextResponse.redirect(new URL(targetPath, request.url));
                }
                return NextResponse.next({ request: { headers: requestHeaders } });
            }

            if (!isPathAllowedForAccountType(path, accountType)) {
                return NextResponse.redirect(new URL(targetPath, request.url));
            }
        }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
