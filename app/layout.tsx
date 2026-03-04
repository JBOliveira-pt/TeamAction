import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/app/components/theme-provider";
import { FaviconManager } from "@/app/components/favicon-manager";

export const metadata: Metadata = {
    title: "PrimeFlow Dashboard",
    description: "PrimeFlow finance operations dashboard.",
    metadataBase: new URL("https://next-learn-dashboard.vercel.sh"),
    openGraph: {
        title: "PrimeFlow Dashboard",
        description: "PrimeFlow finance operations dashboard.",
        images: [
            {
                url: "https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/primeflow-ecrans.png",
                width: 1000,
                height: 760,
                alt: "PrimeFlow Dashboard Preview",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "PrimeFlow Dashboard",
        description: "PrimeFlow finance operations dashboard.",
        images: [
            "https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/primeflow-ecrans.png",
        ],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider
            signInUrl="/login"
            signUpUrl="/signup"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
        >
            <html lang="en" className="h-full">
                <head>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                (function() {
                                    // Apply dark mode class based on saved theme
                                    const theme = localStorage.getItem('theme') || 'light';
                                    if (theme === 'dark') {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                    
                                    // Update favicon based on SYSTEM preferences (not saved theme)
                                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                    const faviconUrl = prefersDark
                                        ? 'https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/favicon-white.ico'
                                        : 'https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/favicon-black.ico';
                                    
                                    // Remove existing favicons
                                    const existingLinks = document.querySelectorAll("link[rel*='icon']");
                                    existingLinks.forEach(function(link) { link.remove(); });
                                    
                                    // Create new favicon link
                                    const link = document.createElement('link');
                                    link.type = 'image/x-icon';
                                    link.rel = 'shortcut icon';
                                    link.href = faviconUrl + '?v=' + Date.now();
                                    document.getElementsByTagName('head')[0].appendChild(link);
                                    
                                    console.log('Favicon inicial:', prefersDark ? 'white' : 'black');
                                })();
                            `,
                        }}
                    />
                </head>
                <body
                    className={`${inter.className} h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased`}
                >
                    <ThemeProvider>
                        <FaviconManager />
                        {children}
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
