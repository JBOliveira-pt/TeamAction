import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rotas que não precisam de login (incluindo o webhook)
const isPublicRoute = createRouteMatcher([
  '/login(.*)', 
  '/signup(.*)',
  "/onboarding(.*)", 
  '/api/webhooks(.*)',
]);

// ESTA LINHA É A MAIS IMPORTANTE:
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};