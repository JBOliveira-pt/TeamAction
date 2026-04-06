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
    if (accountType === "atleta") return "/dashboard/atleta";
    return "/dashboard/responsavel";
}

function isPathAllowedForAccountType(
    path: string,
    accountType: AccountType,
): boolean {
    // Rotas partilhadas acessíveis a qualquer accountType
    if (path.startsWith("/dashboard/definicoes")) {
        return true;
    }

    if (accountType === "presidente") {
        return path.startsWith("/dashboard/presidente");
    }

    if (accountType === "treinador") {
        return path.startsWith("/dashboard/treinador");
    }

    if (accountType === "atleta") {
        return (
            path.startsWith("/dashboard/atleta") ||
            path.startsWith("/dashboard/utilizador")
        );
    }

    if (accountType === "responsavel") {
        return path.startsWith("/dashboard/responsavel");
    }

    return true;
}

const isPublicRoute = createRouteMatcher([
    "/",
    "/login(.*)",
    "/signup(.*)",
    "/onboarding(.*)",
    "/admin(.*)",
    "/admin-login(.*)",
    "/api/admin(.*)",
    "/api/webhooks(.*)",
    "/api/password-breach-check(.*)",
    "/api/email-address-check(.*)",
    "/api/perfil-treinador/options(.*)",
    "/api/perfil-atleta/options(.*)",
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

        // Se não tem accountType no JWT, deixar passar — o dashboard layout
        // verifica a BD como fallback e redireciona se necessário.
        if (!accountType) {
            return NextResponse.next({ request: { headers: requestHeaders } });
        }

        const targetPath = defaultDashboardPath(accountType);

        if (path === "/dashboard") {
            if (targetPath !== "/dashboard") {
                return NextResponse.redirect(new URL(targetPath, request.url));
            }
            return NextResponse.next({
                request: { headers: requestHeaders },
            });
        }

        if (!isPathAllowedForAccountType(path, accountType)) {
            return NextResponse.redirect(new URL(targetPath, request.url));
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
