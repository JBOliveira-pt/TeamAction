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
    if (accountType === "atleta") return "/dashboard/atleta/perfil";
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
        return path.startsWith("/dashboard/atleta");
    }

    if (accountType === "responsavel") {
        return path === "/dashboard";
    }

    return true;
}

// Rotas que não precisam de login (incluindo o webhook)
const isPublicRoute = createRouteMatcher([
    "/login(.*)",
    "/signup(.*)",
    "/onboarding(.*)",
    "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
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

        // Usuários antigos sem accountType continuam com comportamento legado.
        if (accountType) {
            const targetPath = defaultDashboardPath(accountType);

            if (path === "/dashboard") {
                if (targetPath !== "/dashboard") {
                    return NextResponse.redirect(
                        new URL(targetPath, request.url),
                    );
                }
                return NextResponse.next();
            }

            if (!isPathAllowedForAccountType(path, accountType)) {
                return NextResponse.redirect(new URL(targetPath, request.url));
            }
        }
    }

    // Lógica de roles — só actua nas rotas do dashboard
    //const { sessionClaims } = await auth();
    //const role = (sessionClaims?.metadata as { role?: string })?.role;
    //const path = request.nextUrl.pathname;

    // Se tentar aceder à área do presidente sem ser presidente ou admin → redireciona
    //if (path.startsWith("/dashboard/presidente")) {
    //if (role !== "presidente" && role !== "admin") {
    //return NextResponse.redirect(new URL("/login", request.url));
    //}
    //}
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
