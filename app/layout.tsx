import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import { Metadata } from "next";
import { ThemeProvider } from "@/app/components/theme-provider";
import { FaviconManager } from "@/app/components/favicon-manager";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
    title: "TeamAction Dashboard",
    description: "Plataforma de gestão de equipas desportivas.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <html
                lang="en"
                className="h-full scroll-smooth"
                suppressHydrationWarning
            >
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
                                        ? '${process.env.NEXT_PUBLIC_R2_IMAGES_URL}/teamaction-favicon-white.ico'
                                        : '${process.env.NEXT_PUBLIC_R2_IMAGES_URL}/teamaction-favicon-black.ico';
                                    
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
        </Providers>
    );
}
