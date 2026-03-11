import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
